import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';


export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isAdminRequest(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const payload = {
      enabled: Boolean(body?.enabled),
      token: String(body?.token || ''),
      platform: String(body?.platform || 'rifa-system'),
    };

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ id: 'utmify', value: payload }, { onConflict: 'id' });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


