import { Sarabun, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AlertProvider } from "@/providers/AlertProvider";

import Script from "next/script";

// TH Sarabun (Google Fonts "Sarabun" by Cadson Demak — the web edition of
// TH Sarabun New). Goes up to ExtraBold (800); it has no 900 weight.
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "Chinese Learning App",
  description: "Learn Chinese Vocabulary",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager - Global site tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17579997185"
        />
        {/* Google AdSense (Revenue) */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6059901629514213"
          crossOrigin="anonymous"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-17579997185');
          `}
        </Script>
      </head>
      <body
        className={`${sarabun.variable} ${notoSansSC.variable} antialiased flex flex-col min-h-screen`}
        style={{ fontFamily: 'var(--font-sarabun), var(--font-noto-sans-sc), sans-serif' }}
      >
        <AlertProvider>
          <Navbar />
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
