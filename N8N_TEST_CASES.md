# N8N Landing Page Builder - Test Cases

Quick reference for testing the workflow with various scenarios.

## Test Case 1: Lead Magnet (E-book)

**Expected Template:** `lead-magnet`
**Expected Sections:** Hero (with form), Features, FAQ, Footer

### Payload

```json
{
  "title": "SEO-opas 2024",
  "description": "Kattava opas hakukoneoptimoinnista yrittäjille ja markkinoijille. Opit perusteet ja edistyneet tekniikat.",
  "link": "https://example.com/lataa-opas",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

### cURL Command

```bash
curl -X POST $N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SEO-opas 2024",
    "description": "Kattava opas hakukoneoptimoinnista yrittäjille ja markkinoijille. Opit perusteet ja edistyneet tekniikat.",
    "link": "https://example.com/lataa-opas",
    "userId": "test-user-uuid",
    "orgId": "test-org-uuid",
    "userEmail": "test@example.com"
  }'
```

### Expected Results

- **Template ID**: `lead-magnet`
- **Subdomain**: `seo-opas-2024-xxxx` (with random suffix)
- **Primary Color**: Blue (#3B82F6) or related
- **Sections Count**: 4 (Hero, Features, FAQ, Footer)
- **Hero Content**:
  - `showForm: true`
  - Form fields include email, name (optional), consent checkbox
  - Finnish text focusing on benefits
- **Features**: 3 items with emojis and benefit-focused descriptions
- **FAQ**: 4-8 questions addressing common objections

### Validation Checklist

- [ ] Subdomain is URL-safe (no ä, ö, å)
- [ ] All content is in Finnish
- [ ] Hero title is 40-60 characters
- [ ] Hero subtitle is 100-150 characters
- [ ] Form has email field marked as required
- [ ] Form has successMessage
- [ ] Features have 3 items
- [ ] FAQ has 4-8 items
- [ ] Footer section exists as last section

---

## Test Case 2: SaaS Product

**Expected Template:** `saas-modern`
**Expected Sections:** Hero, Logos, Features, FAQ, Footer

### Payload

```json
{
  "title": "TaskMaster Pro - Projektinhallinta",
  "description": "Tehtävien seuranta ja tiimityöskentely pienille tiimeille. Automaattiset ilmoitukset, raportit, integraatiot.",
  "link": "https://taskmaster.example/signup",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

### cURL Command

```bash
curl -X POST $N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TaskMaster Pro - Projektinhallinta",
    "description": "Tehtävien seuranta ja tiimityöskentely pienille tiimeille. Automaattiset ilmoitukset, raportit, integraatiot.",
    "link": "https://taskmaster.example/signup",
    "userId": "test-user-uuid",
    "orgId": "test-org-uuid",
    "userEmail": "test@example.com"
  }'
```

### Expected Results

- **Template ID**: `saas-modern`
- **Subdomain**: `taskmaster-pro-projektinhallinta-xxxx`
- **Primary Color**: Blue (#3B82F6) or Teal (#14B8A6)
- **Sections Count**: 5 (Hero, Logos, Features, FAQ, Footer)
- **Hero Content**:
  - No embedded form
  - CTA links to signup URL
  - Professional, benefit-focused copy
- **Logos**: Present (content: null)
- **Features**: 4-6 items highlighting product benefits
- **FAQ**: 4-8 questions about pricing, cancellation, security

### Validation Checklist

- [ ] Subdomain handles long title properly (max 50 chars + suffix)
- [ ] Hero has no form (showForm: false or undefined)
- [ ] CTA link matches provided link
- [ ] Logos section exists with content: null
- [ ] Features have 4-6 items
- [ ] Features focus on benefits, not features
- [ ] FAQ addresses common SaaS concerns

---

## Test Case 3: Waitlist

**Expected Template:** `waitlist`
**Expected Sections:** Hero, Form, Footer

### Payload

```json
{
  "title": "FitAI - Tulossa pian",
  "description": "AI-pohjainen personal trainer sovellus. Julkaistaan kesäkuussa 2024. Personoidut harjoitusohjelmat ja ravinto-ohjeet.",
  "link": "https://fitai.example/waitlist",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

### cURL Command

```bash
curl -X POST $N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "FitAI - Tulossa pian",
    "description": "AI-pohjainen personal trainer sovellus. Julkaistaan kesäkuussa 2024. Personoidut harjoitusohjelmat ja ravinto-ohjeet.",
    "link": "https://fitai.example/waitlist",
    "userId": "test-user-uuid",
    "orgId": "test-org-uuid",
    "userEmail": "test@example.com"
  }'
```

### Expected Results

- **Template ID**: `waitlist`
- **Subdomain**: `fitai-tulossa-pian-xxxx`
- **Primary Color**: Green (#10B981) or Purple (#8B5CF6)
- **Sections Count**: 3 (Hero, Form, Footer)
- **Hero Content**:
  - Short, exciting copy about upcoming launch
  - CTA points to form section (#waitlist)
- **Form**: Standalone form section with:
  - Email field (required)
  - Name field (optional)
  - Consent checkbox (optional)
  - Submit button: "Liity odotuslistalle"

### Validation Checklist

- [ ] Only 3 sections (minimal)
- [ ] Hero CTA links to #waitlist
- [ ] Form exists as separate section (not embedded in hero)
- [ ] Form submitButtonText is appropriate for waitlist
- [ ] successMessage mentions notification when launching

---

## Test Case 4: Personal Brand (Coach)

**Expected Template:** `personal`
**Expected Sections:** Hero, About, Testimonials, Footer

### Payload

```json
{
  "title": "Laura Koski - Elämänmuutos valmentaja",
  "description": "Autan ihmisiä löytämään tasapainon työn ja vapaa-ajan välille. 10 vuoden kokemus. Yli 500 tyytyväistä asiakasta.",
  "link": "https://laurakoski.fi/contact",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

### cURL Command

```bash
curl -X POST $N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laura Koski - Elämänmuutos valmentaja",
    "description": "Autan ihmisiä löytämään tasapainon työn ja vapaa-ajan välille. 10 vuoden kokemus. Yli 500 tyytyväistä asiakasta.",
    "link": "https://laurakoski.fi/contact",
    "userId": "test-user-uuid",
    "orgId": "test-org-uuid",
    "userEmail": "test@example.com"
  }'
```

### Expected Results

- **Template ID**: `personal`
- **Subdomain**: `laura-koski-elamanmuutos-valmentaja-xxxx`
- **Primary Color**: Purple (#8B5CF6) or Green (#10B981)
- **Sections Count**: 4 (Hero, About, Testimonials, Footer)
- **Hero Content**:
  - Personal, warm tone
  - CTA: "Varaa konsultaatio" or similar
- **About**: Bio with credentials and philosophy
- **Testimonials**: 3-6 reviews with specific results

### Validation Checklist

- [ ] About section has name and bio
- [ ] About bio is 2-4 sentences
- [ ] Testimonials have 3-6 items
- [ ] Testimonial texts include specific results/transformations
- [ ] Testimonials use realistic Finnish names
- [ ] Tone is personal and warm (not corporate)

---

## Test Case 5: VSL (Video Sales Letter)

**Expected Template:** `vsl`
**Expected Sections:** Hero, Video, Footer

### Payload

```json
{
  "title": "Verkkokaupan menestysresepti -kurssi",
  "description": "Kattava videokurssi, joka opettaa verkkokaupan perustamisesta ensimmäiseen myyntiin. Kaikki vaiheet selitetty.",
  "link": "https://example.com/buy-course",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

### cURL Command

```bash
curl -X POST $N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Verkkokaupan menestysresepti -kurssi",
    "description": "Kattava videokurssi, joka opettaa verkkokaupan perustamisesta ensimmäiseen myyntiin. Kaikki vaiheet selitetty.",
    "link": "https://example.com/buy-course",
    "userId": "test-user-uuid",
    "orgId": "test-org-uuid",
    "userEmail": "test@example.com"
  }'
```

### Expected Results

- **Template ID**: `vsl`
- **Subdomain**: `verkkokaupan-menestysresepti-kurssi-xxxx`
- **Primary Color**: Red (#EF4444) or Orange (#F59E0B)
- **Sections Count**: 3 (Hero, Video, Footer)
- **Hero Content**:
  - Question or bold claim in title
  - CTA points to video section (#video)
- **Video**: URL (placeholder or example)

### Validation Checklist

- [ ] Only 3 sections (minimal, video-focused)
- [ ] Hero CTA links to #video
- [ ] Video section has valid URL structure
- [ ] Urgency/excitement in copy (appropriate for sales)

---

## Error Test Cases

### Test Case E1: Invalid orgId (FK Constraint Violation)

**Payload:**

```json
{
  "title": "Test Page",
  "description": "Test description",
  "link": "https://test.com",
  "userId": "test-user-uuid",
  "orgId": "00000000-0000-0000-0000-000000000000",
  "userEmail": "test@example.com"
}
```

**Expected Result:**

- Node 7 (Insert Site) fails
- Error: "user_id violates foreign key constraint"
- Respond node returns error response

### Test Case E2: Empty Title

**Payload:**

```json
{
  "title": "",
  "description": "Test description",
  "link": "https://test.com",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

**Expected Result:**

- Node 3 generates subdomain from empty string
- Subdomain is just random suffix (e.g., "a7k3")
- AI may return generic content or ask for clarification

### Test Case E3: Very Long Title (>200 characters)

**Payload:**

```json
{
  "title": "This is an extremely long title that exceeds the normal length of a landing page title and should be handled gracefully by the subdomain generation function without causing any errors or issues in the system",
  "description": "Test",
  "link": "https://test.com",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

**Expected Result:**

- Subdomain is truncated to 50 characters + suffix
- AI generates appropriate content
- Title in page content may be shorter than input

### Test Case E4: Special Characters in Title

**Payload:**

```json
{
  "title": "Ilmainen E-kirja! 50% Alennus #1 Opas 2024",
  "description": "Test",
  "link": "https://test.com",
  "userId": "test-user-uuid",
  "orgId": "test-org-uuid",
  "userEmail": "test@example.com"
}
```

**Expected Result:**

- Subdomain: `ilmainen-e-kirja-50-alennus-1-opas-2024-xxxx`
- Special characters (!, %, #) are removed
- Spaces become hyphens

---

## Validation Test Cases

### Test Case V1: Missing Required Section (No Footer)

Force AI to generate config without footer section.

**Expected Result:**

- Node 6 (Validate Config) fails
- Error: "Last section must be footer"
- validationPassed: false

### Test Case V2: Invalid Primary Color

Force AI to return invalid color format (e.g., "blue" instead of "#3B82F6").

**Expected Result:**

- Node 6 fails
- Error: "Invalid theme.primaryColor (must be hex color)"

### Test Case V3: Too Few Sections

Force AI to return only 2 sections (Hero, Footer).

**Expected Result:**

- Node 6 fails
- Error: "Invalid sections array (must have 3-8 sections)"

### Test Case V4: Duplicate Section IDs

Force AI to return duplicate IDs (e.g., two sections with id "hero-1").

**Expected Result:**

- Node 6 fails
- Error: "Duplicate section IDs found"

---

## Performance Test Cases

### Test Case P1: Latency Measurement

**Objective:** Measure end-to-end execution time.

**Steps:**

1. Send test payload
2. Record timestamp before request
3. Record timestamp after response
4. Calculate duration

**Expected Duration:** < 30 seconds

**Breakdown:**

- Webhook → Set Variables: < 1s
- Generate Subdomain: < 1s
- AI Agent: 10-20s (depends on AI response time)
- Parse JSON: < 1s
- Validate Config: < 1s
- Insert Site: 1-2s
- Insert Page: 1-2s
- Respond: < 1s

### Test Case P2: Concurrent Requests

**Objective:** Test handling of multiple simultaneous requests.

**Steps:**

1. Send 5 requests concurrently
2. Verify all succeed
3. Check for subdomain collisions

**Expected Result:**

- All 5 requests succeed
- No duplicate subdomains (random suffix ensures uniqueness)

---

## Integration Test Cases

### Test Case I1: End-to-End Flow

**Steps:**

1. Create AI site from application
2. Wait for success message
3. Verify site in Supabase
4. Visit published site URL
5. Test form submission

**Expected Result:**

- Site appears in dashboard
- Page renders correctly
- Form submission works (if form exists)

### Test Case I2: Edit After Generation

**Steps:**

1. Generate AI site
2. Open editor
3. Modify content
4. Save changes
5. Verify changes persist

**Expected Result:**

- Editor loads with AI-generated content
- Changes can be saved
- Published site reflects changes

---

## Quick Test Script

Save this as `test-n8n-workflow.sh`:

```bash
#!/bin/bash

# Set your N8N webhook URL
WEBHOOK_URL="https://your-n8n-instance.com/webhook/landingpage-builder"

# Replace with valid UUIDs from your database
USER_ID="your-user-id"
ORG_ID="your-org-id"
USER_EMAIL="your-email@example.com"

echo "Testing N8N Landing Page Builder Workflow"
echo "=========================================="
echo ""

# Test Case 1: Lead Magnet
echo "Test 1: Lead Magnet (E-book)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"SEO-opas 2024\",
    \"description\": \"Kattava opas hakukoneoptimoinnista yrittäjille ja markkinoijille\",
    \"link\": \"https://example.com/lataa-opas\",
    \"userId\": \"$USER_ID\",
    \"orgId\": \"$ORG_ID\",
    \"userEmail\": \"$USER_EMAIL\"
  }"
echo ""
echo ""

# Test Case 2: SaaS Product
echo "Test 2: SaaS Product"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"TaskMaster Pro - Projektinhallinta\",
    \"description\": \"Tehtävien seuranta ja tiimityöskentely pienille tiimeille\",
    \"link\": \"https://taskmaster.example/signup\",
    \"userId\": \"$USER_ID\",
    \"orgId\": \"$ORG_ID\",
    \"userEmail\": \"$USER_EMAIL\"
  }"
echo ""
echo ""

# Test Case 3: Waitlist
echo "Test 3: Waitlist"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"FitAI - Tulossa pian\",
    \"description\": \"AI-pohjainen personal trainer sovellus. Julkaistaan kesäkuussa 2024.\",
    \"link\": \"https://fitai.example/waitlist\",
    \"userId\": \"$USER_ID\",
    \"orgId\": \"$ORG_ID\",
    \"userEmail\": \"$USER_EMAIL\"
  }"
echo ""
echo ""

echo "=========================================="
echo "Tests completed. Check N8N execution history for results."
```

**Usage:**

```bash
chmod +x test-n8n-workflow.sh
./test-n8n-workflow.sh
```

---

## Checklist for Production Testing

Before deploying to production, verify:

### Functionality

- [ ] All 5 template types generate correctly
- [ ] Subdomain generation handles Finnish characters
- [ ] Form fields are properly configured
- [ ] All content is in Finnish
- [ ] CTA links match provided link parameter
- [ ] Section IDs follow naming conventions
- [ ] Primary colors are valid hex codes

### Performance

- [ ] Execution time < 30 seconds
- [ ] Concurrent requests don't cause issues
- [ ] No memory leaks in N8N instance
- [ ] Database inserts complete successfully

### Error Handling

- [ ] Invalid orgId returns proper error
- [ ] AI errors are caught and reported
- [ ] Validation failures return clear messages
- [ ] Subdomain collisions are handled

### Integration

- [ ] Application can reach webhook URL
- [ ] Success response updates dashboard
- [ ] Published sites render correctly
- [ ] Editor loads AI-generated content

### Monitoring

- [ ] Execution history is enabled
- [ ] Error notifications are configured
- [ ] Metrics are being tracked
- [ ] Logs are accessible

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| AI returns English content | Verify AI_PROMPT_SYSTEM includes Finnish instruction |
| Subdomain has special chars | Check Node 3 regex replacement |
| Form missing successMessage | Verify AI prompt includes required field |
| Database insert fails | Check UUIDs are valid and exist |
| Timeout errors | Increase fetch timeout in application |
| Validation always fails | Add debug logging to Node 6 |

---

For detailed troubleshooting, see [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md#troubleshooting).
