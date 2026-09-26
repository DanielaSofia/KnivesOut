"use client";

import Image from "next/image";
import { useState } from "react";

export function RestaurantPhoto({
  restaurantId,
  alt,
  className,
  fallbackClassName,
}: {
  restaurantId: number;
  alt: string;
  className: string;
  fallbackClassName: string;
}) {
  const [hasPhoto, setHasPhoto] = useState(true);

  if (!hasPhoto) {
    return <div className={fallbackClassName}>🍽️</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={`/api/restaurants/${restaurantId}/photo`}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 448px"
        unoptimized
        onError={() => setHasPhoto(false)}
      />
    </div>
  );
}