import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Received event');
    const event = await req.json();
    console.log('Event:', event);
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    const pageAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!slackWebhookUrl || !pageAccessToken) {
      console.log('Missing Slack webhook URL or access token');
      return NextResponse.json(
        { error: 'Missing Slack webhook URL or access token' },
        { status: 400 }
      );
    }

    // Log the received event type
    console.log('Received event type:', event.object);

    // Send the event to Slack
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Received event: ${JSON.stringify(event)}`,
      }),
    });

    // Check if the event is a new post
    if (event.object === 'page' && event.entry) {
      for (const entry of event.entry) {
        for (const change of entry.changes) {
          if (change.field === 'feed' && change.value.item === 'post') {
            const postId = change.value.post_id;
            const fbApiUrl = `https://graph.facebook.com/v19.0/${postId}/comments`;
            const payload = {
              message: `Stream and Download Xhosa Hip Hop Videos on https://www.xhap.co.za\nShop & Blog on https://espazza.co.za`,
              access_token: pageAccessToken,
            };

            await fetch(fbApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('Error processing event:', error);
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
}
