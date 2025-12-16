# Social Media Manager - Phase 1 Documentation

## Overview

The Social Media Manager allows you to select any WooCommerce product and generate 5 AI-powered social media posts optimized for Facebook and Instagram. You can edit the posts, schedule them with specific dates/times, and save them to Airtable.

**Phase 1 Status:** ✅ Complete
- Product selection from WooCommerce
- AI post generation (5 unique posts)
- Post editing and scheduling
- Save to Airtable

**Phase 2 (Tomorrow):** Facebook/Instagram API integration for auto-posting

---

## Setup Required

### 1. Create Airtable Table

You need to create a new table in your existing Airtable base:

**Table Name:** `Scheduled Social Posts`

**Fields to Create:**

| Field Name | Type | Description |
|------------|------|-------------|
| Post Text | Long text | The social media post content |
| Image URL | URL | Link to the product image |
| Product ID | Number | WooCommerce product ID |
| Product Name | Text | Name of the product |
| Scheduled Date/Time | Date (with time) | When to post |
| Status | Single select | Options: scheduled, posted, failed |
| Platform | Single select | Options: facebook, instagram, both |
| Posted Date/Time | Date (with time) | When it was actually posted |
| Error Message | Long text | Error details if posting failed |

**Quick Setup:**
1. Go to your Airtable base
2. Create new table called "Scheduled Social Posts"
3. Add all fields above with correct types
4. Set default value for Status to "scheduled"
5. Set default value for Platform to "both"

### 2. Environment Variables

No new environment variables needed! The feature uses your existing:
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TOKEN`
- `ANTHROPIC_API_KEY`
- `WOO_BASE_URL`
- `WOO_CONSUMER_KEY`
- `WOO_CONSUMER_SECRET`

---

## How to Use

### Step 1: Navigate to Social Media Manager

Click "Social Media" in the navigation menu.

### Step 2: Select a Product

1. Choose a product from the dropdown
2. The product preview will load showing:
   - Product images
   - Name and price
   - Description
   - Categories and tags

**Note:** Products must have at least one image to generate posts.

### Step 3: Generate Posts

1. Click "Generate 5 Social Posts"
2. Wait ~5-10 seconds for AI to generate posts
3. 5 unique posts will appear, each with:
   - Engaging post text (optimized for FB/Instagram)
   - Associated product image
   - Character count
   - Suggested schedule (10 AM today, tomorrow, +2 days, +3, +4)

### Step 4: Review and Edit

For each post:
- **Edit the text** if needed (character count updates live)
- **Adjust the scheduled date/time** using the date picker
- **Review the associated image**

The AI generates diverse post styles:
- Storytelling posts
- Feature highlights
- Benefit-focused posts
- Behind-the-scenes content
- Call-to-action posts

### Step 5: Schedule Posts

1. Ensure all posts have valid dates/times
2. Click "Schedule All Posts"
3. Posts are saved to Airtable with status "scheduled"
4. Success message confirms scheduling

### Step 6: Manual Posting (Current Workflow)

**Until we add Facebook/Instagram API (Phase 2 tomorrow):**

1. Go to your Airtable "Scheduled Social Posts" table
2. Filter by today's date or upcoming dates
3. Copy the post text
4. Download/save the image from Image URL
5. Manually post to Facebook/Instagram
6. Update Status to "posted" in Airtable

---

## AI Post Generation Details

### What the AI Uses

The AI analyzes:
- Product name
- Full product description
- Short description
- Price
- Categories
- Tags
- Available images

### Post Characteristics

Each generated post:
- **Length:** 250-400 characters (optimal for engagement)
- **Style:** Varies between storytelling, features, benefits, lifestyle, CTA
- **Emojis:** Uses appropriate emojis naturally (not excessive)
- **No hashtags:** You can add these manually if desired
- **No URLs:** Facebook/Instagram handle links automatically
- **Platform:** Set to "both" (Facebook & Instagram)

### Image Selection

The AI intelligently selects which product image to use for each post. If multiple images are available, it varies them across posts to show different angles.

---

## Workflow Example

**Scenario:** You want to promote a new handmade mug

1. Select "Handmade Ceramic Mug - Blue Glaze" from dropdown
2. Review: 4 images, £25, categories: Homeware, Drinkware
3. Click "Generate 5 Social Posts"
4. AI generates:
   - **Post 1:** Storytelling about the craftsperson (Image 1, scheduled today 10 AM)
   - **Post 2:** Features highlight - dishwasher safe, microwave safe (Image 2, tomorrow 10 AM)
   - **Post 3:** Benefits - perfect for morning coffee, gift idea (Image 3, +2 days)
   - **Post 4:** Behind-the-scenes - glazing process (Image 4, +3 days)
   - **Post 5:** Call-to-action - limited stock, order now (Image 1, +4 days)
5. Edit Post 3 to add a personal touch about gift-giving
6. Adjust Post 5 schedule to Friday morning instead
7. Click "Schedule All Posts"
8. Posts saved to Airtable
9. Each day at scheduled time, go to Airtable, copy/paste to social media

---

## Tips for Best Results

### Product Selection
- Choose products with high-quality images
- Products with detailed descriptions generate better posts
- Categories and tags help AI understand the product better

### Editing Posts
- Personalize with your brand voice
- Add specific offers or promotions
- Include relevant emojis if needed
- Keep posts concise for better engagement

### Scheduling
- Spread posts over 5 days for sustained visibility
- Schedule during peak engagement times (10 AM is default)
- Avoid scheduling too many posts in one day

### Manual Posting (Until Phase 2)
- Set reminders in your calendar for scheduled posts
- Batch-schedule using Facebook Creator Studio if preferred
- Track which posts perform best in Airtable notes

---

## Phase 2 Preview (Tomorrow)

**What we'll add:**
- Facebook API integration
- Instagram API integration
- Automatic posting at scheduled times
- Vercel Cron job for daily checks
- Post status tracking (success/failure)
- Error handling and retry logic

**What you'll need:**
- Facebook Developer App
- Instagram Business Account linked to Facebook Page
- API tokens (we'll set up together)

**Workflow will become:**
1. Generate posts → Schedule → Done!
2. System automatically posts at scheduled times
3. Check Airtable for confirmation
4. View analytics in Facebook/Instagram

---

## Troubleshooting

### "Failed to load products"
- Check WooCommerce API credentials in Vercel
- Ensure products are published (not draft)
- Verify WooCommerce REST API is enabled

### "This product needs at least one image"
- Add a featured image to the product in WooCommerce
- Ensure image URLs are accessible

### "Failed to generate posts"
- Check ANTHROPIC_API_KEY is set in Vercel
- Verify product has sufficient description text
- Check Vercel logs for detailed error

### "Failed to schedule posts"
- Verify Airtable table "Scheduled Social Posts" exists
- Check all required fields are created
- Ensure AIRTABLE_BASE_ID and AIRTABLE_TOKEN are correct

### Posts not showing in Airtable
- Refresh your Airtable base
- Check you're looking at the correct table
- Verify Base ID matches your environment variable

---

## Technical Details

### API Endpoints

- `GET /api/woocommerce/products` - List all published products
- `GET /api/woocommerce/products/[id]` - Get single product details
- `POST /api/generate-social-posts` - Generate 5 AI posts
- `POST /api/social-posts` - Save scheduled posts
- `GET /api/social-posts` - Fetch scheduled posts (for future dashboard)

### Data Flow

```
WooCommerce Product
  ↓
Product Selection
  ↓
AI Post Generation (Claude Haiku 4.5)
  ↓
User Edits & Schedules
  ↓
Airtable Storage
  ↓
(Phase 2: Auto-posting to Facebook/Instagram)
```

### AI Model

- **Model:** Claude Haiku 4.5
- **Max tokens:** 2500
- **Temperature:** Default
- **Response format:** JSON with structured posts

---

## Next Steps

**Today:**
1. Create Airtable "Scheduled Social Posts" table
2. Test the feature with a product
3. Generate and schedule some posts
4. Review the results

**Tomorrow (Phase 2):**
1. Set up Facebook Developer App
2. Connect Instagram Business Account
3. Implement auto-posting functionality
4. Test end-to-end automation

---

## Support

If you encounter any issues:
1. Check this documentation first
2. Verify all environment variables in Vercel
3. Check Vercel deployment logs
4. Ensure Airtable table structure matches specification

---

**Enjoy your new Social Media Manager! 🎉**

Phase 1 gives you AI-powered post generation and scheduling. Tomorrow we'll add the automation to make it completely hands-free!
