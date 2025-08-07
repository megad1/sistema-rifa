// src/app/api/titulos/lookup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf } = body;

    if (!cpf) {
      return NextResponse.json({ success: false, message: 'CPF não fornecido.' }, { status: 400 });
    }

    // 1. Encontrar o cliente pelo CPF
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (clienteError || !cliente) {
      if (clienteError && clienteError.code !== 'PGRST116') { // Ignora erro de 'não encontrado'
          console.error('Erro ao buscar cliente:', clienteError);
          throw new Error('Erro ao consultar dados do cliente.');
      }
      // Se não encontrou o cliente, retorna uma lista vazia, o que não é um erro.
      return NextResponse.json({ success: true, compras: [] });
    }

    // 2. Buscar todas as compras do cliente, ordenadas da mais recente para a mais antiga
    const { data: compras, error: comprasError } = await supabaseAdmin
      .from('compras')
      .select('id, created_at, quantidade_bilhetes, valor_total, status')
      .eq('cliente_id', cliente.id)
      .eq('status', 'paid') // <-- AQUI ESTÁ A MUDANÇA
      .order('created_at', { ascending: false });

    if (comprasError) {
      console.error('Erro ao buscar compras:', comprasError);
      throw new Error('Não foi possível buscar o histórico de compras.');
    }

    if (!compras || compras.length === 0) {
        return NextResponse.json({ success: true, compras: [] });
    }

    // 3. Para cada compra, buscar os bilhetes associados
    const comprasComBilhetes = await Promise.all(
      compras.map(async (compra) => {
        if (compra.status !== 'paid') {
          return { ...compra, bilhetes: [] }; // Não busca bilhetes para compras não pagas
        }

        const { data: bilhetes, error: bilhetesError } = await supabaseAdmin
          .from('bilhetes')
          .select('numero')
          .eq('compra_id', compra.id);

        if (bilhetesError) {
          console.error(`Erro ao buscar bilhetes para a compra ${compra.id}:`, bilhetesError);
          // Retorna a compra mesmo que os bilhetes falhem, para não quebrar a UI
          return { ...compra, bilhetes: [] };
        }
        
        return { ...compra, bilhetes: bilhetes || [] };
      })
    );

    return NextResponse.json({ success: true, compras: comprasComBilhetes });

  } catch (err) {
    console.error("Erro na API de busca de bilhetes:", err);
    let errorMessage = "Ocorreu um erro desconhecido.";
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

