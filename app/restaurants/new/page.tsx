import { RestaurantForm } from "../../../components/restaurants/restaurant-form";

export default function NewRestaurantPage() {
  return (
    <RestaurantForm
      title="Adicionar restaurante"
      eyebrow="Novo lugar"
      submitLabel="Guardar restaurante"
      savingLabel="A guardar..."
      endpoint="/api/restaurants"
      method="POST"
      backHref="/restaurants"
    />
  );
}
