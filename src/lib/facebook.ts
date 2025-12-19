/**
 * Facebook Graph API v24.0 Integration
 * Handles posting to Facebook Business Pages
 */

export type FacebookPostRequest = {
  message: string;
  imageUrl?: string;
  scheduledPublishTime?: number; // Unix timestamp (optional, for scheduled posts)
};

export type FacebookPostResponse = {
  id: string; // Format: {page-id}_{post-id}
  postUrl: string;
};

export type FacebookErrorResponse = {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
};

/**
 * Posts a message (with optional image) to a Facebook Business Page
 * Uses Graph API v24.0
 *
 * @param message - The text content of the post
 * @param imageUrl - Optional URL of image to include in post
 * @param scheduledPublishTime - Optional Unix timestamp for scheduled posts
 * @returns Facebook post ID and URL
 */
export async function postToFacebookPage(
  message: string,
  imageUrl?: string,
  scheduledPublishTime?: number
): Promise<FacebookPostResponse> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId) {
    throw new Error('FACEBOOK_PAGE_ID environment variable is not set');
  }
  if (!pageAccessToken) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN environment variable is not set');
  }

  // Validate message
  if (!message || message.trim().length === 0) {
    throw new Error('Post message cannot be empty');
  }

  // Build the Graph API endpoint and form data
  const apiVersion = 'v24.0';
  const formData = new URLSearchParams();

  // Use /feed endpoint for both text and images
  // This has fewer restrictions than /photos endpoint
  const endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed?access_token=${encodeURIComponent(pageAccessToken)}`;

  formData.append('message', message);

  // If there's an image, add it as a link attachment
  if (imageUrl) {
    formData.append('link', imageUrl);
  }

  // Add scheduled publish time if provided
  if (scheduledPublishTime) {
    formData.append('published', 'false');
    formData.append('scheduled_publish_time', scheduledPublishTime.toString());
  }

  console.log('[Facebook] Posting to endpoint:', endpoint.replace(pageAccessToken, 'TOKEN_HIDDEN'));
  console.log('[Facebook] Form data:', Object.fromEntries(formData.entries()));

  // Make the API request with form-encoded data
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  console.log('[Facebook] Response status:', response.status);
  console.log('[Facebook] Response data:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    const fbError = data as FacebookErrorResponse;
    console.error('[Facebook] Full error object:', JSON.stringify(fbError, null, 2));
    throw new Error(
      `Facebook API error: ${fbError.error.message} (Code: ${fbError.error.code})`
    );
  }

  // Extract post ID from response
  const postId = data.id || data.post_id;

  if (!postId) {
    throw new Error('Facebook API did not return a post ID');
  }

  // Construct the post URL - all posts now use feed endpoint
  const postUrl = `https://www.facebook.com/${postId}`;

  return {
    id: postId,
    postUrl: postUrl,
  };
}

/**
 * Publishes a scheduled post immediately
 *
 * @param postId - The Facebook post ID
 * @returns Success status
 */
export async function publishScheduledPost(postId: string): Promise<boolean> {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageAccessToken) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN environment variable is not set');
  }

  const apiVersion = 'v24.0';
  const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}?access_token=${encodeURIComponent(pageAccessToken)}`;

  const formData = new URLSearchParams();
  formData.append('is_published', 'true');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const data = await response.json();
    const fbError = data as FacebookErrorResponse;
    throw new Error(
      `Facebook API error: ${fbError.error.message} (Code: ${fbError.error.code})`
    );
  }

  return true;
}

/**
 * Deletes a Facebook post
 *
 * @param postId - The Facebook post ID to delete
 * @returns Success status
 */
export async function deleteFacebookPost(postId: string): Promise<boolean> {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageAccessToken) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN environment variable is not set');
  }

  const apiVersion = 'v24.0';
  const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}`;

  const response = await fetch(
    `${endpoint}?access_token=${pageAccessToken}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const data = await response.json();
    const fbError = data as FacebookErrorResponse;
    throw new Error(
      `Facebook API error: ${fbError.error.message} (Code: ${fbError.error.code})`
    );
  }

  return true;
}
