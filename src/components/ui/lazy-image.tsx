"use client";

import type { CSSProperties } from "react";
import Image, { type ImageProps } from "next/image";
import clsx from "clsx";

import styles from "./lazy-image.module.scss";

export type LazyImageProps = ImageProps & {
  frameClassName?: string;
};

/**
 * Обёртка над `next/image`: `sizes` + внутренний srcset, фиксированные пропорции при width/height.
 * Без `priority` — ленивая загрузка; `placeholder="empty"` резервирует место под кадр.
 */
export function LazyImage({
  priority = false,
  frameClassName,
  className,
  placeholder,
  width,
  height,
  fill,
  alt,
  sizes,
  style,
  ...rest
}: LazyImageProps) {
  const resolvedPlaceholder =
    placeholder ?? ("blurDataURL" in rest && rest.blurDataURL ? "blur" : "empty");

  if (fill) {
    return (
      <span className={clsx(styles.frame, styles.frameFill, frameClassName)} style={style}>
        <Image
          alt={alt}
          fill
          className={clsx(styles.imgFill, className)}
          priority={priority}
          placeholder={resolvedPlaceholder}
          sizes={sizes ?? "100vw"}
          {...rest}
        />
      </span>
    );
  }

  const frameStyle: CSSProperties | undefined =
    width && height ? { ["--lazy-ar" as string]: `${width} / ${height}` } : undefined;

  return (
    <span className={clsx(styles.frame, styles.frameRatio, frameClassName)} style={frameStyle}>
      <Image
        alt={alt}
        className={clsx(styles.imgBlock, className)}
        width={width}
        height={height}
        sizes={sizes}
        style={style}
        priority={priority}
        placeholder={resolvedPlaceholder}
        {...rest}
      />
    </span>
  );
}
