import Image from "next/image";

export default function SummerSaleBanner() {
    return (
        <div className="w-full flex justify-center items-center bg-white my-10 relative h-[400px]">
            <Image
                src="/summer1.png"
                alt="Summer Sale"
                fill
                quality={100}
                className="object-contain rounded-xl"
            />
        </div>
    );
}