import { notFound } from "next/navigation";
import { cardSchema, type Card } from "@/features/cards/contracts";
import { CardDetail } from "@/features/cards/card-detail";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  let card: Card;
  try {
    const result = await authenticatedRequest<unknown>(`/cards/${id}`);
    card = cardSchema.parse(result);
  } catch {
    notFound();
  }

  return (
    <>
      <p className="eyebrow">DETALLE DEL MÉTODO DE PAGO</p>
      <h1>{card.name}</h1>
      <CardDetail initialCard={card} />
    </>
  );
}
