import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
};

export function CmsImage({ src, alt, className = "", fill, width, height }: Props) {
  const optimized =
    src.startsWith("/api/assets") ||
    src.startsWith("https://images.unsplash.com") ||
    src.startsWith("https://lh3.googleusercontent.com");

  if (!optimized) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
      />
    );
  }

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} />;
  }

  return <Image src={src} alt={alt} width={width ?? 800} height={height ?? 600} className={className} />;
}
