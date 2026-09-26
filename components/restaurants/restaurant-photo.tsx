"use client";

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
    <img
      src={`/api/restaurants/${restaurantId}/photo`}
      alt={alt}
      className={className}
      onError={() => setHasPhoto(false)}
    />
  );
}