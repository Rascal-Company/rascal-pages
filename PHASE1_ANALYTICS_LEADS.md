# Phase 1: Analytics & Lead Capture Implementation

## Overview

This implementation adds lead capture and analytics tracking to Rascal Pages without changing the core template architecture.

## What Was Implemented

### 1. Database Tables

Two new tables were created in Supabase:

- **leads** - Stores form submissions (email, name, metadata)
- **analytics_events** - Stores user interactions (CTA clicks, page views)

Both tables have Row Level Security (RLS) policies that:
- Allow public inserts for published sites only
- Allow site owners to read their data only

#### To set up the database:

Run the SQL in `supabase-migration.sql` in your Supabase SQL Editor.

### 2. Server Actions

Two new server actions handle data submission:

#### `app/actions/submit-lead.ts`
- Validates email format
- Verifies site is published
- Saves lead to database
- Optionally sends to n8n webhook (if configured)

#### `app/actions/track-event.ts`
- Validates event type (`cta_click`, `page_view`, `form_view`)
- Saves event to database
- Used for analytics tracking

### 3. Components

#### `app/components/AnalyticsLink.tsx`
- Wrapper for `<a>` tags that tracks clicks
- Automatically sends `cta_click` events
- Used in all CTA buttons across templates

#### `app/components/PageViewTracker.tsx`
- Client component that tracks page views
- Automatically added to all public sites
- Fires once on page load

### 4. Updated Templates

All 5 templates now support analytics and lead capture:

- **LeadMagnetTemplate** - Form now captures leads with success/error states
- **WaitlistTemplate** - Email form now captures leads
- **SaasModernTemplate** - CTA button tracks clicks
- **VslTemplate** - CTA button tracks clicks
- **PersonalTemplate** - CTA button tracks clicks

### 5. Updated Components

- **SiteRenderer** - Now accepts `siteId` prop and adds `PageViewTracker`
- **EditorPreview** - Passes `siteId` for preview rendering
- **All public pages** - Pass `siteId` to `SiteRenderer`

## Environment Variables

Add to your `.env.local`:

```bash
# Optional: n8n webhook URL for lead notifications
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/leads
```

If not set, leads will still be saved to the database, but won't be sent to n8n.

## How It Works

### Lead Capture Flow

1. User fills out form on public site (LeadMagnetTemplate or WaitlistTemplate)
2. Form submits to `submitLead` server action
3. Server validates email and checks if site is published
4. Lead is saved to `leads` table in Supabase
5. (Optional) Webhook POST to n8n with lead data
6. User sees success message

### Analytics Flow

1. User visits public site → `PageViewTracker` fires `trackEvent('page_view')`
2. User clicks CTA button → `AnalyticsLink` fires `trackEvent('cta_click')`
3. Events are saved to `analytics_events` table

### Security

- RLS policies ensure only published sites can receive leads/events
- Only site owners can read their analytics data
- Email validation prevents malformed data
- Event type validation prevents invalid event types

## Next Steps (Not Implemented Yet)

### Dashboard Views

You still need to create:

1. **Leads Dashboard** - `app/app/dashboard/[id]/leads/page.tsx`
   - Display table of leads for the site
   - Export to CSV
   - Pagination

2. **Analytics Dashboard** - `app/app/dashboard/[id]/analytics/page.tsx`
   - Charts showing clicks over time
   - Most clicked CTAs
   - Page view statistics

### Example Dashboard Structure

```tsx
// app/app/dashboard/[id]/leads/page.tsx
export default async function LeadsPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get auth user and verify ownership
  // ...

  // Fetch leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('site_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1>Leads</h1>
      <table>
        {/* Display leads */}
      </table>
    </div>
  );
}
```

## Files Changed

### New Files
- `supabase-migration.sql` - Database migration
- `app/actions/submit-lead.ts` - Lead submission action
- `app/actions/track-event.ts` - Analytics tracking action
- `app/components/AnalyticsLink.tsx` - CTA tracking component
- `app/components/PageViewTracker.tsx` - Page view tracking component
- `PHASE1_ANALYTICS_LEADS.md` - This document

### Modified Files
- `app/components/templates/LeadMagnetTemplate.tsx` - Added form handling
- `app/components/templates/WaitlistTemplate.tsx` - Added form handling
- `app/components/templates/SaasModernTemplate.tsx` - Added analytics tracking
- `app/components/templates/VslTemplate.tsx` - Added analytics tracking
- `app/components/templates/PersonalTemplate.tsx` - Added analytics tracking
- `app/components/renderer/SiteRenderer.tsx` - Added siteId prop and PageViewTracker
- `app/components/editor/EditorPreview.tsx` - Added siteId prop
- `app/components/editor/Editor.tsx` - Pass siteId to preview
- `app/sites/[domain]/page.tsx` - Pass siteId to SiteRenderer

## Testing

Since this project doesn't have automated testing set up yet, you should manually test:

1. **Lead Capture**
   - Visit a published site with LeadMagnetTemplate or WaitlistTemplate
   - Submit the form with valid email
   - Check Supabase `leads` table for new entry
   - Check n8n webhook received data (if configured)

2. **Analytics Tracking**
   - Visit a published site
   - Check `analytics_events` table for `page_view` event
   - Click a CTA button
   - Check `analytics_events` table for `cta_click` event

3. **Security**
   - Try submitting form on unpublished site (should fail)
   - Try reading leads without being logged in (should fail via RLS)
   - Try submitting invalid email (should show error)

## n8n Webhook Payload

When a lead is submitted, n8n receives:

```json
{
  "type": "new_lead",
  "siteId": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "timestamp": "2026-01-25T19:45:00.000Z"
}
```

You can use this in n8n workflows to:
- Send confirmation emails
- Add to CRM (HubSpot, Salesforce, etc.)
- Send Slack notifications
- Add to email marketing list (Mailchimp, ConvertKit, etc.)
