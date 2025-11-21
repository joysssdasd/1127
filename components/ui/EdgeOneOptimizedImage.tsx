import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface EdgeOneOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * EdgeOne 优化的图片组件
 *
 * EdgeOne 静态托管不支持 Next.js 的图片优化，
 * 所以需要特殊处理来确保最佳性能
 */
export function EdgeOneOptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fallbackSrc,
  loading = 'lazy',
  ...props
}: EdgeOneOptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgError, setImgError] = useState(false);

  // 检测是否在 EdgeOne 环境
  const isEdgeOne = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'edgeone';

  useEffect(() => {
    setImgSrc(src);
    setImgError(false);
  }, [src]);

  // 错误处理
  const handleError = () => {
    if (!imgError && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setImgError(true);
    }
  };

  // 如果是 EdgeOne 环境，使用不优化的图片
  if (isEdgeOne) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        onError={handleError}
        style={{
          objectFit: 'cover',
          maxWidth: '100%',
          height: 'auto',
        }}
        {...props}
      />
    );
  }

  // Vercel 环境使用优化图片
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={loading}
      onError={handleError}
      unoptimized={false}
      {...props}
    />
  );
}

// 预设图片尺寸配置
export const IMAGE_SIZES = {
  avatar: { width: 64, height: 64 },
  thumbnail: { width: 200, height: 150 },
  card: { width: 400, height: 300 },
  banner: { width: 1200, height: 400 },
  full: { width: 1920, height: 1080 },
} as const;

// 常用的图片类型组件
export function AvatarImage({ src, alt, ...props }: Omit<EdgeOneOptimizedImageProps, 'width' | 'height'>) {
  return (
    <EdgeOneOptimizedImage
      src={src}
      alt={alt}
      {...IMAGE_SIZES.avatar}
      className={`rounded-full object-cover ${props.className || ''}`}
      {...props}
    />
  );
}

export function ThumbnailImage({ src, alt, ...props }: Omit<EdgeOneOptimizedImageProps, 'width' | 'height'>) {
  return (
    <EdgeOneOptimizedImage
      src={src}
      alt={alt}
      {...IMAGE_SIZES.thumbnail}
      className={`rounded-lg object-cover ${props.className || ''}`}
      {...props}
    />
  );
}

export function CardImage({ src, alt, ...props }: Omit<EdgeOneOptimizedImageProps, 'width' | 'height'>) {
  return (
    <EdgeOneOptimizedImage
      src={src}
      alt={alt}
      {...IMAGE_SIZES.card}
      className={`rounded-lg object-cover ${props.className || ''}`}
      {...props}
    />
  );
}

export function BannerImage({ src, alt, ...props }: Omit<EdgeOneOptimizedImageProps, 'width' | 'height'>) {
  return (
    <EdgeOneOptimizedImage
      src={src}
      alt={alt}
      {...IMAGE_SIZES.banner}
      className={`w-full object-cover ${props.className || ''}`}
      priority={true}
      {...props}
    />
  );
}