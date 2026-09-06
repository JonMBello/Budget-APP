import { z } from "zod";
import { personSchema, type Person } from "@/features/people/contracts";
import { PersonList } from "@/features/people/person-list";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await requireUser();
  let people: Person[] = [];
  try {
    const result = await authenticatedRequest<unknown[]>("/people?includeInactive=true");
    people = z.array(personSchema).parse(result);
  } catch {
    people = [];
  }

  return (
    <>
      <p className="eyebrow">DIRECTORIO</p>
      <h1>Personas</h1>
      <p className="muted">
        Gestiona las personas con quienes compartes gastos, divides suscripciones o
        llevas registro de préstamos.
      </p>
      <PersonList initialPeople={people} />
    </>
  );
}
