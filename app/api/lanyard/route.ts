import { NextResponse } from 'next/server';

export async function GET() {
  const discordId = process.env.DISCORD_ID?.trim() || process.env.NEXT_PUBLIC_DISCORD_ID?.trim();
  if (!discordId || !/^\d+$/.test(discordId)) {
    return NextResponse.json({ error: 'Discord status is not configured' }, { status: 503 });
  }

  return NextResponse.json({ discordId });
}
