import Link from "next/link";
import { connection } from "next/server";
import { getKickerPool } from "@/lib/kickers/pool";

export async function KickerPool({ page }: { page: number }) {
  await connection();
  const result = await getKickerPool(page);
  if (result.status === "unavailable") {
    return (
      <section>
        <h2>Kicker pool</h2>
        <p className="table-message">Kicker list unavailable, try again later</p>
      </section>
    );
  }
  const { rows, page: current, totalPages, asOf } = result;
  return (
    <section>
      <h2>Kicker pool</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Kicker pool table">
        <table>
          <caption>{asOf ? `Roster as of ${asOf.slice(0, 10)}` : "All kickers"}</caption>
          <thead>
            <tr>
              <th scope="col">League</th>
              <th scope="col">Name</th>
              <th scope="col">Team</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.league + "-" + r.team + "-" + r.name}>
                <td>{r.league.toUpperCase()}</td>
                <td>{r.name}</td>
                <td>{r.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Kicker pool pages" className="pool-pages">
        {current > 1 && <Link href={`/?page=${current - 1}`}>Previous</Link>}
        <span>
          Page {current} of {totalPages}
        </span>
        {current < totalPages && <Link href={`/?page=${current + 1}`}>Next</Link>}
      </nav>
    </section>
  );
}
