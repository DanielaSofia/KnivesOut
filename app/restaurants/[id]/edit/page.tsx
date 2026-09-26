import { notFound } from "next/navigation";

import { RestaurantForm } from "../../../../components/restaurants/restaurant-form";
import { DeleteRestaurantButton } from "../../../../components/restaurants/delete-restaurant-button";
import { prisma } from "../../../../lib/prisma";

type EditRestaurantPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRestaurantPage({
  params,
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
    },
  });

  if (!restaurant) {
    notFound();
  }

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
      photoUrl={`/api/restaurants/${restaurantId}/photo`}
      initialValues={{
        name: restaurant.name,
        city: restaurant.city ?? "",
        address: restaurant.address ?? "",
        description: restaurant.description ?? "",
      }}
    />
  );
}