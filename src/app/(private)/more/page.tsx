import { redirect } from "next/navigation";
import { periodHref, validPeriod } from "@/lib/format";
import { MORE_HOME } from "@/components/more-links";

export default async function MorePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const query = await searchParams;
  redirect(periodHref(MORE_HOME, validPeriod(query.period ?? null)));
}
