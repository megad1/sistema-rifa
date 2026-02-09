import { NextResponse } from 'next/server';
import { buildLogoutCookie } from '@/lib/clientAuth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', buildLogoutCookie());
  return res;
}


