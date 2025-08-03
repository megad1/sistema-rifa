// src/components/Footer.tsx
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-transparent text-gray-500 text-xs py-8">
      <div className="container mx-auto max-w-3xl px-4 space-y-4 text-center">
        <div className="flex justify-center items-center space-x-4">
          <Image src='https://incs-bucket.s3.amazonaws.com/via-cap-colorido.png' alt='Capitalizadora' width={100} height={50} />
          <Image src='https://incs-bucket.s3.amazonaws.com/instituto-plural.png' alt='Instituição' width={150} height={70} />
        </div>
        <p className="text-justify text-gray-500">
          Título de Capitalização da Modalidade Filantropia Premiável de Contribuição Única, emitido pela VIACAP Capitalização S/A, CNPJ 88.076.302/0001-94, aprovado pelo Processo SUSEP que consta no Título. SAC 0800 740 7819. OUVIDORIA 0800 8741 505, de segunda a sexta-feira, das 8h às 17h. É proibida a venda de título de capitalização a menores de dezesseis anos. O valor não exigido dentro do prazo prescricional, estabelecido pela legislação em vigor, acarretará a perda desse direito. A aquisição deste título implica a cessão de 100% do direito de resgate ao INSTITUTO PLURAL, certificada nos termos da legislação em vigor. Antes de contratar consulte previamente as Condições Gerais. As condições contratuais/regulamento deste produto protocolizadas pela sociedade junto à SUSEP poderão ser consultadas no endereço eletrônico www.susep.gov.br, de acordo com o número de processo constante da proposta. Consulte as informações legais da Resolução CNSP 382/2020 em www.viacapitalizacao.com.br/. Prêmios líquidos de imposto de renda. Confira o resultado dos sorteios e as condições de participação em www.wesleyalemao.com.br . Imagens meramente ilustrativas.
        </p>
        <p>
          2025 Wesley Alemão© - Todos os direitos reservados.
        </p>
        <div className="text-xs">
          Desenvolvido por
          <a href="https://incrivel.tech/" target="_blank" rel="noreferrer" className="font-semibold text-sm bg-gray-800 text-white px-2 py-1 rounded-md ml-1">
            Incrível.Tech
          </a>
        </div>
        <div className="flex justify-center pt-4">
            <Image src="https://incs-bucket.s3.us-east-1.amazonaws.com/assets/google-report.png" alt="Google Safe Browsing" width={120} height={40} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
