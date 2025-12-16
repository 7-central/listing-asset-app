import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createDraftVariableProduct } from '@/lib/woocommerce';

// Zod schema for request validation
const CreateDraftSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Product description is required'),
  short_description: z.string().optional().default(''),
  variationAttributes: z.array(
    z.object({
      name: z.string().min(1, 'Attribute name is required'),
      options: z.array(z.string()).min(1, 'At least one option is required'),
    })
  ),
  categoryIds: z.array(z.number()).default([]),
  tagIds: z.array(z.number()).default([]),
});

// POST /api/woocommerce/create-draft - Create a draft variable product with variations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = CreateDraftSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid request data',
          details: {
            status: 400,
            message: validationResult.error.issues.map((e) => e.message).join(', '),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Sanitize variation attributes
    const sanitizedAttributes = data.variationAttributes.map((attr) => {
      // Normalize attribute name
      const name = attr.name.trim().replace(/\s+/g, ' ');

      // Sanitize options: trim, remove empty, dedupe (case-insensitive)
      const seenOptions = new Set<string>();
      const options = attr.options
        .map((opt) => opt.trim())
        .filter((opt) => {
          if (!opt) return false;
          const lowerOpt = opt.toLowerCase();
          if (seenOptions.has(lowerOpt)) return false;
          seenOptions.add(lowerOpt);
          return true;
        });

      return { name, options };
    });

    // Additional validation: ensure at least one variation attribute if variations exist
    if (sanitizedAttributes.length > 0) {
      for (const attr of sanitizedAttributes) {
        if (attr.options.length === 0) {
          return NextResponse.json(
            {
              ok: false,
              error: `Attribute "${attr.name}" must have at least one valid option`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Create the draft variable product
    const result = await createDraftVariableProduct({
      name: data.name,
      description: data.description,
      short_description: data.short_description,
      variationAttributes: sanitizedAttributes,
      categoryIds: data.categoryIds,
      tagIds: data.tagIds,
    });

    return NextResponse.json({
      ok: true,
      productId: result.productId,
      permalink: result.permalink,
      adminEditUrl: result.adminEditUrl,
    });
  } catch (error: any) {
    console.error('[API] Error creating draft product:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create draft product',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}
