
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    const serializedMessages = messages.map(msg => ({
      ...msg,
      timestamp: Number(msg.timestamp),
    }));
    return NextResponse.json({ messages: serializedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { author, content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check cooldown (30 minutes)
    const cooldownMs = 30 * 60 * 1000;
    const now = Date.now();
    
    const existingCooldown = await prisma.postCooldown.findUnique({
      where: { ip },
    });

    if (existingCooldown) {
      const timeSinceLastPost = now - Number(existingCooldown.lastPostTime);
      if (timeSinceLastPost < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastPost;
        const minutes = Math.ceil(remainingMs / 60000);
        return NextResponse.json(
          { error: `Please wait ${minutes} minute(s) before posting again` },
          { status: 429 }
        );
      }
    }

    const newMessage = await prisma.message.create({
      data: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        author: author || 'Anonymous',
        content: content.substring(0, 200),
        timestamp: Date.now(),
        likes: 0,
      },
    });

    // Update cooldown
    await prisma.postCooldown.upsert({
      where: { ip },
      update: { lastPostTime: now },
      create: { ip, lastPostTime: now },
    });

    return NextResponse.json({ 
      success: true, 
      message: {
        ...newMessage,
        timestamp: Number(newMessage.timestamp),
      }
    });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
