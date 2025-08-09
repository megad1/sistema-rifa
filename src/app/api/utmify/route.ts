import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('id', 'utmify')
      .single();
    return NextResponse.json({ success: true, settings: (data?.value ?? {}) });
  } catch {
    return NextResponse.json({ success: true, settings: {} });
  }
}


