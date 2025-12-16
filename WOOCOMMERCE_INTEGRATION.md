# WooCommerce Integration Guide

## Overview

The Listing Asset App now supports uploading AI-generated listing content directly to WooCommerce as draft variable products. This feature allows you to:

1. Generate listing copy with AI
2. Configure product variations (e.g., Colour, Size)
3. Select/create categories and tags
4. Upload everything to WooCommerce as a draft product
5. Finish in WooCommerce admin (add images, set prices, publish)

## Setup

### 1. WooCommerce REST API Credentials

You need to generate WooCommerce REST API credentials:

1. Log into your WooCommerce site admin
2. Go to **WooCommerce → Settings → Advanced → REST API**
3. Click **Add Key**
4. Set:
   - Description: "Listing Asset App"
   - User: Your admin user
   - Permissions: **Read/Write**
5. Click **Generate API Key**
6. Copy the **Consumer Key** and **Consumer Secret**

### 2. Environment Variables

Add these variables to your `.env.local` file:

```env
# WooCommerce REST API Configuration
WOO_BASE_URL=https://lakewayworkshop.co.uk
WOO_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxx
WOO_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxx
```

**Security Notes:**
- Never commit `.env.local` to version control
- Keep your Consumer Secret private
- The app uses server-side routes only (client never sees credentials)

### 3. Deploy to Vercel

If deploying to Vercel, add the same environment variables in:
**Project Settings → Environment Variables**

## Workflow

### Step 1: Generate Listing Assets

1. Fill in the product information form:
   - Product Name
   - What is this product?
   - Who is it for / what occasions?
   - What variations are available?
   - Personalisation options
   - Price/Postage notes (optional)

2. Click **Generate Listing Assets**

3. Review the AI-generated content:
   - Title
   - Description
   - Key Features
   - Tags
   - Personalisation (Short & Long)

### Step 2: Configure WooCommerce Settings

After generating assets, you'll see a new **WooCommerce Upload Settings** section:

#### Variations Builder

1. Toggle **"This product has variations"** (enabled by default)
2. Add variation attributes:
   - **Attribute name**: e.g., "Colour", "Size", "Material"
   - **Values**: Comma-separated, e.g., "Red, Blue, Green"
3. Values are automatically sanitized:
   - Trimmed of whitespace
   - De-duplicated (case-insensitive)
   - Shown as chips for visual confirmation
4. The app shows total variations to be created (cartesian product)

**Example:**
- Colour: Red, Blue, Green (3 options)
- Size: Small, Large (2 options)
- **Total variations created: 6**

#### Categories & Tags

**Categories:**
- Search existing categories by typing
- Select multiple categories with checkboxes
- Create new category: type name and press **Enter**
- Selected categories appear as chips above the search box

**Tags:**
- Same interface as categories
- Search, select multiple, or create new by pressing **Enter**

**Create-if-missing logic:**
- If you type a name that already exists (case-insensitive), the existing one is selected
- No duplicates are created

### Step 3: Upload to WooCommerce

1. Click **Upload to Woo Draft** button
   - Disabled until required fields are valid
   - Button shows validation messages when disabled

2. Confirm the upload in the modal:
   - "Create a new draft product in WooCommerce using the current content?"

3. Wait for upload (may take a few seconds for products with many variations)

### Step 4: Success / Error Handling

**On Success:**
- Green success banner appears
- Shows Product ID
- Provides direct link to **Edit in WooCommerce Admin**
- **Copy Admin Link** button for sharing

**On Error:**
- Red error banner appears
- Shows friendly error message
- Expandable **Technical Details** section for debugging

### Step 5: Finish in WooCommerce

The uploaded draft product contains:
- ✅ Title, description, short description
- ✅ All variations created (e.g., Red/Small, Red/Large, Blue/Small, etc.)
- ✅ Categories and tags assigned
- ✅ Product type: Variable
- ✅ Status: Draft

**What's NOT set (you must add manually):**
- ❌ Product images
- ❌ Variation prices (left blank intentionally)
- ❌ SKU (future enhancement)
- ❌ Stock levels

**To finish:**
1. Click the admin link from the success message
2. Add product images (featured image + gallery)
3. Go to **Variations** tab and set prices for each variation
4. Optionally set stock levels, shipping class, etc.
5. Click **Publish** when ready

## API Endpoints

The feature adds these server-side endpoints:

### `GET /api/woocommerce/categories`
Fetches all WooCommerce categories (with pagination handling).

**Response:**
```json
{
  "ok": true,
  "categories": [
    { "id": 123, "name": "Category Name", "slug": "category-name" }
  ]
}
```

### `POST /api/woocommerce/categories`
Creates a new category (or returns existing if name matches).

**Request:**
```json
{ "name": "New Category" }
```

**Response:**
```json
{
  "ok": true,
  "category": { "id": 456, "name": "New Category", "slug": "new-category" }
}
```

### `GET /api/woocommerce/tags`
Fetches all WooCommerce tags (with pagination handling).

### `POST /api/woocommerce/tags`
Creates a new tag (or returns existing if name matches).

### `POST /api/woocommerce/create-draft`
Creates a draft variable product with variations.

**Request:**
```json
{
  "name": "Product Title",
  "description": "Long description (HTML allowed)",
  "short_description": "Short description",
  "variationAttributes": [
    { "name": "Colour", "options": ["Red", "Blue", "Green"] },
    { "name": "Size", "options": ["Small", "Large"] }
  ],
  "categoryIds": [123, 456],
  "tagIds": [789]
}
```

**Response:**
```json
{
  "ok": true,
  "productId": 999,
  "permalink": "https://lakewayworkshop.co.uk/product/product-title",
  "adminEditUrl": "https://lakewayworkshop.co.uk/wp-admin/post.php?post=999&action=edit"
}
```

## Architecture

### Server-Side Only
All WooCommerce API calls are made server-side:
- Browser never calls WooCommerce directly
- No CORS issues
- Credentials never exposed to client

### Authentication
Uses WooCommerce REST API Basic Auth:
- Consumer Key as username
- Consumer Secret as password
- HTTPS required for security

### Validation
- Zod schemas validate all request payloads
- Server-side sanitization of variation attributes
- Client-side validation prevents invalid uploads

### Error Handling
- Meaningful error messages for users
- Technical details available in collapsible section
- No sensitive information logged

## Components

### `VariationsBuilder`
- Toggle variations on/off
- Dynamic attribute/value inputs
- Real-time validation and chip display
- Add/remove attributes
- Shows total variation count

### `WooCategoriesAndTags`
- Searchable multi-select interface
- Fetch existing categories/tags on mount
- Create new items by pressing Enter
- Auto-select newly created items
- Visual chips for selected items

## Troubleshooting

### "Failed to fetch categories/tags"
- Check WooCommerce REST API credentials
- Ensure `WOO_BASE_URL` is correct (HTTPS)
- Verify API key has Read/Write permissions
- Check WooCommerce site is accessible

### "Failed to create draft product"
- Check variation attributes are valid (at least 1 option each)
- Ensure WooCommerce is updated (REST API v3)
- Check WordPress/WooCommerce error logs

### "Network error"
- Check internet connection
- Verify WooCommerce site is online
- Check Vercel deployment logs if deployed

### Variations not showing in WooCommerce
- Variations are created but may take a moment to appear
- Refresh the product edit page
- Check the **Variations** tab in WooCommerce admin

## Future Enhancements

Potential improvements:
- [ ] SKU integration (link to SKU database)
- [ ] Bulk upload multiple products
- [ ] Image upload directly from app
- [ ] Price suggestions based on pricing calculator
- [ ] Sync back from WooCommerce (edit existing products)
- [ ] Direct Etsy integration alongside WooCommerce
- [ ] Template system for different product types

## Support

For issues or questions:
1. Check this documentation
2. Review error messages and technical details
3. Check WooCommerce and WordPress logs
4. Contact the development team

---

**Built with:** Next.js, TypeScript, WooCommerce REST API v3, Zod validation
