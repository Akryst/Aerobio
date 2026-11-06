import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    if (ip) {
      await prisma.$executeRaw`
        INSERT INTO "PostCooldown" ("ip", "lastPostTime") VALUES (${`visit_${ip}`}, ${Date.now()})
        ON CONFLICT ("ip") DO NOTHING
      `;
    }

    // Get total unique visitors
    const totalVisitors = await prisma.postCooldown.count({
      where: {
        ip: {
          startsWith: 'visit_',
          not: 'visit_unknown',
        },
      },
    });

    return NextResponse.json({ count: totalVisitors });
  } catch (error) {
    console.error('Visitor count error:', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
