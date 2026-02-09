import { NextResponse } from 'next/server';
import { getCampaignSettings } from '@/lib/campaign';

export const runtime = 'edge';

export async function GET() {
  const c = await getCampaignSettings();
  return NextResponse.json({ price: c.ticketPrice });
}
