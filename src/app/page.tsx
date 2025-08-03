import Campaign from "@/components/Campaign";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Prizes from "@/components/Prizes";
import Regulation from "@/components/Regulation";

export default function Home() {
  return (
    <div className="bg-[#f0f2f5] min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Campaign />
        <Prizes />
        <Regulation />
      </main>
      <Footer />
    </div>
  );
}
