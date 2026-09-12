import { notFound } from "next/navigation";
import { z } from "zod";
import { recurringTemplateSchema, type RecurringTemplate } from "@/features/recurring/contracts";
import { cardSchema, type Card } from "@/features/cards/contracts";
import { personSchema, type Person } from "@/features/people/contracts";
import { RecurringDetail } from "@/features/recurring/recurring-detail";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function RecurringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  let template: RecurringTemplate;
  try {
    const result = await authenticatedRequest<unknown>(`/recurring/${id}`);
    template = recurringTemplateSchema.parse(result);
  } catch {
    notFound();
  }

  let cards: Card[] = [];
  try {
    const resultCards = await authenticatedRequest<unknown[]>("/cards");
    cards = z.array(cardSchema).parse(resultCards);
  } catch {
    cards = [];
  }

  let people: Person[] = [];
  try {
    const resultPeople = await authenticatedRequest<unknown[]>("/people");
    people = z.array(personSchema).parse(resultPeople);
  } catch {
    people = [];
  }

  return (
    <>
      <p className="eyebrow">DETALLE DEL COMPROMISO</p>
      <h1>{template.title}</h1>
      <RecurringDetail
        initialTemplate={template}
        cards={cards}
        people={people}
      />
    </>
  );
}
