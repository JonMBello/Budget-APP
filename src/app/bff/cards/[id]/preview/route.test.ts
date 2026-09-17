// @vitest-environment node
import { expect, it, vi } from "vitest";
import { GET } from "./route";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/server/session", () => ({ authenticatedRequest: request }));
const preview = { cutoffDate: "2026-10-09", paymentDueDate: "2026-10-20", impactBudgetYear: 2026, impactBudgetMonth: 10, daysUntilDue: 34 };
const get = () => GET(new Request("http://localhost/bff/cards/card-1/preview?date=2026-09-16"), { params: Promise.resolve({ id: "card-1" }) });

it.each(["2026-10-09", null])("adapts the API cutoff date (%s) and preserves the calculation", async (cutoffDate) => {
  request.mockResolvedValue({ ...preview, cutoffDate });
  const response = await get();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ statementCutoffDate: cutoffDate, paymentDueDate: "2026-10-20", impactBudgetYear: 2026, impactBudgetMonth: 10, daysUntilDue: 34 });
  expect(request).toHaveBeenCalledWith("/cards/card-1/preview-statement?date=2026-09-16");
});

it.each([{}, null, { ...preview, cutoffDate: undefined }])("returns a service error for incomplete upstream data", async (data) => {
  request.mockResolvedValue(data);
  const response = await get();
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ message: "No pudimos calcular el ciclo bancario. Inténtalo de nuevo." });
});
