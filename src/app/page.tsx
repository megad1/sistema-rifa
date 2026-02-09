import Header from "@/components/Header";
import PurchaseSection from "@/components/PurchaseSection";
import WinnersSection from "@/components/WinnersSection";
import LastWinnersSection from "@/components/LastWinnersSection";
import { getCampaignSettings } from "@/lib/campaign";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const settings = await getCampaignSettings();

  let drawLabel = '';
  try {
    if (settings.drawMode === 'fixedDate' && settings.drawDate) {
      const d = new Date(settings.drawDate + 'T00:00:00');
      drawLabel = d.toLocaleDateString('pt-BR');
    } else if (settings.drawMode === 'sameDay' && typeof settings.drawDay === 'number') {
      drawLabel = String(settings.drawDay).padStart(2, '0') + '/todo mês';
    } else if (settings.drawMode === 'today') {
      drawLabel = new Date().toLocaleDateString('pt-BR');
    }
  } catch { }

  return (
    <div className="bg-[#f5f0e8] min-h-screen">
      <Header
        logoMode={settings.logoMode}
        logoText={settings.logoText}
        logoImageUrl={settings.logoImageUrl}
      />

      {/* Container principal */}
      <div className="container mx-auto max-w-lg px-3 py-4">
        {/* Card da Campanha com PurchaseSection */}
        <PurchaseSection
          ticketPrice={1.99}
          drawLabel={drawLabel}
          campaignTitle={settings.title}
          campaignImage="https://assets.pixdomilhao.com.br/pix-do-milhao/sorteios/65/2d31323237383330373331.png?fm=webp&cs=origin&auto=compress&w=858&h=482"
          minQuantity={5}
          defaultQuantity={10}
        />
      </div>

      {/* Seção de Ganhadores - Raspou Achou */}
      <WinnersSection />

      {/* Seção Últimos Ganhadores - Confira quem mudou de vida */}
      <LastWinnersSection />
    </div>
  );
}
