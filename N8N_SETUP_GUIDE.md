# N8N Landing Page Builder - Setup Guide

This guide walks you through setting up the N8N workflow for AI-powered landing page generation in Rascal Pages.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Importing the Workflow](#importing-the-workflow)
4. [Configuring Credentials](#configuring-credentials)
5. [Testing the Workflow](#testing-the-workflow)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services

- **N8N Instance** - Self-hosted or N8N Cloud (https://n8n.io)
- **Anthropic API Key** - For Claude 3.5 Sonnet (https://console.anthropic.com)
- **Supabase Project** - Service Role Key (https://supabase.com)
- **Rascal Pages Application** - Running instance with environment variables configured

### Required Files

- `n8n-workflow-landingpage-builder.json` - The workflow definition
- `prompts/landing-page-builder.md` - The AI system prompt (~8,000 tokens)

---

## Environment Setup

### 1. Prepare the AI System Prompt

The AI system prompt must be loaded into N8N as an environment variable.

**Option A: Copy to Clipboard (Recommended)**

```bash
# Copy the entire prompt file contents
cat prompts/landing-page-builder.md | pbcopy  # macOS
cat prompts/landing-page-builder.md | xclip   # Linux
```

**Option B: Read File Manually**

Open `prompts/landing-page-builder.md` in your text editor and copy all contents (1,205 lines).

### 2. Set Environment Variables in N8N

Navigate to **Settings → Environment Variables** in N8N and add these variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `AI_PROMPT_SYSTEM` | *Paste entire prompt content* | ~8,000 tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | From Supabase Settings → API |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | From Anthropic Console |

**Important Notes:**

- **SUPABASE_SERVICE_ROLE_KEY**: Use the **Service Role** key, NOT the anon key. Service role bypasses RLS.
- **AI_PROMPT_SYSTEM**: Must be the complete prompt file contents. Don't add quotes or formatting.
- **ANTHROPIC_API_KEY**: Starts with `sk-ant-api03-`. Ensure billing is set up in Anthropic Console.

### 3. Configure Application Environment Variables

In your Rascal Pages application, add the N8N webhook URL:

```bash
# .env.local (development)
N8N_LANDINGPAGE_BUILDER=https://your-n8n-instance.com/webhook/landingpage-builder

# Production
# Add to Vercel/Railway environment variables
```

**Get the Webhook URL:**

1. Import the workflow (see next section)
2. Open the "Webhook Trigger" node
3. Copy the **Production URL** (not the test URL)
4. Add to your application environment variables

---

## Importing the Workflow

### Step 1: Import JSON

1. Open your N8N instance
2. Click **Workflows** in the left sidebar
3. Click **Import from File** or **+ Add Workflow → Import from File**
4. Select `n8n-workflow-landingpage-builder.json`
5. Click **Import**

### Step 2: Verify Node Connections

After import, verify all 9 nodes are connected in this order:

```
Webhook Trigger → Set Variables → Generate Subdomain → AI Agent (Claude)
→ Parse JSON → Validate Config → Insert Site → Insert Page → Respond
```

### Step 3: Activate the Workflow

1. Click **Activate** in the top-right corner
2. The workflow should show as **Active** (green indicator)

---

## Configuring Credentials

The workflow requires two credential sets:

### 1. Anthropic API Key (HTTP Header Auth)

**Create Credential:**

1. Click on the **AI Agent (Claude)** node
2. Under **Authentication**, select **Header Auth**
3. Click **Create New Credential**
4. Configure:
   - **Name**: `Anthropic API Key`
   - **Header Name**: `x-api-key`
   - **Header Value**: `{{ $env.ANTHROPIC_API_KEY }}`
5. Click **Save**

**Alternative (Direct Value):**

If environment variables don't work, paste your API key directly:

- **Header Value**: `sk-ant-api03-YOUR-KEY-HERE`

### 2. Supabase Service Role (HTTP Header Auth)

**Create Credential:**

1. Click on the **Insert Site** node
2. Under **Authentication**, select **Header Auth**
3. Click **Create New Credential**
4. Configure:
   - **Name**: `Supabase Service Role`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}`
5. Click **Save**
6. Apply the same credential to the **Insert Page** node

**Alternative (Direct Value):**

- **Header Value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Testing the Workflow

### Test 1: Manual Execution in N8N

**Using N8N Test Mode:**

1. Click **Test Workflow** (top-right)
2. Click on the **Webhook Trigger** node
3. Click **Listen for Test Event**
4. Use the test webhook URL provided
5. Send a POST request with this payload:

```bash
curl -X POST https://your-n8n-instance.com/webhook-test/landingpage-builder \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SEO-opas 2024",
    "description": "Kattava opas hakukoneoptimoinnista yrittäjille ja markkinoijille",
    "link": "https://example.com/lataa-opas",
    "userId": "00000000-0000-0000-0000-000000000000",
    "orgId": "00000000-0000-0000-0000-000000000000",
    "userEmail": "test@example.com"
  }'
```

**Expected Results:**

- Node 1 (Webhook): Receives payload ✅
- Node 2 (Set Variables): Extracts fields ✅
- Node 3 (Generate Subdomain): Creates `seo-opas-2024-a7k3` ✅
- Node 4 (AI Agent): Returns TemplateConfig JSON ✅
- Node 5 (Parse JSON): Parses successfully ✅
- Node 6 (Validate Config): `validationPassed: true` ✅
- Node 7 (Insert Site): Creates site record ✅
- Node 8 (Insert Page): Creates page record ✅
- Node 9 (Respond): Returns success JSON ✅

### Test 2: From Rascal Pages Application

**Prerequisites:**

- Application is running locally or in staging
- `N8N_LANDINGPAGE_BUILDER` environment variable is set
- User is logged in

**Steps:**

1. Navigate to the dashboard
2. Click **Luo uusi sivu AI:lla** (Create new AI page)
3. Fill in the form:
   - **Otsikko**: "Ilmainen SEO-opas 2024"
   - **Kuvaus**: "Kattava opas hakukoneoptimoinnista yrittäjille"
   - **Linkki**: "https://example.com/lataa"
4. Click **Luo sivu AI:lla**
5. Wait for success message

**Verify Results:**

1. **In Supabase:**
   - Check `sites` table: New row with subdomain
   - Check `pages` table: New row with JSONB content
2. **In Application:**
   - New site appears in dashboard
   - Click to edit the site
   - Verify Finnish content in all sections
3. **Published Site:**
   - Visit `https://[subdomain].rascalpages.fi`
   - Verify landing page renders correctly

### Test 3: Error Handling

**Test Invalid JSON:**

Modify the AI prompt temporarily to return invalid JSON and verify Node 5 catches the error.

**Test Validation Failure:**

Force a validation error (e.g., remove footer section) and verify Node 6 catches it.

**Test Subdomain Collision:**

Create a site with a subdomain that already exists and verify retry logic works.

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] All environment variables are set correctly
- [ ] Credentials are configured and tested
- [ ] Test execution succeeded with real data
- [ ] Application can reach the webhook URL (not blocked by firewall)
- [ ] N8N instance has sufficient resources (recommended: 2GB RAM minimum)
- [ ] Monitoring is set up (see below)
- [ ] Error notifications are configured

### Monitoring Setup

**Enable Execution History:**

1. Go to **Workflow Settings**
2. Enable **Save Execution Progress**
3. Set **Execution History Size**: 100

**Configure Error Notifications:**

1. Go to **Workflow Settings**
2. Enable **Execute on Error**
3. Add error notification node (Email/Slack/Discord)

**Key Metrics to Monitor:**

- **Success Rate**: % of successful executions
- **Average Latency**: Time from webhook to database insert
- **AI Token Usage**: Track for cost management
- **Validation Failures**: Count of invalid AI outputs

### N8N Instance Recommendations

**Self-Hosted:**

- **Minimum**: 2GB RAM, 2 vCPU
- **Recommended**: 4GB RAM, 2 vCPU
- **Database**: PostgreSQL (not SQLite)

**N8N Cloud:**

- **Starter Plan**: Up to 2,000 executions/month
- **Pro Plan**: Unlimited executions, dedicated resources

---

## Troubleshooting

### Issue: AI Returns Empty Response

**Symptoms:**

- Node 5 fails with "Cannot read property 'text' of undefined"
- Empty `content` array in AI response

**Solutions:**

1. Verify `ANTHROPIC_API_KEY` is correct
2. Check Anthropic API status: https://status.anthropic.com
3. Verify billing is set up in Anthropic Console
4. Check request body format in Node 4

**Debug Steps:**

```bash
# Test Anthropic API directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Issue: Finnish Characters Broken in Subdomain

**Symptoms:**

- Subdomain contains "undefined" or broken characters
- Subdomain validation fails

**Solutions:**

1. Verify Node 3 JavaScript properly handles ä, ö, å
2. Check that title is UTF-8 encoded
3. Test subdomain generation function independently

**Test Subdomain Generation:**

```javascript
// Run in Node 3 to test
const title = "Ilmainen SEO-opas 2024";
console.log(generateSubdomain(title));
// Expected: "ilmainen-seo-opas-2024-a7k3"
```

### Issue: Database Insert Fails with FK Constraint

**Symptoms:**

- Node 7 fails with "user_id violates foreign key constraint"
- Error: "insert or update on table "sites" violates foreign key constraint"

**Solutions:**

1. Verify `orgId` in payload matches a valid `public.users.id`
2. Check that the user exists in both `auth.users` and `org_members`
3. Verify `org_member.org_id` points to a valid `public.users.id`

**Debug Query:**

```sql
-- Check if orgId exists
SELECT id FROM public.users WHERE id = 'YOUR-ORG-ID';

-- Check org membership
SELECT * FROM org_members WHERE auth_user_id = 'YOUR-USER-ID';
```

### Issue: Page Content Displays as [Object object]

**Symptoms:**

- Landing page shows "[Object object]" instead of content
- Page renders blank or with JSON string

**Solutions:**

1. Ensure `content` field stores parsed JSON object, not stringified JSON
2. Verify Node 8 sends `$json.templateConfig` (object), not `JSON.stringify($json.templateConfig)` (string)
3. Check Supabase column type is `jsonb`, not `text`

**Verify in Supabase:**

```sql
-- Check page content type
SELECT id, slug, pg_typeof(content) as content_type
FROM pages
WHERE slug = 'home'
LIMIT 1;

-- Expected: content_type = jsonb
```

### Issue: Validation Always Fails

**Symptoms:**

- Node 6 returns `validationPassed: false` for valid configs
- Errors like "First section must be hero" for valid configs

**Solutions:**

1. Review validation rules in Node 6
2. Check for typos in section type comparisons
3. Verify AI output matches expected structure
4. Add debug logging to see actual config structure

**Add Debug Logging:**

```javascript
// Add at start of Node 6
console.log('Template Config:', JSON.stringify(config, null, 2));
console.log('First section type:', config.sections[0]?.type);
console.log('Last section type:', config.sections[config.sections.length - 1]?.type);
```

### Issue: Webhook Not Reachable from Application

**Symptoms:**

- Application times out when creating AI site
- Error: "Webhook-pyyntö epäonnistui"
- Network error in application logs

**Solutions:**

1. Verify N8N webhook URL is publicly accessible
2. Check firewall rules (allow HTTPS/443)
3. Verify SSL certificate is valid
4. Test webhook URL directly with curl:

```bash
curl -X POST $N8N_LANDINGPAGE_BUILDER \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","link":"https://test.com","userId":"test","orgId":"test","userEmail":"test@test.com"}'
```

### Issue: AI Token Limit Exceeded

**Symptoms:**

- Anthropic API returns 400 with "max_tokens" error
- Response: "Your request exceeded the maximum number of tokens"

**Solutions:**

1. Reduce `max_tokens` in Node 4 from 4096 to 3000
2. Simplify user description (truncate to 500 characters)
3. Use a shorter template (waitlist or VSL)

**Modify Node 4:**

```json
{
  "max_tokens": 3000  // Reduced from 4096
}
```

### Issue: Slow Response Times (>30 seconds)

**Symptoms:**

- Workflow takes longer than 30 seconds
- Application times out
- User sees loading spinner indefinitely

**Solutions:**

1. Increase application fetch timeout to 60 seconds
2. Optimize AI prompt (reduce token count)
3. Use faster Claude model (claude-3-haiku-20240307)
4. Implement async processing with callback

**Increase Timeout in Application:**

```typescript
// In create-ai-site.ts
const response = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({...}),
  signal: AbortSignal.timeout(60000), // 60 seconds
});
```

---

## Cost Estimation

### Per Execution Costs

**Claude 3.5 Sonnet Pricing:**

- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

**Typical Request:**

- System prompt: ~8,000 tokens (input)
- User message: ~100 tokens (input)
- Generated config: ~1,500 tokens (output)

**Cost per Generation:**

```
Input cost:  (8,000 + 100) / 1,000,000 × $3.00  = $0.024
Output cost: 1,500 / 1,000,000 × $15.00         = $0.023
Total:                                            ≈ $0.05
```

**Monthly Estimates:**

- 100 generations: ~$5
- 500 generations: ~$25
- 1,000 generations: ~$50

### Cost Optimization Tips

1. **Cache System Prompt**: Use Anthropic's prompt caching (reduces input cost by 90%)
2. **Use Haiku for Simple Cases**: Claude 3 Haiku is 20x cheaper
3. **Batch Processing**: Generate multiple pages in one request
4. **Lazy Loading**: Only generate content when user requests it

---

## Advanced Configuration

### Custom Error Responses

Modify Node 9 to return detailed error information:

```javascript
// In Respond node
const hasError = $json.error || !$json.validationPassed;

return {
  json: hasError ? {
    success: false,
    error: $json.error || 'Validation failed',
    details: $json.validationErrors || $json.errors || [],
    rawResponse: $json.rawResponse
  } : {
    success: true,
    siteId: $('Insert Site').item.json[0].id,
    pageId: $('Insert Page').item.json[0].id,
    subdomain: $json.subdomain,
    url: `https://${$json.subdomain}.rascalpages.fi`
  }
};
```

### Retry Logic for Subdomain Collisions

Add retry logic to Node 7 for handling duplicate subdomains:

1. Add an **IF** node after Insert Site
2. Check if error is "duplicate key value violates unique constraint"
3. If yes, loop back to Generate Subdomain
4. Limit to 3 retries

### Email Notifications

Add email notifications for successful generations:

1. Add **Send Email** node after Insert Page
2. Configure SMTP credentials
3. Send email to `$json.userEmail` with site URL

---

## Next Steps

After successful implementation:

1. **Monitor First 10 Executions**: Watch for any errors or edge cases
2. **Optimize Prompt**: Refine based on user feedback
3. **A/B Testing**: Track conversion rates of AI-generated vs manual pages
4. **Add Regeneration**: Allow users to regenerate if unhappy with result
5. **Multi-language Support**: Extend prompt for English and Swedish
6. **Image Generation**: Integrate DALL-E or Midjourney for hero images
7. **Brand Voice**: Allow users to specify tone/voice preferences

---

## Support

If you encounter issues not covered in this guide:

1. Check N8N execution logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test each node individually using N8N's "Run Node" feature
4. Check Supabase logs for database errors
5. Review Anthropic API logs for AI errors

For further assistance, contact the development team or refer to:

- N8N Documentation: https://docs.n8n.io
- Anthropic API Docs: https://docs.anthropic.com
- Supabase Docs: https://supabase.com/docs
