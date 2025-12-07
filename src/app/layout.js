import { Kanit, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AlertProvider } from "@/providers/AlertProvider";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
      <body
        className={`${kanit.variable} ${notoSansSC.variable} antialiased`}
        style={{ fontFamily: 'var(--font-kanit), var(--font-noto-sans-sc), sans-serif' }}
      >
        <AlertProvider>
          <Navbar />
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
