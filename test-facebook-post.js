/**
 * Test script to post to Facebook
 * Run with: node test-facebook-post.js
 */

const ACCESS_TOKEN = 'EAAkZB3ugGRRwBQfksrcsp4CwBN9QuWk7o1kbAdlpYY3vDU1UUZCc0k7smDyPMNMv3L8peXZCZCYQL1e0FMYEuUeAFVMtCLllETqGe3GeBv3MSR5Gj2flqc2JK3PgU5wqQXO7nvvxU0mLhqQ2vEQt6CW7ZA6j2zpwZAixtpkf2nQ9ecHyKmy3v0kSZACs3bIPyXZC535kC6fxVNZAFDtCr9z7bY4zMQN103D7tS6fZCQAZDZD';

async function getPageId() {
  console.log('Step 1: Getting Page ID from access token...\n');

  const response = await fetch(
    `https://graph.facebook.com/v24.0/me?access_token=${ACCESS_TOKEN}`
  );

  const data = await response.json();
  console.log('Token Info:', JSON.stringify(data, null, 2));

  if (data.error) {
    throw new Error(`Error getting page info: ${data.error.message}`);
  }

  return data.id;
}

async function postToFacebook(pageId, message) {
  console.log(`\nStep 2: Posting to Facebook Page ID: ${pageId}\n`);

  const apiVersion = 'v24.0';
  const endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;

  const formData = new URLSearchParams();
  formData.append('message', message);
  formData.append('access_token', ACCESS_TOKEN);

  console.log('Endpoint:', endpoint);
  console.log('Message:', message);
  console.log('Form data:', Object.fromEntries(formData.entries()));
  console.log('\nMaking request...\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  console.log('Response Status:', response.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Facebook API error: ${data.error.message} (Code: ${data.error.code})`);
  }

  const postUrl = `https://www.facebook.com/${data.id}`;

  return {
    id: data.id,
    postUrl: postUrl,
  };
}

async function main() {
  try {
    console.log('=== Facebook Post Test ===\n');

    const pageId = await getPageId();

    const result = await postToFacebook(pageId, 'test sucess vercel');

    console.log('\n✅ SUCCESS!\n');
    console.log('Post ID:', result.id);
    console.log('Post URL:', result.postUrl);
    console.log('\nCheck your Facebook page to verify the post appeared!');

  } catch (error) {
    console.error('\n❌ ERROR:\n');
    console.error(error.message);
    console.error('\nFull error:', error);
  }
}

main();
