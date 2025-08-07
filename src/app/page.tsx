import Image from "next/image";
import Header from "@/components/Header";
import Campaign from "@/components/Campaign";
import MyTicketsBar from "@/components/MyTicketsBar";
import PurchaseSection from "@/components/PurchaseSection";
import Prizes from "@/components/Prizes";
import Regulation from "@/components/Regulation";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-[#ebebeb]"> 
      <Header />
      
      {/* Container para Banner */}
      <div className="relative">
        <div className="h-[300px] w-full">
          <div className="relative h-full w-full">
            <Image
              src="https://s3.incrivelsorteios.com/redimensiona?key=600x600/20250731_688b54af15d40.jpg"
              alt="Prêmio"
              fill
              priority
              className="object-cover object-center"
            />
            {/* Gradiente que cobre a metade inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
          </div>
        </div>
        {/* Texto da campanha sobreposto */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <Campaign />
        </div>
      </div>
      
      {/* Container principal de conteúdo */}
      <div className="container mx-auto max-w-lg px-4 mt-2 space-y-2">
        <MyTicketsBar />
        <PurchaseSection />
        <Regulation />
        <Prizes />
      </div>
      
      <Footer />
    </div>
  );
}
