import { KickerTable } from "@/components/KickerTable";
import { getTopKickers } from "@/lib/kickers/fetch";
import { lastCompletedWeek } from "@/lib/week";

export const revalidate = 3600;

export default async function Home() {
  const week = lastCompletedWeek(new Date());
  const [nfl, fbs] = await Promise.all([getTopKickers("nfl", week), getTopKickers("fbs", week)]);
  return (
    <main className="kickers">
      <h1>Oops All Kickers</h1>
      <p className="week-label">Week of {week.label}</p>
      <KickerTable title="NFL kickers" result={nfl} />
      <KickerTable title="FBS kickers" result={fbs} />
    </main>
  );
}
