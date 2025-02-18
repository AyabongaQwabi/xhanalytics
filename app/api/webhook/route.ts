import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();
    const pageAccessToken = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN; // Store securely

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${postId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `
          Stream and Download Xhosa Hip Hop Videos on https://www.xhap.co.za
          Shop & Blog on https://espazza.co.za`,
          access_token: pageAccessToken,
        }),
      }
    );

    const data = await response.json();
    if (data.error) throw data.error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('\n\nError pposting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('\n\nError pposting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 }
    );
  }
}
