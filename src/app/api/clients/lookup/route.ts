// src/app/api/clients/lookup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { limparTelefone } from '@/utils/formatters';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { telefone } = body;

    if (!telefone) {
      return NextResponse.json({ success: false, message: 'Telefone não fornecido.' }, { status: 400 });
    }

    // Limpa a máscara do telefone para buscar no banco (usa util compartilhado)
    telefone = limparTelefone(telefone);

    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('nome, email, cpf')
      .eq('telefone', telefone)
      .single(); // .single() para pegar apenas um resultado ou null

    if (error && error.code !== 'PGRST116') { // PGRST116: significa 'nenhuma linha encontrada', o que não é um erro para nós
      console.error('Erro ao buscar cliente no Supabase:', error);
      throw new Error('Erro ao consultar o banco de dados.');
    }

    if (cliente) {
      // Evita expor CPF completo via API pública
      const maskedCpf = String(cliente.cpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      const safeCliente = { nome: cliente.nome, email: cliente.email, cpf: maskedCpf };
      return NextResponse.json({ success: true, found: true, cliente: safeCliente });
    } else {
      return NextResponse.json({ success: true, found: false });
    }

  } catch (err) {
    console.error("Erro na API de busca de cliente:", err);
    let errorMessage = "Ocorreu um erro desconhecido.";
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

