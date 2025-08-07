// src/utils/formatters.ts

/**
 * Limpa uma string de telefone, removendo máscaras e garantindo um formato válido.
 * @param telefone A string de telefone com ou sem formatação.
 * @returns Uma string de telefone limpa e padronizada, ou um valor padrão.
 */
export function limparTelefone(telefone: string | null): string {
    if (!telefone) return "11999999999";

    let telefone_limpo = telefone.replace(/[^0-9]/g, '');

    if (telefone_limpo.startsWith('0')) {
        telefone_limpo = telefone_limpo.substring(1);
    }

    // Adiciona DDD padrão se não existir
    if (telefone_limpo.length === 8 || telefone_limpo.length === 9) {
        telefone_limpo = '11' + telefone_limpo;
    }

    if (telefone_limpo.length < 10) {
        return "11999999999"; // Retorna um padrão em caso de formato inválido
    }

    return telefone_limpo;
}

/**
 * Limpa uma string de CPF, removendo toda a formatação.
 * @param cpf A string de CPF com ou sem formatação.
 * @returns Uma string contendo apenas os dígitos do CPF.
 */
export function limparCpf(cpf: string | null): string {
    if (!cpf) return "";
    return cpf.replace(/[^0-g]/g, '');
}

