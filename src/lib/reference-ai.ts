/**
 * Sivun generointi referenssien pohjalta Claude API:lla (RAS-624). Ajetaan
 * vain palvelimella, avain ympäristömuuttujasta ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { BrandContext } from "./overlay-campaign";
import {
  REFERENCE_OUTPUT_SCHEMA,
  buildReferenceSystemPrompt,
  buildReferenceUserPrompt,
  parseReferencePage,
  type ReferenceBrief,
  type ReferencePageResult,
} from "./reference-page";
import type { ReferenceSkeleton } from "./reference-skeleton";

const MODEL = "claude-sonnet-5-5";

export type GenerateReferencePageResult =
  | ({ ok: true } & ReferencePageResult)
  | { ok: false; error: string };

export async function generateReferencePage(
  brand: BrandContext,
  brief: ReferenceBrief,
  references: ReferenceSkeleton[],
  makeId: () => string,
): Promise<GenerateReferencePageResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY puuttuu");
    return { ok: false, error: "AI-generointia ei ole otettu käyttöön." };
  }

  const client = new Anthropic();

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      // Kieltäytymisen sattuessa API ajaa pyynnön suositellulla varamallilla.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: REFERENCE_OUTPUT_SCHEMA },
      },
      system: [
        {
          type: "text",
          text: buildReferenceSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildReferenceUserPrompt(brand, brief, references) }],
    });
    const response = await stream.finalMessage();

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "AI ei voinut tehdä sivua näistä referensseistä." };
    }
    if (response.stop_reason === "max_tokens") {
      return { ok: false, error: "AI:n vastaus katkesi. Yritä uudelleen." };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const allowedImages = new Set(brief.mode === "own" ? references.flatMap((r) => r.images) : []);
    const page = parseReferencePage(text, allowedImages, makeId);
    if (!page) {
      return { ok: false, error: "AI ei palauttanut käyttökelpoista sivua. Yritä uudelleen." };
    }
    return { ok: true, ...page };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "AI on hetkellisesti ruuhkautunut. Yritä hetken päästä." };
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}:`, error.message);
      return { ok: false, error: "AI-generointi epäonnistui. Yritä uudelleen." };
    }
    console.error("Claude API connection error:", error);
    return { ok: false, error: "AI-palveluun ei saatu yhteyttä." };
  }
}
