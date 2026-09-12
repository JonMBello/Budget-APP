import { z } from "zod";
import { cardSchema, createCardSchema } from "@/features/cards/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const path = `/cards${includeInactive ? "?includeInactive=true" : ""}`;
    const result = await authenticatedRequest<unknown[]>(path);
    const cards = z.array(cardSchema).parse(result);
    return privateJson(cards);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = createCardSchema.parse(raw);
    const result = await authenticatedRequest<unknown>("/cards", {
      method: "POST",
      body,
    });
    const card = cardSchema.parse(result);
    return privateJson(card, 201);
  } catch (error) {
    return failure(error);
  }
}
