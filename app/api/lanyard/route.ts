import { NextResponse } from 'next/server';
import { getLanyardData } from '@/lib/lanyard';

export async function GET() {
  const discordId = process.env.NEXT_PUBLIC_DISCORD_ID || '1368371401546928148';

  try {
    const data = await getLanyardData(discordId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Lanyard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord status' },
      { status: 500 }
    );
  }
}
