// src/components/Regulation.tsx
"use client";

import { useState } from 'react';

const Regulation = () => {
  const [isOpen, setIsOpen] = useState(false);

  // HTML do regulamento com as tags <strong>
  const regulationHTML = `
    <p>Este é um Título de Capitalização da Modalidade Filantropia Premiável, de pagamento único, emitido pela VIA CAPITALIZAÇÃO S.A. (VIACAP), Sociedade de Capitalização inscrita no CNPJ sob o Número 88.076.302/0001-94, com sede na Av. Carlos Gomes, 222, Conj. 901, Bairro Boa Vista, Porto Alegre/RS, CEP 90480-000. <strong>A contratação deste título é apropriada principalmente na hipótese de o consumidor estar interessado em contribuir com entidades beneficentes de assistência sociais, certificadas nos termos da legislação vigente, e participar de sorteio(s).</strong> Ao adquirir este Título você concorrerá aos sorteios previstos e 100% do direito de resgate do seu Título será revertido ao INSTITUTO PLURAL, Entidade Filantrópica inscrita no CNPJ sob o Número 12.671.638/0001-33, com sede na Avenida 15 de Novembro, 62, Centro, Cornélio Procópio/PR, CEP 86.300-000, para utilização dos recursos em seus projetos de assistência social e nas diversas atividades da entidade, caso não haja comunicação contrária à Sociedade de Capitalização. Conheça mais sobre o trabalho e os projetos do INSTITUTO PLURAL através do site www.institutoplural.org.br. É obrigatório o preenchimento correto da Ficha de Cadastro no momento de aquisição do título. Antes de contratar, consulte previamente as Condições Gerais do Título, cuja versão completa está disponível para consulta no site www.susep.gov.br. Este Título de Capitalização foi aprovado pela Superintendência de Seguros Privados – SUSEP.</p>
    <p><strong>1 – SORTEIOS:</strong> Ao adquirir este Título o Subscritor irá concorrer aos sorteios das modalidades definidas pela regulamentação vigente. Em caso de indisponibilidade da Loteria Federal nas datas previstas, a VIA Capitalização S.A, em até trinta dias, promoverá sorteio substitutivo em local de livre acesso ao público, sob fiscalização de auditoria independente, em condições idênticas às previstas originalmente, dando ampla divulgação.</p>
    <p><strong>2 – SÉRIES E PROBABILIDADES:</strong> Os Títulos são ordenados em séries e a probabilidade mínima de contemplação, considerando todos os Títulos da série, é definida conforme as Condições Gerais. Percentuais de capitalização, sorteio e carregamento seguem as regras contratuais vigentes.</p>
    <p><strong>3 – VIGÊNCIA:</strong> A vigência do Título é de 2 meses.</p>
    <p><strong>4 – RESGATE:</strong> O valor do resgate estará disponível ao Titular do direito de resgate após 2 meses de carência.</p>
    <p><strong>5 – PRÊMIOS:</strong> Para recebimento do prêmio, quando contemplado, o Subscritor deverá apresentar o Título original contemplado ou o comprovante de aquisição pelo aplicativo/site; RG e CPF válidos; comprovante de residência atualizado e os dados bancários para depósito. Os prêmios descritos são líquidos de imposto de renda. A VIACAP pagará a premiação em até 15 (quinze) dias corridos, contados da apresentação da documentação exigida.</p>
    <p><strong>6 – DISPOSIÇÕES GERAIS:</strong> A aquisição implica automática adesão às Condições Gerais do Título, das quais o Subscritor declara ter tomado ciência previamente à aquisição. Os direitos e obrigações decorrentes deste Título prescrevem no prazo estabelecido na legislação. Em caso de extravio do Título, a responsabilidade é exclusivamente do Subscritor. O foro competente para dirimir eventuais questões é o do domicílio do Subscritor. É proibida a venda de título de capitalização a menores de dezesseis anos. A aprovação deste plano pela SUSEP não implica, por parte da Autarquia, incentivo ou recomendação à sua aquisição. Os dados pessoais tratados em razão da contratação deste Título observarão a Lei nº 13.709/2018 (LGPD). Para mais informações consulte o <strong>SAC: 0800 740 7819</strong>. OUVIDORIA: 0800 8741 505.</p>
  `;

  return (
    <section className="bg-white p-2 rounded-lg shadow-md mt-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-start items-center text-left font-semibold text-xs text-gray-700"
      >
        <i className={`bi ${isOpen ? 'bi-arrow-up-square-fill' : 'bi-arrow-down-square-fill'} text-lg text-gray-800 mr-2`}></i>
        Descrição/Regulamento
      </button>
      {isOpen && (
        <div 
          className="text-xs text-gray-600 space-y-2 mt-2 border-t pt-2 overflow-y-auto max-h-40"
          aria-live="polite"
        >
          {/* Conteúdo estático controlado localmente, sem entrada do usuário */}
          <div dangerouslySetInnerHTML={{ __html: regulationHTML }} />
        </div>
      )}
    </section>
  );
};

export default Regulation;
