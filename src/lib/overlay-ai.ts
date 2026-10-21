/**
 * Kohderyhmäkohtaiset tekstit Claude API:lla. Ajetaan vain palvelimella
 * (server action), avain ympäristömuuttujasta ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  COPY_OUTPUT_SCHEMA,
  buildCopySystemPrompt,
  buildCopyUserPrompt,
  parseGeneratedTexts,
  textSlots,
  type CopyBrief,
  type BrandContext,
  type OverlaySlot,
  type OverlaySlotValues,
} from "./overlay-campaign";

const MODEL = "claude-sonnet-5-5";

export type GenerateCopyResult =
  | { ok: true; values: OverlaySlotValues }
  | { ok: false; error: string };

export async function generateVariantCopy(
  brand: BrandContext,
  brief: CopyBrief,
  slots: OverlaySlot[],
): Promise<GenerateCopyResult> {
  if (textSlots(slots).length === 0) {
    return { ok: false, error: "Lisää elementtilistaan ensin vähintään yksi teksti." };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY puuttuu");
    return { ok: false, error: "AI-generointia ei ole otettu käyttöön." };
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Kieltäytymisen sattuessa API ajaa pyynnön suositellulla varamallilla.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: COPY_OUTPUT_SCHEMA },
      },
      system: [
        {
          type: "text",
          text: buildCopySystemPrompt(brand),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildCopyUserPrompt(brief, slots) }],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "AI ei voinut kirjoittaa tekstejä tälle variaatiolle." };
    }
    if (response.stop_reason === "max_tokens") {
      return { ok: false, error: "AI:n vastaus katkesi. Yritä uudelleen." };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const values = parseGeneratedTexts(text, slots);
    if (Object.keys(values).length === 0) {
      return { ok: false, error: "AI ei palauttanut tekstejä. Yritä uudelleen." };
    }
    return { ok: true, values };
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
