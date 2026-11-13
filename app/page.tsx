import { Suspense } from "react";
import { DbStatus } from "@/components/DbStatus";
import { KickerPool } from "@/components/KickerPool";
import { KickerTable } from "@/components/KickerTable";
import { parsePage } from "@/lib/kickers/pool";
import { getTopKickers } from "@/lib/kickers/fetch";
import { lastCompletedWeek } from "@/lib/week";

export const revalidate = 3600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const page = parsePage((await searchParams).page);
  const week = lastCompletedWeek(new Date());
  const [nfl, fbs] = await Promise.all([getTopKickers("nfl", week), getTopKickers("fbs", week)]);
  return (
    <main className="kickers">
      <h1>Oops All Kickers</h1>
      <p className="week-label">Week of {week.label}</p>
      <Suspense fallback={<p className="table-message">Loading kicker pool</p>}>
        <KickerPool page={page} />
      </Suspense>
      <KickerTable title="NFL kickers" result={nfl} />
      <KickerTable title="FBS kickers" result={fbs} />
      <Suspense
        fallback={
          <footer className="db-status">
            <p>Database: checking</p>
          </footer>
        }
      >
        <DbStatus />
      </Suspense>
    </main>
  );
}
