import { z } from "zod";
import { createRecurringSchema, recurringTemplateSchema } from "@/features/recurring/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const category = searchParams.get("category");

    const queryParts: string[] = [];
    if (includeInactive) queryParts.push("includeInactive=true");
    if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
    const path = `/recurring${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;

    const result = await authenticatedRequest<unknown[]>(path);
    const templates = z.array(recurringTemplateSchema).parse(result);
    return privateJson(templates);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = createRecurringSchema.parse(raw);
    const result = await authenticatedRequest<unknown>("/recurring", {
      method: "POST",
      body,
    });
    const template = recurringTemplateSchema.parse(result);
    return privateJson(template, 201);
  } catch (error) {
    return failure(error);
  }
}
