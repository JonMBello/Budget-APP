import { notFound } from "next/navigation";
import { personSchema, type Person } from "@/features/people/contracts";
import { PersonDetail } from "@/features/people/person-detail";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  let person: Person;
  try {
    const result = await authenticatedRequest<unknown>(`/people/${id}`);
    person = personSchema.parse(result);
  } catch {
    notFound();
  }

  return (
    <>
      <p className="eyebrow">DETALLE DE PERSONA</p>
      <h1>{person.name}</h1>
      <PersonDetail initialPerson={person} />
    </>
  );
}
