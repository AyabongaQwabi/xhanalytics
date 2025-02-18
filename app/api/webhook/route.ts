import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    const pageAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    console.log('Received event:', event);
    if (!slackWebhookUrl || !pageAccessToken) {
      console.error('Missing Slack webhook URL or access token');
      return NextResponse.json(
        { error: 'Missing Slack webhook URL or access token' },
        { status: 400 }
      );
    }

    // Log the received event type
    console.log('Received event type:', event.object);

    // Extract relevant details from the event
    const eventDetails = event.entry
      .map((entry: any) => {
        return entry.changes.map((change: any) => {
          if (change.field === 'feed') {
            return {
              type: 'post',
              field: change.field,
              item: change.value.item,
              post_id: change.value.post_id,
              verb: change.value.verb,
              message: change.value.message,
              from: change.value.from,
              created_time: change.value.created_time,
            };
          } else if (change.field === 'messages') {
            return {
              type: 'message',
              field: change.field,
              sender: change.value.sender.id,
              recipient: change.value.recipient.id,
              timestamp: change.value.timestamp,
              message_id: change.value.message.mid,
              text: change.value.message.text,
              commands: change.value.message.commands,
            };
          }
        });
      })
      .flat();
    console.log('Sending Event details:', eventDetails);
    // Beautify the event message for Slack
    const slackMessage = {
      text: `*Received event from Facebook:*\n${eventDetails
        .map((detail: any) => {
          if (detail.type === 'post') {
            return `
*Field:* ${detail.field}
*Item:* ${detail.item}
*Post ID:* ${detail.post_id}
*Verb:* ${detail.verb}
*Message:* ${detail.message}
*From:* ${detail.from.name} (ID: ${detail.from.id})
*Created Time:* ${new Date(detail.created_time * 1000).toLocaleString()}
`;
          } else if (detail.type === 'message') {
            return `
*Field:* ${detail.field}
*Sender ID:* ${detail.sender}
*Recipient ID:* ${detail.recipient}
*Timestamp:* ${new Date(detail.timestamp * 1000).toLocaleString()}
*Message ID:* ${detail.message_id}
*Text:* ${detail.text}
*Commands:* ${detail.commands.map((command: any) => command.name).join(', ')}
`;
          }
        })
        .join('\n')}`,
    };

    // Send the event to Slack
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });
    console.log('Sent event to Slack');

    // Check if the event is a new post
    if (event.object === 'page' && event.entry) {
      console.log('posting comment on facebook post');
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

    console.log('Processed event successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('Error processing event:', error);
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.NEXT_PUBLIC_FACEBOOK_VERIFY_TOKEN; // Store in environment variables

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
