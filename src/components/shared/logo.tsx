import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Cota Rush inicio">
      <Image
        src="/cotarush-logo.png"
        alt="Cota Rush"
        width={620}
        height={210}
        priority
        className="h-11 w-auto max-w-[170px] object-contain sm:max-w-[210px]"
      />
    </Link>
  );
}
