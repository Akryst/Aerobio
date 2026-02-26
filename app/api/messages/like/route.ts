import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { likes: { increment: 1 } },
    });

    return NextResponse.json({ success: true, likes: updated.likes });
  } catch (error) {
    console.error('Error liking message:', error);
    return NextResponse.json({ error: 'Failed to like message' }, { status: 500 });
  }
}
