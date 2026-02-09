import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Evita expor tokens no público. Apenas admin pode consultar.
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
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


