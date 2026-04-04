import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    if (!webhookUrl) return NextResponse.json({ error: 'Slack Webhook URL not configured' }, { status: 500 });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      }),
    });

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to send to Slack', details: await response.text() }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
