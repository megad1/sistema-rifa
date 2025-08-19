import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { getFacebookSettings } from '@/lib/facebook';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Rifas",
  description: "Sistema de rifas online",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fb = await getFacebookSettings();
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {fb.enabled && fb.pixelId && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">{`
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return; n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[];
                t=b.createElement(e); t.async=!0; t.src=v; s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s)
              }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fb.pixelId}');
              fbq('track','PageView');
            `}</Script>
            <noscript dangerouslySetInnerHTML={{ __html: `<img height=\"1\" width=\"1\" style=\"display:none\" src=\"https://www.facebook.com/tr?id=${fb.pixelId}&ev=PageView&noscript=1\" alt=\"\" referrerpolicy=\"no-referrer-when-downgrade\" />` }} />
          </>
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
                document.addEventListener('dblclick', function (e) { e.preventDefault(); });
              } catch {}
            `,
          }}
        />
      </body>
    </html>
  );
}
