# N8N Landing Page Builder - Workflow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Rascal Pages Application                        │
│                                                                         │
│  ┌──────────────────┐       ┌──────────────────┐                      │
│  │  CreateAiSiteModal│──────▶│  create-ai-site  │                      │
│  │  (User Input)     │       │  (Server Action) │                      │
│  └──────────────────┘       └──────────┬───────┘                      │
│                                         │                               │
│                                         │ POST Request                  │
│                                         │ {title, description, link,    │
│                                         │  userId, orgId, userEmail}    │
└─────────────────────────────────────────┼───────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            N8N Workflow                                 │
│                                                                         │
│  ┌──────────────────┐       ┌──────────────────┐                      │
│  │   1. Webhook     │──────▶│  2. Set Variables│                      │
│  │   Trigger        │       │                  │                      │
│  └──────────────────┘       └──────────┬───────┘                      │
│                                         │                               │
│                                         ▼                               │
│                              ┌──────────────────┐                      │
│                              │  3. Generate     │                      │
│                              │  Subdomain       │                      │
│                              │  (JavaScript)    │                      │
│                              └──────────┬───────┘                      │
│                                         │                               │
│                                         ▼                               │
│                              ┌──────────────────┐                      │
│                              │  4. AI Agent     │                      │
│                              │  (Claude 3.5)    │◀──────────┐          │
│                              └──────────┬───────┘           │          │
│                                         │          ┌────────┴────────┐ │
│                                         ▼          │  AI System      │ │
│                              ┌──────────────────┐ │  Prompt         │ │
│                              │  5. Parse JSON   │ │  (8,000 tokens) │ │
│                              │                  │ └─────────────────┘ │
│                              └──────────┬───────┘                      │
│                                         │                               │
│                                         ▼                               │
│                              ┌──────────────────┐                      │
│                              │  6. Validate     │                      │
│                              │  Config          │                      │
│                              │  (JavaScript)    │                      │
│                              └──────────┬───────┘                      │
│                                         │                               │
│                                         ▼                               │
│  ┌──────────────────┐       ┌──────────────────┐                      │
│  │  7. Insert Site  │──────▶│  8. Insert Page  │                      │
│  │  (Supabase)      │       │  (Supabase)      │                      │
│  └──────────────────┘       └──────────┬───────┘                      │
│                                         │                               │
│                                         ▼                               │
│                              ┌──────────────────┐                      │
│                              │  9. Respond      │                      │
│                              │  (Success/Error) │                      │
│                              └──────────┬───────┘                      │
└─────────────────────────────────────────┼───────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Supabase Database                              │
│                                                                         │
│  ┌──────────────────┐       ┌──────────────────┐                      │
│  │   sites table    │       │   pages table    │                      │
│  │                  │       │                  │                      │
│  │  id (UUID)       │       │  id (UUID)       │                      │
│  │  user_id         │◀──────│  site_id (FK)    │                      │
│  │  subdomain       │       │  slug = "home"   │                      │
│  │  custom_domain   │       │  title           │                      │
│  │  settings        │       │  content (JSONB) │                      │
│  │  created_at      │       │  published       │                      │
│  │  updated_at      │       │  created_at      │                      │
│  └──────────────────┘       │  updated_at      │                      │
│                              └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Detailed Node Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node 1: Webhook Trigger                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Input:  POST /webhook/landingpage-builder                              │
│ Body:   { title, description, link, userId, orgId, userEmail }         │
│ Output: $json.body.*                                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node 2: Set Variables                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Extracts:                                                               │
│   - title         → $json.title                                         │
│   - description   → $json.description                                   │
│   - link          → $json.link                                          │
│   - orgId         → $json.orgId                                         │
│   - userId        → $json.userId                                        │
│   - userEmail     → $json.userEmail                                     │
│   - aiInput       → { title, description, link }                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Node 3: Generate Subdomain                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Function: generateSubdomain(title)                                      │
│                                                                         │
│ Steps:                                                                  │
│   1. Convert to lowercase                                               │
│   2. Replace Finnish chars (ä→a, ö→o, å→a)                             │
│   3. Remove special characters                                          │
│   4. Replace spaces with hyphens                                        │
│   5. Limit to 50 characters                                             │
│   6. Remove trailing hyphen                                             │
│   7. Add random 4-char suffix                                           │
│                                                                         │
│ Example:                                                                │
│   Input:  "Ilmainen SEO-opas 2024"                                      │
│   Output: "ilmainen-seo-opas-2024-a7k3"                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Node 4: AI Agent (Claude)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ API: https://api.anthropic.com/v1/messages                             │
│ Model: claude-3-5-sonnet-20241022                                      │
│ Max Tokens: 4096                                                        │
│                                                                         │
│ Request:                                                                │
│   {                                                                     │
│     "model": "claude-3-5-sonnet-20241022",                             │
│     "max_tokens": 4096,                                                │
│     "system": "<8,000 token prompt>",                                  │
│     "messages": [                                                       │
│       {                                                                 │
│         "role": "user",                                                 │
│         "content": "{\"title\":\"...\", \"description\":\"...\", ...}" │
│       }                                                                 │
│     ]                                                                   │
│   }                                                                     │
│                                                                         │
│ Response:                                                               │
│   {                                                                     │
│     "content": [                                                        │
│       {                                                                 │
│         "type": "text",                                                 │
│         "text": "{\"templateId\":\"lead-magnet\", ...}"                │
│       }                                                                 │
│     ]                                                                   │
│   }                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node 5: Parse JSON                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Function: JSON.parse(aiResponse)                                       │
│                                                                         │
│ Validation:                                                             │
│   ✓ Is valid JSON                                                      │
│   ✓ Has templateId field                                               │
│   ✓ Has theme field                                                    │
│   ✓ Has sections field                                                 │
│                                                                         │
│ On Success:                                                             │
│   $json.templateConfig = parsed object                                  │
│   $json.validationPassed = true                                         │
│                                                                         │
│ On Error:                                                               │
│   $json.error = "Invalid JSON from AI"                                  │
│   $json.rawResponse = original AI response                              │
│   $json.parseError = error message                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Node 6: Validate Config                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Validation Rules:                                                       │
│   ✓ templateId in ["lead-magnet", "waitlist", "saas-modern",          │
│                      "vsl", "personal"]                                 │
│   ✓ theme.primaryColor matches /^#[0-9A-Fa-f]{6}$/                    │
│   ✓ sections.length between 3 and 8                                    │
│   ✓ sections[0].type === "hero"                                        │
│   ✓ sections[last].type === "footer"                                   │
│   ✓ All section IDs are unique                                         │
│   ✓ All sections have isVisible: boolean                               │
│                                                                         │
│ On Success:                                                             │
│   $json.validationPassed = true                                         │
│   $json.validationErrors = []                                           │
│                                                                         │
│ On Error:                                                               │
│   $json.validationPassed = false                                        │
│   $json.errors = ["error1", "error2", ...]                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node 7: Insert Site                             │
├─────────────────────────────────────────────────────────────────────────┤
│ API: POST https://enrploxjigoyqajoqgkj.supabase.co/rest/v1/sites      │
│                                                                         │
│ Headers:                                                                │
│   - apikey: <service_role_key>                                         │
│   - Authorization: Bearer <service_role_key>                           │
│   - Content-Type: application/json                                     │
│   - Prefer: return=representation                                      │
│                                                                         │
│ Body:                                                                   │
│   {                                                                     │
│     "user_id": "$json.orgId",                                          │
│     "subdomain": "$json.subdomain",                                    │
│     "custom_domain": null,                                             │
│     "settings": {}                                                     │
│   }                                                                     │
│                                                                         │
│ Response:                                                               │
│   [{ "id": "uuid", "subdomain": "...", ... }]                          │
│                                                                         │
│ Retry Logic:                                                            │
│   Max 3 attempts with 1s delay between retries                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Node 8: Insert Page                             │
├─────────────────────────────────────────────────────────────────────────┤
│ API: POST https://enrploxjigoyqajoqgkj.supabase.co/rest/v1/pages      │
│                                                                         │
│ Headers:                                                                │
│   - apikey: <service_role_key>                                         │
│   - Authorization: Bearer <service_role_key>                           │
│   - Content-Type: application/json                                     │
│   - Prefer: return=representation                                      │
│                                                                         │
│ Body:                                                                   │
│   {                                                                     │
│     "site_id": "<from Node 7>",                                        │
│     "slug": "home",                                                    │
│     "title": "$json.title",                                            │
│     "content": $json.templateConfig,  // JSONB object                  │
│     "published": false                                                 │
│   }                                                                     │
│                                                                         │
│ Response:                                                               │
│   [{ "id": "uuid", "slug": "home", ... }]                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Node 9: Respond                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Success Response (200):                                                 │
│   {                                                                     │
│     "success": true,                                                    │
│     "siteId": "<uuid from Node 7>",                                    │
│     "pageId": "<uuid from Node 8>",                                    │
│     "subdomain": "$json.subdomain",                                    │
│     "url": "https://$json.subdomain.rascalpages.fi"                   │
│   }                                                                     │
│                                                                         │
│ Error Response (400/500):                                               │
│   {                                                                     │
│     "success": false,                                                   │
│     "error": "Error message",                                          │
│     "details": ["detail1", "detail2"]                                  │
│   }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Template Selection Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Input Analysis by AI                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Keyword       │
                         │ Detection     │
                         └───────┬───────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ "ilmainen"    │    │ "tulossa"     │    │ "valmentaja"  │
    │ "lataa"       │    │ "pian"        │    │ "coach"       │
    │ "opas"        │    │ "odotus"      │    │ "konsultti"   │
    │ "e-kirja"     │    │ "beta"        │    │ "mentor"      │
    └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ lead-magnet   │    │ waitlist      │    │ personal      │
    └───────────────┘    └───────────────┘    └───────────────┘

            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ Hero (form)   │    │ Hero          │    │ Hero          │
    │ Features      │    │ Form          │    │ About         │
    │ FAQ           │    │ Footer        │    │ Testimonials  │
    │ Footer        │    │               │    │ Footer        │
    └───────────────┘    └───────────────┘    └───────────────┘

    ┌───────────────┐    ┌───────────────┐
    │ "video"       │    │ "ohjelmisto"  │
    │ "kurssi"      │    │ "työkalu"     │
    │ "koulutus"    │    │ "palvelu"     │
    └───────┬───────┘    └───────┬───────┘
            │                    │
            ▼                    ▼
    ┌───────────────┐    ┌───────────────┐
    │ vsl           │    │ saas-modern   │
    └───────────────┘    └───────────────┘
            │                    │
            ▼                    ▼
    ┌───────────────┐    ┌───────────────┐
    │ Hero          │    │ Hero          │
    │ Video         │    │ Logos         │
    │ Footer        │    │ Features      │
    │               │    │ FAQ           │
    │               │    │ Footer        │
    └───────────────┘    └───────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Any Node Failure                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Error Detected  │
                        └────────┬────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ AI API Error  │    │ Parse Error   │    │ DB Error      │
    └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ Check:        │    │ Check:        │    │ Check:        │
    │ - API key     │    │ - JSON syntax │    │ - orgId valid │
    │ - Billing     │    │ - Required    │    │ - Subdomain   │
    │ - Rate limit  │    │   fields      │    │   unique      │
    └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ Retry?        │    │ Log error     │    │ Retry?        │
    │ (5xx errors)  │    │ Return error  │    │ (duplicate)   │
    └───────┬───────┘    └───────────────┘    └───────┬───────┘
            │                                           │
            ▼                                           ▼
    ┌───────────────┐                          ┌───────────────┐
    │ Max 3 retries │                          │ Regenerate    │
    │ Exponential   │                          │ subdomain     │
    │ backoff       │                          │ (max 3 times) │
    └───────┬───────┘                          └───────┬───────┘
            │                                           │
            └───────────────────┬───────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Return Error  │
                        │ Response      │
                        │ to Application│
                        └───────────────┘
```

## Data Transformation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Input                                    │
│   {                                                                     │
│     title: "Ilmainen SEO-opas 2024",                                   │
│     description: "Kattava opas hakukoneoptimoinnista",                 │
│     link: "https://example.com/lataa"                                  │
│   }                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼ (Node 3)
┌─────────────────────────────────────────────────────────────────────────┐
│                          Subdomain Generation                           │
│   "ilmainen-seo-opas-2024-a7k3"                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼ (Node 4)
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Content Generation                            │
│   {                                                                     │
│     templateId: "lead-magnet",                                         │
│     theme: { primaryColor: "#3B82F6" },                                │
│     sections: [                                                         │
│       {                                                                 │
│         id: "lm-hero-1",                                               │
│         type: "hero",                                                  │
│         content: {                                                     │
│           title: "Lataa ilmainen SEO-opas 2024",                      │
│           subtitle: "Opit hakukoneoptimoinnin salaisuudet...",        │
│           ctaText: "Lataa ilmaiseksi",                                │
│           ctaLink: "https://example.com/lataa",                       │
│           showForm: true,                                             │
│           formFields: [...],                                          │
│           formSuccessMessage: {...}                                   │
│         },                                                             │
│         isVisible: true                                               │
│       },                                                               │
│       { ... features ... },                                            │
│       { ... faq ... },                                                 │
│       { ... footer ... }                                               │
│     ]                                                                   │
│   }                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼ (Node 5 & 6)
┌─────────────────────────────────────────────────────────────────────────┐
│                      Parsed & Validated Config                          │
│   ✓ Valid JSON                                                         │
│   ✓ All required fields present                                        │
│   ✓ Hero section first                                                 │
│   ✓ Footer section last                                                │
│   ✓ Valid primary color                                                │
│   ✓ Unique section IDs                                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼ (Node 7)
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database: sites table                           │
│   {                                                                     │
│     id: "550e8400-e29b-41d4-a716-446655440000",                        │
│     user_id: "<orgId>",                                                │
│     subdomain: "ilmainen-seo-opas-2024-a7k3",                         │
│     custom_domain: null,                                               │
│     settings: {},                                                      │
│     created_at: "2024-02-05T10:30:00Z",                               │
│     updated_at: "2024-02-05T10:30:00Z"                                │
│   }                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼ (Node 8)
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database: pages table                           │
│   {                                                                     │
│     id: "660e8400-e29b-41d4-a716-446655440001",                        │
│     site_id: "550e8400-e29b-41d4-a716-446655440000",                  │
│     slug: "home",                                                      │
│     title: "Ilmainen SEO-opas 2024",                                  │
│     content: { <TemplateConfig as JSONB> },                           │
│     published: false,                                                  │
│     created_at: "2024-02-05T10:30:01Z",                               │
│     updated_at: "2024-02-05T10:30:01Z"                                │
│   }                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼ (Node 9)
┌─────────────────────────────────────────────────────────────────────────┐
│                           Success Response                              │
│   {                                                                     │
│     success: true,                                                     │
│     siteId: "550e8400-e29b-41d4-a716-446655440000",                   │
│     pageId: "660e8400-e29b-41d4-a716-446655440001",                   │
│     subdomain: "ilmainen-seo-opas-2024-a7k3",                         │
│     url: "https://ilmainen-seo-opas-2024-a7k3.rascalpages.fi"        │
│   }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Timeline Visualization

```
Time
  0s  ┌────────────────────────────────────────────────────┐
      │ User submits form in dashboard                     │
      └─────────────────────┬──────────────────────────────┘
                            │
  1s  ┌─────────────────────▼──────────────────────────────┐
      │ Webhook receives request                           │
      │ Variables extracted                                │
      │ Subdomain generated                                │
      └─────────────────────┬──────────────────────────────┘
                            │
 10s  ┌─────────────────────▼──────────────────────────────┐
      │ Claude API call (longest step)                     │
      │ - System prompt: 8,000 tokens                      │
      │ - User message: 100 tokens                         │
      │ - Generate output: 1,500 tokens                    │
      └─────────────────────┬──────────────────────────────┘
                            │
 20s  ┌─────────────────────▼──────────────────────────────┐
      │ Parse and validate AI response                     │
      └─────────────────────┬──────────────────────────────┘
                            │
 22s  ┌─────────────────────▼──────────────────────────────┐
      │ Insert site record to Supabase                     │
      └─────────────────────┬──────────────────────────────┘
                            │
 24s  ┌─────────────────────▼──────────────────────────────┐
      │ Insert page record to Supabase                     │
      └─────────────────────┬──────────────────────────────┘
                            │
 25s  ┌─────────────────────▼──────────────────────────────┐
      │ Return success response                            │
      └─────────────────────┬──────────────────────────────┘
                            │
 26s  ┌─────────────────────▼──────────────────────────────┐
      │ Dashboard updates with new site                    │
      │ User can now edit or publish the page              │
      └────────────────────────────────────────────────────┘
```

## Legend

```
Symbols used in diagrams:

┌─────┐  Box (node, component, or process)
│     │
└─────┘

   │     Connector (data flows down)
   ▼     Arrow (direction of flow)

   ◀──── Data input (coming from external source)

   ──────▶ Data output (going to external destination)

┌──┬──┐  Conditional split (multiple paths)
│  │  │
└──┴──┘

✓ / ✅  Success or validation passed
✗ / ❌  Failure or validation failed
```

## File References

For more details, see:

- **Workflow JSON**: `n8n-workflow-landingpage-builder.json`
- **Setup Guide**: `N8N_SETUP_GUIDE.md`
- **Test Cases**: `N8N_TEST_CASES.md`
- **Summary**: `N8N_IMPLEMENTATION_SUMMARY.md`
