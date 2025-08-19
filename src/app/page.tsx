import Image from "next/image";
import Header from "@/components/Header";
import Campaign from "@/components/Campaign";
import MyTicketsBar from "@/components/MyTicketsBar";
import PurchaseSection from "@/components/PurchaseSection";
import Prizes from "@/components/Prizes";
import Regulation from "@/components/Regulation";
import Footer from "@/components/Footer";
import { getCampaignSettings } from "@/lib/campaign";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const settings = await getCampaignSettings();
  const banner = settings.imageUrl;
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
  } catch {}

  return (
    <div className="bg-[#ebebeb]"> 
      <Header logoMode={settings.logoMode} logoText={settings.logoText} logoImageUrl={settings.logoImageUrl} />
      
      {/* Container para Banner */}
      <div className="relative">
        <div className="w-full h-[220px] sm:h-[300px] md:h-[360px] bg-black">
          <div className="relative h-full w-full">
            <Image
              src={banner}
              alt="Prêmio"
              fill
              priority
              unoptimized
              className="object-contain object-center"
            />
            {/* Gradiente que cobre a metade inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
          </div>
        </div>
        {/* Texto da campanha sobreposto */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <Campaign title={settings.title} subtitle={settings.subtitle} />
        </div>
      </div>
      
      {/* Container principal de conteúdo */}
      <div className="container mx-auto max-w-lg px-4 mt-2 space-y-2">
        <MyTicketsBar />
        <PurchaseSection ticketPrice={settings.ticketPrice} drawLabel={drawLabel} campaignTitle={settings.title} campaignImage={settings.imageUrl} />
        <Regulation />
        <Prizes />
      </div>
      
      <Footer />
    </div>
  );
}
