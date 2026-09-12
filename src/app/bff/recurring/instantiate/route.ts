import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/server/api";
import { instantiateRecurringResultSchema, instantiateRecurringSchema } from "@/features/recurring/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = instantiateRecurringSchema.parse(raw);
    const result = await authenticatedRequest<unknown>("/recurring/instantiate", {
      method: "POST",
      body,
    });
    const parsed = instantiateRecurringResultSchema.safeParse(result);
    if (!parsed.success || parsed.data.periodId !== body.periodId) {
      return privateJson({ message: "No pudimos confirmar el resultado. Revisa los gastos del periodo antes de reintentar." }, 502);
    }
    for (const path of ["/", "/expenses", "/incomes", "/recurring"]) revalidatePath(path);
    return privateJson(parsed.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return privateJson({ message: "No se pudo agregar al periodo. Comprueba que siga abierto y actualiza la página antes de reintentar." }, 409);
    }
    return failure(error);
  }
}
