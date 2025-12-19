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

  // Build the Graph API endpoint
  const apiVersion = 'v24.0';
  let endpoint: string;
  let body: Record<string, any>;

  if (imageUrl) {
    // Post with photo using /photos endpoint
    endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
    body = {
      url: imageUrl,
      caption: message,
      access_token: pageAccessToken,
    };
  } else {
    // Text-only post using /feed endpoint
    endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
    body = {
      message: message,
      access_token: pageAccessToken,
    };
  }

  // Add scheduled publish time if provided
  if (scheduledPublishTime) {
    body.published = false;
    body.scheduled_publish_time = scheduledPublishTime;
  }

  // Make the API request
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const fbError = data as FacebookErrorResponse;
    throw new Error(
      `Facebook API error: ${fbError.error.message} (Code: ${fbError.error.code})`
    );
  }

  // Extract post ID from response
  const postId = data.id || data.post_id;

  if (!postId) {
    throw new Error('Facebook API did not return a post ID');
  }

  // Construct the post URL
  // For photos: https://www.facebook.com/{page-id}/photos/{photo-id}
  // For feed posts: https://www.facebook.com/{post-id}
  const postUrl = imageUrl
    ? `https://www.facebook.com/${pageId}/photos/${postId}`
    : `https://www.facebook.com/${postId}`;

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
  const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      is_published: true,
      access_token: pageAccessToken,
    }),
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
