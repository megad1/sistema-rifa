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
    const subtitle: string | undefined = body?.subtitle;
    const logoMode: 'text' | 'image' | undefined = body?.logoMode;
    const logoText: string | undefined = body?.logoText;
    const logoImageUrl: string | undefined = body?.logoImageUrl;
    const ticketPrice: number | undefined = typeof body?.ticketPrice === 'number' ? body.ticketPrice : undefined;
    const drawMode: 'fixedDate' | 'sameDay' | undefined = body?.drawMode;
    const drawDate: string | null | undefined = body?.drawDate ?? undefined; // string ou null
    const drawDay: number | null | undefined = (typeof body?.drawDay === 'number' || body?.drawDay === null) ? body.drawDay : undefined;
    const minQuantity: number | undefined = typeof body?.minQuantity === 'number' ? body.minQuantity : undefined;

    if (
      title === undefined &&
      imageUrl === undefined &&
      ticketPrice === undefined &&
      drawMode === undefined &&
      drawDate === undefined &&
      drawDay === undefined &&
      logoMode === undefined &&
      logoText === undefined &&
      logoImageUrl === undefined &&
      minQuantity === undefined
    ) {
      return NextResponse.json({ success: false, message: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    if (title !== undefined) payload.title = title;
    if (imageUrl !== undefined) payload.imageUrl = imageUrl;
    if (subtitle !== undefined) payload.subtitle = subtitle;
    if (logoMode !== undefined) payload.logoMode = logoMode;
    if (logoText !== undefined) payload.logoText = logoText;
    if (logoImageUrl !== undefined) payload.logoImageUrl = logoImageUrl;
    if (ticketPrice !== undefined) payload.ticketPrice = ticketPrice;
    if (drawMode !== undefined) payload.drawMode = drawMode;
    if (drawDate !== undefined) payload.drawDate = drawDate;
    if (drawDay !== undefined) payload.drawDay = drawDay;
    if (minQuantity !== undefined) payload.minQuantity = Math.max(1, Math.floor(minQuantity));

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ id: 'campaign', value: payload }, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


