// src/app/api/clients/lookup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { limparTelefone } from '@/utils/formatters';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { telefone, cpf } = body;

    if (!telefone && !cpf) {
      return NextResponse.json({ success: false, message: 'Telefone ou CPF não fornecido.' }, { status: 400 });
    }

    let query = supabaseAdmin.from('clientes').select('nome, email, cpf, telefone');

    if (cpf) {
      // Limpa CPF: remove não dígitos
      const cleanCpf = String(cpf).replace(/\D/g, '');
      query = query.eq('cpf', cleanCpf);
    } else {
      // Limpa Telefone
      const cleanPhone = limparTelefone(telefone);
      query = query.eq('telefone', cleanPhone);
    }

    const { data: cliente, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente no Supabase:', error);
      return NextResponse.json({ success: false, message: 'Erro ao consultar o banco de dados.' }, { status: 500 });
    }

    if (cliente) {
      // Retorna dados encontrados.
      // Se buscou por CPF, retorna telefone mascarado? Ou full?
      // O frontend precisa do telefone para contato/pix.
      // Vamos retornar os dados que temos. O frontend decide como exibir.
      // Mas por segurança, CPF sempre mascarado se a busca foi por telefone.
      // Se a busca foi por CPF, o usuário JÁ TEM o CPF, então podemos confirmar.
      // Vamos retornar os dados "limpos" e o front formata.

      const responseData = {
        nome: cliente.nome,
        email: cliente.email,
        cpf: cliente.cpf, // Pode retornar completo pois será preenchido no input se necessário, ou mascarado. O front decide.
        telefone: cliente.telefone
      };

      return NextResponse.json({ success: true, found: true, cliente: responseData });
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
