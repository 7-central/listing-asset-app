/**
 * Instagram Graph API Integration
 * Handles posting to Instagram Business Accounts
 *
 * Instagram posting is a 2-step process:
 * 1. Create a media container with the image URL and caption
 * 2. Publish the container to make it visible on Instagram
 */

export type InstagramPostRequest = {
  caption: string;
  imageUrl: string;
};

export type InstagramPostResponse = {
  id: string; // Media container ID
  postUrl: string; // Instagram post URL
};

export type InstagramErrorResponse = {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
};

/**
 * Posts an image with caption to Instagram Business Account
 * Uses Graph API v24.0
 *
 * Instagram has specific requirements:
 * - Image must be publicly accessible URL (HTTPS)
 * - Caption max length: 2,200 characters
 * - Image must be at least 320px and max 1080px (recommended)
 * - Supported formats: JPEG, PNG
 *
 * @param caption - The text caption for the post (supports hashtags, mentions, emojis)
 * @param imageUrl - Public HTTPS URL of the image to post
 * @returns Instagram post ID and URL
 */
export async function postToInstagram(
  caption: string,
  imageUrl: string
): Promise<InstagramPostResponse> {
  const instagramAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!instagramAccountId) {
    throw new Error('INSTAGRAM_BUSINESS_ACCOUNT_ID environment variable is not set');
  }
  if (!accessToken) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN environment variable is not set');
  }

  // Validate inputs
  if (!caption || caption.trim().length === 0) {
    throw new Error('Post caption cannot be empty');
  }
  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error('Image URL must be a valid HTTP/HTTPS URL');
  }

  const apiVersion = 'v24.0';

  // STEP 1: Create media container
  console.log('[Instagram] Step 1: Creating media container');

  const createEndpoint = `https://graph.facebook.com/${apiVersion}/${instagramAccountId}/media`;

  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption: caption,
    access_token: accessToken,
  });

  console.log('[Instagram] Create endpoint:', createEndpoint);
  console.log('[Instagram] Image URL:', imageUrl);
  console.log('[Instagram] Caption length:', caption.length);

  const createResponse = await fetch(`${createEndpoint}?${createParams.toString()}`, {
    method: 'POST',
  });

  const createData = await createResponse.json();

  console.log('[Instagram] Create response status:', createResponse.status);
  console.log('[Instagram] Create response data:', JSON.stringify(createData, null, 2));

  if (!createResponse.ok) {
    const igError = createData as InstagramErrorResponse;
    console.error('[Instagram] Create error:', JSON.stringify(igError, null, 2));
    throw new Error(
      `Instagram API error (create): ${igError.error.message} (Code: ${igError.error.code})`
    );
  }

  const containerId = createData.id;

  if (!containerId) {
    throw new Error('Instagram API did not return a container ID');
  }

  console.log('[Instagram] Media container created:', containerId);

  // STEP 2: Publish the media container
  console.log('[Instagram] Step 2: Publishing media container');

  const publishEndpoint = `https://graph.facebook.com/${apiVersion}/${instagramAccountId}/media_publish`;

  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const publishResponse = await fetch(`${publishEndpoint}?${publishParams.toString()}`, {
    method: 'POST',
  });

  const publishData = await publishResponse.json();

  console.log('[Instagram] Publish response status:', publishResponse.status);
  console.log('[Instagram] Publish response data:', JSON.stringify(publishData, null, 2));

  if (!publishResponse.ok) {
    const igError = publishData as InstagramErrorResponse;
    console.error('[Instagram] Publish error:', JSON.stringify(igError, null, 2));
    throw new Error(
      `Instagram API error (publish): ${igError.error.message} (Code: ${igError.error.code})`
    );
  }

  const mediaId = publishData.id;

  if (!mediaId) {
    throw new Error('Instagram API did not return a media ID');
  }

  console.log('[Instagram] Post published successfully:', mediaId);

  // Construct the Instagram post URL
  // Format: https://www.instagram.com/p/{shortcode}/
  // We can't get the shortcode directly, so we return the media ID
  // User can view it in their Instagram profile
  const postUrl = `https://www.instagram.com/`;

  return {
    id: mediaId,
    postUrl: postUrl,
  };
}

/**
 * Deletes an Instagram post
 *
 * @param mediaId - The Instagram media ID to delete
 * @returns Success status
 */
export async function deleteInstagramPost(mediaId: string): Promise<boolean> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN environment variable is not set');
  }

  const apiVersion = 'v24.0';
  const endpoint = `https://graph.facebook.com/${apiVersion}/${mediaId}`;

  const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    const igError = data as InstagramErrorResponse;
    throw new Error(
      `Instagram API error: ${igError.error.message} (Code: ${igError.error.code})`
    );
  }

  return true;
}
