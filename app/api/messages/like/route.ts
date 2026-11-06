import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { messageId } = (await request.json().catch(() => null)) ?? {};
  if (typeof messageId !== 'string' || !messageId || messageId.length > 64) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
  }

  try {
    const ip = getClientIp(request) ?? 'unknown';
    const message = await prisma.$transaction(async (tx) => {
      const inserted = await tx.$executeRaw`
        INSERT INTO "MessageLike" ("messageId", "ip")
        SELECT "id", ${ip} FROM "Message" WHERE "id" = ${messageId}
        ON CONFLICT ("messageId", "ip") DO NOTHING
      `;
      const where = { id: messageId };
      return inserted
        ? tx.message.update({ where, data: { likes: { increment: 1 } } })
        : tx.message.findUnique({ where });
    });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, likes: message.likes });
  } catch (error) {
    console.error('Error liking message:', error);
    return NextResponse.json({ error: 'Failed to like message' }, { status: 500 });
  }
}
