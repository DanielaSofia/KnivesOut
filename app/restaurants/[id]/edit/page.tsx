import { notFound } from "next/navigation";

import { RestaurantForm } from "../../../../components/restaurants/restaurant-form";
import { DeleteRestaurantButton } from "../../../../components/restaurants/delete-restaurant-button";
import { prisma } from "../../../../lib/prisma";

type EditRestaurantPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ photoError?: string | string[] }>;
};

export default async function EditRestaurantPage({
  params,
  searchParams,
}: EditRestaurantPageProps) {
  const restaurantId = Number((await params).id);

  if (!Number.isInteger(restaurantId)) {
    notFound();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      name: true,
      city: true,
      address: true,
      description: true,
      websiteUrl: true,
      instagramUrl: true,
      facebookUrl: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  const photoErrorValue = (await searchParams)?.photoError;
  const photoError = Array.isArray(photoErrorValue)
    ? photoErrorValue[0]
    : photoErrorValue;

  return (
    <RestaurantForm
      title="Editar restaurante"
      eyebrow="Atualizar lugar"
      submitLabel="Guardar alterações"
      savingLabel="A guardar..."
      endpoint={`/api/restaurants/${restaurantId}`}
      method="PUT"
      backHref={`/restaurants/${restaurantId}`}
      footer={<DeleteRestaurantButton restaurantId={restaurantId} />}
      photoRestaurantId={restaurantId}
      initialError={photoError}
      initialValues={{
        name: restaurant.name,
        city: restaurant.city ?? "",
        address: restaurant.address ?? "",
        description: restaurant.description ?? "",
        websiteUrl: restaurant.websiteUrl ?? "",
        instagramUrl: restaurant.instagramUrl ?? "",
        facebookUrl: restaurant.facebookUrl ?? "",
      }}
    />
  );
}