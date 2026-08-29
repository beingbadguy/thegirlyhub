import Image from "next/image";

export default function SummerSaleBanner() {
    return (
        <div className="w-full flex justify-center items-center bg-white my-10">
            <Image
                src="/newsummer.png"
                alt="Summer Sale"
                width={1920}
                height={600}
                quality={100}
                className="w-full h-auto object-contain rounded-xl"
            />
        </div>
    );
}