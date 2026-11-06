import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function hash(secret: string) {
  return createHash('sha256').update(secret).digest();
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = process.env.ADMIN_SECRET?.trim();
  const authorization = request.headers.get('authorization');
  if (!secret || !authorization?.startsWith('Bearer ') ||
      !timingSafeEqual(hash(secret), hash(authorization.slice(7)))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { count } = await prisma.message.deleteMany({ where: { id } });
    if (!count) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
