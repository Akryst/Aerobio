import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check cooldown (30 minutes)
    const cooldownMs = 30 * 60 * 1000;
    const now = Date.now();
    
    const existingVisit = await prisma.postCooldown.findUnique({
      where: { ip: `visit_${ip}` },
    });

    let shouldCount = true;
    if (existingVisit) {
      const timeSinceLastVisit = now - Number(existingVisit.lastPostTime);
      if (timeSinceLastVisit < cooldownMs) {
        shouldCount = false;
      }
    }

    // Count visit if cooldown passed
    if (shouldCount) {
      await prisma.postCooldown.upsert({
        where: { ip: `visit_${ip}` },
        update: { lastPostTime: now },
        create: { ip: `visit_${ip}`, lastPostTime: now },
      });
    }

    // Get total unique visitors
    const totalVisitors = await prisma.postCooldown.count({
      where: {
        ip: {
          startsWith: 'visit_',
        },
      },
    });

    return NextResponse.json({ count: totalVisitors });
  } catch (error) {
    console.error('Visitor count error:', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
