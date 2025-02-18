import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();
    const pageAccessToken = process.env.FACEBOOK_ACCESS_TOKEN; // Secure storage

    if (!postId || !pageAccessToken) {
      return NextResponse.json(
        { error: 'Missing postId or access token' },
        { status: 400 }
      );
    }

    const fbApiUrl = `https://graph.facebook.com/v19.0/${postId}/comments`;
    const payload = {
      message: `Stream and Download Xhosa Hip Hop Videos on https://www.xhap.co.za\nShop & Blog on https://espazza.co.za`,
      access_token: pageAccessToken,
    };

    const response = await fetch(fbApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Facebook API Error: ${data.error?.message || 'Unknown error'}`
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment', details: error.message },
      { status: 500 }
    );
  }
}

// Facebook Webhook Verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN; // Store in environment variables

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    return new Response(challenge, { status: 200 }); // Facebook expects plain text response
  } else {
    console.error('❌ Webhook verification failed');
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 403 }
    );
  }
}
