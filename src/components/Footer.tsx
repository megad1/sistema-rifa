// src/components/Footer.tsx
import Image from 'next/image';

const Footer = () => {
    const legalText = `
    Título de Capitalização da Modalidade Filantropia Premiável de Contribuição Única, emitido pela VIACAP Capitalização S/A, CNPJ 88.076.302/0001-94, aprovado pelo Processo SUSEP que consta no Título. SAC 0800 740 7819. OUVIDORIA 0800 8741 505, de segunda a sexta-feira, das 8h às 17h. É proibida a venda de título de capitalização a menores de dezesseis anos. O valor não exigido dentro do prazo prescricional, estabelecido pela legislação em vigor, acarretará a perda desse direito. A aquisição deste título implica a cessão de 100% do direito de resgate ao INSTITUTO PLURAL, certificada nos termos da legislação em vigor. Antes de contratar consulte previamente as Condições Gerais. As condições contratuais/regulamento deste produto protocolizadas pela sociedade junto à SUSEP poderão ser consultadas no endereço eletrônico www.susep.gov.br, de acordo com o número de processo constante da proposta. Consulte as informações legais da Resolução CNSP 382/2020 em www.viacapitalizacao.com.br/. Prêmios líquidos de imposto de renda. Imagens meramente ilustrativas.
  `;

  return (
    <footer className="bg-[#ebebeb] text-gray-600 text-xs py-6 mt-4">
      <div className="container mx-auto max-w-lg px-4 space-y-4 text-center">
        
        {/* Logos parceiros */}
        <div className="flex justify-center items-center space-x-6">
          <Image src='https://incs-bucket.s3.amazonaws.com/via-cap-colorido.png' alt='VIACAP Capitalização' width={80} height={40} />
          <Image src='https://incs-bucket.s3.amazonaws.com/instituto-plural.png' alt='Instituto Plural' width={80} height={40} />
        </div>
        
        {/* Texto Legal */}
        <p 
          className="text-justify" 
          style={{fontSize: '0.65rem', lineHeight: '1.5'}}
          aria-live="polite"
        >
          {/* Texto estático controlado pelo código, seguro para render HTML básico */}
          <span dangerouslySetInnerHTML={{ __html: legalText.replace(/\n/g, '<br />') }} />
        </p>

        {/* Copyright */}
        <p style={{fontSize: '0.7rem'}}>
          2025 Sistema de Rifas© - Todos os direitos reservados.
        </p>
        
        {/* Removido crédito do desenvolvedor a pedido do cliente */}
        
        {/* Selo Google */}
        <div className="flex justify-center pt-2">
            <Image src="https://incs-bucket.s3.us-east-1.amazonaws.com/assets/google-report.png" alt="Google Safe Browsing" width={110} height={40} />
        </div>

      </div>
    </footer>
  );
};

export default Footer;
