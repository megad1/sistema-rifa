import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';


export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Autorização robusta via cookie assinado
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const title: string | undefined = body?.title;
    const imageUrl: string | undefined = body?.imageUrl;
    if (!title && !imageUrl) {
      return NextResponse.json({ success: false, message: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ id: 'campaign', value: { title, imageUrl } }, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


