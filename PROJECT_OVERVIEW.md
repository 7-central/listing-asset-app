# Listing Asset App – Project Overview (MVP)

## 1. Purpose

This app is an internal tool for **Lakeway Workshop / Tier8** to help team members (e.g. Joe and Dave) generate **product listing assets** for:

- **Etsy**
- **WooCommerce**

The app should:

1. Take a small amount of structured input about a product.
2. Call the **OpenAI API** to generate high-quality listing copy.
3. Save the generated assets into **Airtable** in a predictable, structured way.
4. Let team members open Airtable alongside Etsy/WooCommerce and copy/paste the content.

This is an **MVP**, but the codebase must be structured in a **modular, extensible way** so we can add functionality later without breaking what already works.

---

## 2. MVP Requirements

### 2.1 Tech Stack

- **Frontend / Backend:** Next.js (App Router, TypeScript)
- **Hosting:** Vercel
- **AI:** OpenAI Chat Completions API
- **Storage (MVP):** Airtable base + “Listings” table
- **Auth (MVP):** None – the app will be internal and accessed only via a private URL

### 2.2 User Flow (Joe / Dave)

1. User opens the web app (single-page UI is fine for MVP).
2. They see a **form** with clear fields that guide them to describe the product:
   - Product name (internal / display)
   - “What is this product?” (plain-language description)
   - “Who is it for / what occasions?”  
   - “What variations are available?” (e.g. colour, size)
   - “Does it allow personalisation? If yes, what exactly can be personalised?”  
   - Optional: price notes and postage notes

3. User clicks **“Generate Listing Assets”**.
4. The frontend sends the form data to an internal API route, e.g. `POST /api/generate-listing`.
5. The API route:
   - Builds a structured prompt for OpenAI using the form fields.
   - Calls the OpenAI API and **expects JSON output** with:
     - `title` (string)  
     - `description` (string)  
     - `keyFeatures` (string array)  
     - `tags` (string array)  
     - `personalisationShort` (string)  
     - `personalisationLong` (string)
   - Parses the JSON response safely (with error handling).
   - Writes a **new row** into Airtable’s `Listings` table with:
     - Raw input fields (what the user typed)
     - The generated fields above
     - Optional numeric fields (price, postage) if provided
     - Initial `Status` = `"Draft"` or `"Ready for Etsy"` (configurable)

6. The API returns a simple success response to the frontend, plus the generated JSON so the user can see the output immediately.
7. Joe/Dave then open a **read-only Airtable view** in another tab/window and copy/paste into Etsy or WooCommerce.

### 2.3 Airtable MVP Schema

Base name (for reference): `LW Listing Assets`  
Main table: `Listings`

Fields (approximate; the code should treat them as configurable constants):

- `Product Name` – single line text
- `Internal SKU` – single line text
- `Status` – single select (`Draft`, `Ready for Etsy`, `Archived`)

**Raw input fields (from form):**

- `Raw Input – What is it?` – long text
- `Raw Input – Who is it for?` – long text
- `Raw Input – Variations` – long text
- `Raw Input – Personalisation` – long text
- `Raw Input – Price/Postage notes` – long text

**Generated output fields (from OpenAI):**

- `Etsy Title` – single line text
- `Etsy Description` – long text
- `Key Features (bullets)` – long text (one bullet per line)
- `Etsy Tags` – long text (comma-separated or line-separated)
- `Personalisation – Short` – long text
- `Personalisation – Long` – long text

**Optional numeric fields:**

- `Price (GBP)` – number, 2dp
- `Postage – First Item` – number, 2dp
- `Postage – Additional Item` – number, 2dp

---

## 3. Non-Goals for MVP

These are **explicitly out of scope** for the first version and should not block delivery:

- No user authentication / roles.
- No image upload integration (user will still upload images directly to Etsy/Woo for now).
- No internal dashboard/table view in the app itself (Airtable provides that via a shared view).
- No direct Etsy/WooCommerce API integration.
- No complex pricing or shipping logic beyond notes captured in the form.

All of these may be added later; the code should make that easy but not depend on them.

---

## 4. Architecture & Modularity Requirements

The code should be written to be **easy to extend**. Some guiding principles:

### 4.1 Separation of Concerns

- **UI Layer**  
  - React components/pages handle layout, forms, and simple client-side validation.
  - No Airtable or OpenAI logic directly in components.

- **API Layer**  
  - Next.js route handler(s), e.g. `app/api/generate-listing/route.ts`, act as controllers.
  - They:
    - Validate input payloads (TypeScript types + runtime checks if needed).
    - Call service functions for OpenAI + Airtable.
    - Handle errors and return clean JSON responses.

- **Service Layer (pure functions where possible)**  
  - `lib/openai.ts` – functions to:
    - Build prompts from structured input.
    - Call OpenAI.
    - Parse/validate the JSON response.
  - `lib/airtable.ts` – functions to:
    - Insert a new listing row.
    - (Later) update existing rows, query by status, etc.

- **Types & Models**  
  - Shared TypeScript types for:
    - `ListingInput` (form data shape)
    - `ListingAssets` (generated data shape)
    - `AirtableListingFields` (fields written to Airtable)
  - These should live in a common folder (e.g. `lib/types.ts`) to avoid duplication.

### 4.2 Environment & Configuration

Use environment variables (through Vercel) for all secrets and IDs:

- `OPENAI_API_KEY`
- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`
- (Optionally) `AIRTABLE_TABLE_NAME` – default `"Listings"`

The code should **never hard-code secrets** or inline base IDs; they must be read from `process.env`.

### 4.3 Extensibility Goals

Future changes we want to be able to make without rewriting everything:

1. **Replace Airtable with a database**  
   - The Airtable service module should be the only place that knows about Airtable’s API.
   - In future we could swap `lib/airtable.ts` with `lib/db.ts` backed by Postgres or another store, keeping the rest of the app stable.

2. **Add WooCommerce-specific and Etsy-specific fields**  
   - The core `ListingAssets` type should be generic enough for both.
   - Later we can add:
     - WooCommerce categories, attributes, SEO fields
     - Etsy-specific attributes, shipping profiles, etc.

3. **Add a dashboard UI**  
   - In future we can add pages like `/dashboard` or `/listings/[id]` that read from the same data layer.
   - The current API routes and services should already expose the right shapes to make this easy.

4. **Add authentication**  
   - The API routes should be written so we can later wrap them with auth middleware (e.g. NextAuth, Clerk, custom token check) without changing the business logic.

---

## 5. Implementation Notes / Expectations

- Use **TypeScript** throughout.
- Use **App Router** (`app/` directory), not the legacy `pages/` router.
- Keep the initial UI simple and focused on **Joe and Dave**:
  - One main page with a form.
  - On successful generation, show a confirmation and the generated text (for reassurance).
- Handle errors gracefully:
  - If OpenAI fails or returns invalid JSON, show a clear error message.
  - If Airtable write fails, log the response and show a user-friendly message.

The goal is to ship a **working MVP quickly**, but with structure that supports adding features and swapping out Airtable later without large refactors.
