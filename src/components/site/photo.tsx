import Image from "next/image";

type PhotoProps = {
  /** Путь внутри public/, например /images/hero-proizvodstvo.png. */
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
};

/** Фото заполняет родителя: у родителя должен быть position и размер. */
export function Photo({ src, alt, sizes, priority = false }: PhotoProps) {
  return (
    <Image
      src={encodeURI(src)}
      alt={alt}
      fill
      sizes={sizes}
      quality={75}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
