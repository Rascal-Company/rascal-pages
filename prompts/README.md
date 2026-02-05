# Landing Page Builder AI Prompts

This directory contains AI agent prompts and documentation for generating landing page configurations for Rascal Pages.

## Files

- **`landing-page-builder.md`** - Comprehensive system prompt for AI agents (Claude, GPT, etc.) to generate valid `TemplateConfig` JSON from user input

## Overview

The Rascal Pages landing page builder uses a section-based architecture with 9 available section types and 5 pre-built templates. The AI agent prompt enables automated landing page generation through:

1. User provides basic information (title, description, CTA link)
2. AI agent analyzes the input and selects appropriate template
3. AI generates complete, type-safe `TemplateConfig` JSON
4. Application creates landing page from the configuration

## Quick Start

### Using with Claude API (Anthropic)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load the system prompt
const systemPrompt = fs.readFileSync(
  "prompts/landing-page-builder.md",
  "utf-8",
);

async function generateLandingPage(
  title: string,
  description: string,
  link: string,
) {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: JSON.stringify({ title, description, link }),
      },
    ],
  });

  // Parse the response
  const jsonResponse = message.content[0].text;
  const config = JSON.parse(jsonResponse);

  return config;
}

// Example usage
const config = await generateLandingPage(
  "SEO-opas 2024",
  "Kattava opas hakukoneoptimoinnista. Sopii yrittäjille ja markkinoijille.",
  "https://example.com/download",
);

console.log(JSON.stringify(config, null, 2));
```

### Using with OpenAI API

```typescript
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load the system prompt
const systemPrompt = fs.readFileSync(
  "prompts/landing-page-builder.md",
  "utf-8",
);

async function generateLandingPage(
  title: string,
  description: string,
  link: string,
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({ title, description, link }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const config = JSON.parse(completion.choices[0].message.content);
  return config;
}
```

### Using with N8N Workflow

The current implementation uses N8N webhook integration. To use the AI prompt in N8N:

1. **HTTP Request Node** - Receives webhook from `create-ai-site.ts` Server Action

2. **AI Agent Node (Claude/GPT)** - Configure the AI node:
   - Model: Claude 3.5 Sonnet or GPT-4 Turbo
   - System Prompt: Paste contents of `landing-page-builder.md`
   - User Message:
     ```json
     {
       "title": "{{ $json.title }}",
       "description": "{{ $json.description }}",
       "link": "{{ $json.link }}"
     }
     ```

3. **JSON Parser Node** - Parse the AI response to validate JSON structure

4. **Validation Node** (optional) - Validate against TemplateConfig schema

5. **Supabase Insert Node** - Create site and page records:

   ```sql
   -- Insert site
   INSERT INTO sites (user_id, subdomain, custom_domain)
   VALUES ({{ $json.orgId }}, {{ $json.subdomain }}, null)
   RETURNING id;

   -- Insert page
   INSERT INTO pages (site_id, content, is_published)
   VALUES ({{ $json.siteId }}, {{ $json.config }}, false);
   ```

6. **HTTP Response Node** - Return success/error to application

### Environment Variables for N8N

Add to your `.env.local`:

```bash
N8N_LANDINGPAGE_BUILDER=https://your-n8n-instance.com/webhook/landing-page-builder
```

## Testing the Prompt Locally

### Using the Claude CLI

If you have Claude Code installed:

1. Create a test script:

```typescript
// test-prompt.ts
import fs from "fs";

const systemPrompt = fs.readFileSync(
  "prompts/landing-page-builder.md",
  "utf-8",
);

const testInput = {
  title: "SEO-opas 2024",
  description: "Kattava opas hakukoneoptimoinnista yrittäjille",
  link: "https://example.com/download",
};

console.log("=== SYSTEM PROMPT ===");
console.log(systemPrompt);
console.log("\n=== USER INPUT ===");
console.log(JSON.stringify(testInput, null, 2));
```

2. Run with Claude:

```bash
claude-code test-prompt.ts
```

3. Copy the system prompt and test input to Claude.ai and verify the output

### Manual Testing Checklist

Test the prompt with various inputs to ensure quality:

- [ ] **Lead Magnet**: E-book download, checklist, guide
- [ ] **Waitlist**: Pre-launch page, beta signup, coming soon
- [ ] **SaaS Modern**: Full product page, B2B software, app
- [ ] **VSL**: Video course, webinar, high-ticket offer
- [ ] **Personal**: Coach, consultant, freelancer, expert

For each test:

1. Verify JSON is valid (no syntax errors)
2. Verify all required fields are present
3. Verify content is in Finnish
4. Verify section IDs follow naming conventions
5. Verify CTAs are action-oriented
6. Verify benefits-focused copy
7. Verify appropriate section count (3-8)

## Prompt Versioning

The prompt file (`landing-page-builder.md`) should be versioned along with code changes to the template system.

### When to Update the Prompt

Update the prompt when:

- New section types are added to `src/lib/templates.ts`
- Section content structure changes (TypeScript types)
- New templates are added
- Field validations change
- Best practices evolve

### Version History

Track major prompt changes in this section:

**v1.0.0** (2024-02-05)

- Initial comprehensive prompt
- Support for all 9 section types
- Support for all 5 templates (lead-magnet, waitlist, saas-modern, vsl, personal)
- Finnish content generation
- Validation rules and examples

## Common Issues and Solutions

### Issue: AI generates deprecated top-level fields

**Problem**: Output includes `hero`, `features`, etc. at the top level instead of in `sections` array.

**Solution**: The prompt explicitly forbids this in validation rules. If it still happens:

1. Add more examples showing correct structure
2. Emphasize the validation rules section
3. Add a pre-processing step to detect and reject invalid output

### Issue: Content is not in Finnish

**Problem**: AI generates English content despite Finnish instruction.

**Solution**:

1. Provide more Finnish examples
2. Add "CRITICAL: All content MUST be in Finnish" to system prompt
3. Use post-processing to detect English and regenerate

### Issue: Form sections missing successMessage

**Problem**: Forms are generated without required `successMessage` field.

**Solution**: Validation rule #10 catches this. Ensure AI checks validation rules before output.

### Issue: Section IDs don't follow naming convention

**Problem**: Section IDs like "hero1" instead of "lm-hero-1".

**Solution**: Add explicit examples in each template example showing proper ID format.

### Issue: Too many or too few sections

**Problem**: Generated pages have 15 sections or just 2.

**Solution**: Validation rule #7 enforces 3-8 sections. Add template-specific guidance.

## Template System Reference

### Available Templates

| Template ID   | Use Case                     | Sections                                         | Count |
| ------------- | ---------------------------- | ------------------------------------------------ | ----- |
| `lead-magnet` | Free downloads, lead magnets | hero (w/ form), features, faq (optional), footer | 3-5   |
| `waitlist`    | Pre-launch, coming soon      | hero, form, footer                               | 3     |
| `saas-modern` | Full product pages, SaaS     | hero, logos, features, faq, footer               | 5     |
| `vsl`         | Video sales letters          | hero, video, footer                              | 3     |
| `personal`    | Coaches, consultants         | hero, about, testimonials, footer                | 4     |

### Section Type Capabilities

| Section Type   | Content Type      | Use In Templates                              |
| -------------- | ----------------- | --------------------------------------------- |
| `hero`         | HeroContent       | All                                           |
| `features`     | FeatureItem[]     | lead-magnet, saas-modern, personal (optional) |
| `faq`          | FaqItem[]         | saas-modern, lead-magnet (optional)           |
| `testimonials` | TestimonialItem[] | personal, saas-modern (optional)              |
| `about`        | AboutContent      | personal                                      |
| `video`        | VideoContent      | vsl                                           |
| `form`         | FormContent       | lead-magnet, waitlist                         |
| `logos`        | null              | saas-modern                                   |
| `footer`       | null              | All (required as last section)                |

## Integration with Rascal Pages

### Current Flow

1. User fills out `CreateAiSiteModal.tsx` (title, description, link)
2. `create-ai-site.ts` Server Action sends data to N8N webhook
3. N8N workflow uses AI agent with this prompt to generate TemplateConfig
4. N8N creates site and page records in Supabase
5. User sees new site in dashboard

### Future Direct Integration

To integrate AI generation directly into the application without N8N:

1. Add Anthropic or OpenAI SDK to dependencies:

```bash
npm install @anthropic-ai/sdk
# or
npm install openai
```

2. Create new Server Action `app/actions/create-ai-site-direct.ts`:

```typescript
"use server";

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { createClient } from "@/src/utils/supabase/server";
import type { TemplateConfig } from "@/src/lib/templates";

const systemPrompt = fs.readFileSync(
  "prompts/landing-page-builder.md",
  "utf-8",
);

export async function createAiSiteDirect(input: {
  title: string;
  description: string;
  link: string;
}) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Ei kirjautunut" };

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) return { success: false, error: "Org not found" };

  // Generate config with AI
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const configJson = message.content[0].text;
  const config: TemplateConfig = JSON.parse(configJson);

  // Create site and page
  const subdomain = generateSubdomain(input.title);

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      user_id: orgMember.org_id,
      subdomain,
    })
    .select()
    .single();

  if (siteError || !site) {
    return { success: false, error: "Site creation failed" };
  }

  const { error: pageError } = await supabase.from("pages").insert({
    site_id: site.id,
    content: config,
    is_published: false,
  });

  if (pageError) {
    return { success: false, error: "Page creation failed" };
  }

  return { success: true, siteId: site.id };
}
```

3. Update `CreateAiSiteModal.tsx` to use new action

4. Add environment variable:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Estimation

### Claude API Costs

Using Claude 3.5 Sonnet (as of 2024):

- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

Estimated tokens per generation:

- System prompt: ~8,000 tokens
- User input: ~100 tokens
- Generated output: ~1,500 tokens

**Cost per generation**: ~$0.05 USD

For 1,000 landing pages/month: ~$50 USD

### OpenAI API Costs

Using GPT-4 Turbo (as of 2024):

- Input: ~$10 per million tokens
- Output: ~$30 per million tokens

**Cost per generation**: ~$0.13 USD

For 1,000 landing pages/month: ~$130 USD

**Recommendation**: Use Claude 3.5 Sonnet for better cost efficiency.

## Best Practices

### 1. Always Validate Output

Never trust AI output directly. Always validate:

```typescript
import type { TemplateConfig } from "@/src/lib/templates";

function validateTemplateConfig(config: unknown): config is TemplateConfig {
  if (typeof config !== "object" || config === null) return false;

  const c = config as TemplateConfig;

  // Check required fields
  if (!c.templateId || !c.theme?.primaryColor || !c.sections) return false;

  // Check section count
  if (c.sections.length < 3 || c.sections.length > 8) return false;

  // Check first section is hero
  if (c.sections[0]?.type !== "hero") return false;

  // Check last section is footer
  const lastSection = c.sections[c.sections.length - 1];
  if (lastSection?.type !== "footer") return false;

  // Check unique section IDs
  const ids = new Set(c.sections.map((s) => s.id));
  if (ids.size !== c.sections.length) return false;

  return true;
}
```

### 2. Handle Errors Gracefully

AI can fail or produce invalid output. Always have fallbacks:

```typescript
try {
  const config = await generateWithAI(input);

  if (!validateTemplateConfig(config)) {
    // Fallback to default template
    return getDefaultTemplate().defaultContent;
  }

  return config;
} catch (error) {
  console.error("AI generation failed:", error);
  return getDefaultTemplate().defaultContent;
}
```

### 3. Monitor Quality

Track AI output quality:

- Log all generations
- Track validation failures
- Collect user feedback on generated pages
- A/B test AI-generated vs manual templates

### 4. Iterate on the Prompt

The prompt should evolve based on:

- Common validation failures
- User feedback
- New template features
- Industry best practices

## Contributing

To improve the AI prompt:

1. Test with diverse inputs
2. Identify common failure patterns
3. Update examples and validation rules
4. Test changes thoroughly
5. Document changes in version history

## Support

For issues or questions:

- Check Common Issues section above
- Review template types in `src/lib/templates.ts`
- Consult full conversation history for context

## License

Same as Rascal Pages application.
