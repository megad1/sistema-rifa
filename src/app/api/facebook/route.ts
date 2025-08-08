import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('id', 'facebook')
      .single();
    const settings = (data?.value ?? {}) as Record<string, unknown>;
    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json({ success: true, settings: {} });
  }
}


