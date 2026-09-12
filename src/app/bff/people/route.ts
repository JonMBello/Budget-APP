import { z } from "zod";
import { createPersonSchema, personSchema } from "@/features/people/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const path = `/people${includeInactive ? "?includeInactive=true" : ""}`;
    const result = await authenticatedRequest<unknown[]>(path);
    const people = z.array(personSchema).parse(result);
    return privateJson(people);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = createPersonSchema.parse(raw);
    const result = await authenticatedRequest<unknown>("/people", {
      method: "POST",
      body,
    });
    const person = personSchema.parse(result);
    return privateJson(person, 201);
  } catch (error) {
    return failure(error);
  }
}
