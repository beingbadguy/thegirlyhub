import { FaWhatsapp } from "react-icons/fa";

const whatsappMessage =
  "Hello GirlyHub team, I would like to know more about your products and available collections. Please assist me. Thank you!";

const FloatingWhatsApp = () => {
  const whatsappUrl = `https://wa.me/919667549765?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with GirlyHub on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-20 right-4 z-[1000] flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-900/25 transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] md:bottom-6 md:right-6"
    >
      <FaWhatsapp className="size-8" aria-hidden="true" />
    </a>
  );
};

export default FloatingWhatsApp;
