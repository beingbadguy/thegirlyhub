import "./(site)/globals.css";
import {
  Poppins,
  Bodoni_Moda,
  Instrument_Serif,
  Darker_Grotesque,
  Caveat,
  Playfair_Display,
} from "next/font/google";
import NotFoundPage from "./(site)/not-found";
import HeaderSection from "@/components/HeaderSection";
import Footer from "@/components/Footer";
import AnnouncementBand from "@/components/AnnouncementBand";
import StickyMenuBar from "@/components/StickyMenuBar";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import CartDrawer from "@/components/CartDrawer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const darkerGrotesque = Darker_Grotesque({
  variable: "--font-darker-grotesque",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${bodoniModa.variable} ${instrumentSerif.variable} ${darkerGrotesque.variable} ${caveat.variable} ${playfair.variable} antialiased custom-scrollbar overflow-x-hidden`}
      >
        <AnnouncementBand />
        <HeaderSection />
        <StickyMenuBar />
        <FloatingWhatsApp />
        <CartDrawer />
        <NotFoundPage />
        <Footer />
      </body>
    </html>
  );
}
