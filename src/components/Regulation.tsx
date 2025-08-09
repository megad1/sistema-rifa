// src/components/Regulation.tsx
"use client";

import { useState } from 'react';

const Regulation = () => {
  const [isOpen, setIsOpen] = useState(false);

  // HTML do regulamento com as tags <strong>
  const regulationHTML = `
    <p>O WESLEY ALEMÃO PRÊMIOS VI.58 é um Título de Capitalização da Modalidade Filantropia Premiável, de pagamento único, emitido pela VIA CAPITALIZAÇÃO S.A. (VIACAP), Sociedade de Capitalização inscrita no CNPJ sob o Número 88.076.302/0001-94, com sede na Av. Carlos Gomes, 222, Conj. 901, Bairro Boa Vista, Porto Alegre/RS, CEP 90480-000. <strong>A contratação deste título é apropriada principalmente na hipótese de o consumidor estar interessado em contribuir com entidades beneficentes de assistência sociais, certificadas nos termos da legislação vigente, e participar de sorteio(s).</strong> Ao adquirir o WESLEY ALEMÃO PRÊMIOS VI.58 você concorrerá aos sorteios previstos neste Título e 100% do direito de resgate do seu Título será revertido ao INSTITUTO PLURAL, Entidade Filantrópica inscrita no CNPJ sob o Número 12.671.638/0001-33, com sede na Avenida 15 de Novembro, 62, Centro, Cornélio Procópio/PR, CEP 86.300-000, para utilização dos recursos em seus projetos de assistência social e nas diversas atividades da entidade, caso não haja comunicação contrária à Sociedade de Capitalização. Conheça mais sobre o trabalho e os projetos do INSTITUTO PLURAL através do site www.institutoplural.org.br. É obrigatório o preenchimento correto da Ficha de Cadastro no momento de aquisição do título. Antes de contratar, consulte previamente as Condições Gerais do Título, cuja versão completa está disponível para consulta no site www.susep.gov.br. Este Título de Capitalização foi aprovado pela Superintendência de Seguros Privados – SUSEP – através do Processo SUSEP nº 15414.643737/2025-93.</p>
    <p><strong>1 – SORTEIOS:</strong> Ao adquirir o WESLEY ALEMÃO PRÊMIOS VI.58 o Subscritor irá concorrer aos sorteios das modalidades: 1.1) Loteria Federal: Você concorre em 1 sorteio apurado com base na extração da Loteria Federal do dia 09/08/2025. Para concorrer aos sorteios previstos nesta modalidade o Título contém impresso 1 Número(s) da Sorte, não repetido(s) na mesma série, compreendido(s) no intervalo entre “0.000.000” e “9.999.999". Para efeito de apuração, ao menos um Número da Sorte impresso no título deverá coincidir, com o número formado pela combinação dos três últimos algarismos do primeiro prêmio da Loteria Federal, seguidos dos três últimos algarismos do segundo prêmio e do terceiro algarismo do terceiro prêmio da Loteria Federal. Regra de Aproximação. Caso a combinação contemplada, apurada pela forma descrita, não tenha sido distribuída a um participante e a série tenha atingido a quantidade mínima para haver contemplação obrigatória, será aplicada a seguinte regra de aproximação: será contemplado o participante que possuir o próximo Número da Sorte imediatamente posterior ao efetivamente apurado, na forma acima, e assim sucessivamente até que seja identificado um participante contemplado em cada uma das premiações da modalidade "Loteria Federal". Na hipótese de não ter sido atingido a quantidade mínimo de vendas para haver a contemplação obrigatória, será comunicado, por meio de mídia impressa e/ou eletrônica, que não haverá contemplação obrigatória na respectiva apuração.1.2) Modalidade Instantânea: No momento da aquisição do título, o titular concorrerá à premiação instantânea e identificará se o título foi contemplado caso o seu número da sorte corresponda a um dos números indicados no material de divulgação. Serão distribuídos 100 prêmios nesta modalidade. Caso, por qualquer motivo, a Loteria Federal não venha a realizar a extração na data prevista de sorteio, será considerada, para fins do disposto neste Capítulo, a extração seguinte que vier a ser por ela realizada. Caso a Caixa Econômica Federal suspenda definitivamente as extrações da Loteria Federal do Brasil, ou modifique as referidas extrações de forma que não mais coincidam com as regras deste sorteio, ou haja qualquer impedimento à vinculação da Loteria Federal aos sorteios previstos, a VIA Capitalização S.A, num prazo máximo de trinta dias, promoverá o sorteio não realizado com aparelhos próprios e em local de livre acesso ao público, sob fiscalização de auditoria independente e em idênticas condições às previstas originalmente no título, dando prévia e ampla divulgação do fato. <strong>Os Títulos sorteados em todas as premiações descritas anteriormente, exceto os títulos sorteados nos prêmios da modalidade 'Premiação Instantânea', serão resgatados antecipadamente quando da realização do respectivo sorteio e não concorrerão aos próximos sorteios. 2 – SÉRIES E PROBABILIDADES:</strong> Os Títulos são ordenados em séries de 10.000.000 unidades e a probabilidade mínima de contemplação, considerando todos os Títulos da série, será igual a uma chance em 10.000.000 para cada um dos sorteios previstos neste Título. O percentual de 39,57710% do valor da contribuição única do Título é destinado à capitalização, que irá gerar um capital mínimo de resgate igual a 39,70385%, ao fim da vigência. O valor de 20,86580% da contribuição única do Título é destinado ao sorteio. Os custos com promoção de distribuição do Título estão abrangidos pela quota de carregamento, que é de 39,55710%, e representam 1% da contribuição única, podendo haver remuneração adicional, de acordo com a performance do produto, conforme previsto em contrato de distribuição.</p>
    <p><strong>3 – VIGÊNCIA:</strong> A vigência do Título é de 2 meses.</p>
    <p><strong>4 – RESGATE:</strong> O valor do resgate estará disponível ao Titular do direito de resgate após 2 meses de carência.</p>
    <p><strong>5 – DATA, HORA E LOCAL DOS SORTEIOS:</strong> Os sorteios serão realizados com base na extração da Loteria Federal do dia 09/08/2025, na hora e local divulgados pela Caixa Econômica Federal.</p>
    <p><strong>6 – PRÊMIOS:</strong> Para o recebimento do prêmio, quando contemplado, o Subscritor deverá apresentar o Título original contemplado ou o comprovante de aquisição pelo aplicativo/site; RG e CPF válidos; comprovante de residência atualizado e os dados bancários para depósito. O valor dos prêmios descritos é líquido de imposto de renda. A VIACAP pagará a premiação em até 15 (quinze) dias corridos, contados da apresentação da documentação exigida.</p>
    <p><strong>7 – DISPOSIÇÕES GERAIS:</strong> A aquisição implica automática adesão às Condições Gerais do Título, das quais o Subscritor declara ter tomado ciência previamente a aquisição. Os direitos e obrigações decorrentes deste Título prescrevem no prazo estabelecido na legislação. Na hipóstese de extravio do Título, a responsabilidade será exclusivamente do Subscritor. O foro competente para dirimir eventuais questões oriundas do presente Regulamento será o do domicílio do Subscritor. É proibida a venda de título de capitalização a menores de dezesseis anos. A aprovação deste plano pela SUSEP, não implica, por parte da Autarquia, em incentivo ou recomendação à sua aquisição, representando, exclusivamente, sua adequação às normas em vigor. Os dados pessoais acessados em razão da contratação deste título de capitalização serão tradados nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Para mais informações consulte o <strong>SAC: 0800 740 7819</strong>. OUVIDORIA: 0800 8741 505.</p>
    <p>PREMIAÇÃO: VW TERA HIGH TSI – ANO 2026 (SUGESTÃO DE USO DO PRÊMIO LÍQUIDO R$ 140.000,00)</p>
    <p>Instantâneas: 100 TÍTULOS PREMIADOS DE R$ 300,00&nbsp;</p>
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
