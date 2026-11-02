import type { KickersResult } from "@/lib/kickers/types";

export function KickerTable({ title, result }: { title: string; result: KickersResult }) {
  const message =
    result.status === "unavailable"
      ? "Data unavailable right now. Try again in a few minutes."
      : result.status === "no-games"
        ? "No games found for this week."
        : result.rows.length === 0
          ? "No kicker made a field goal this week."
          : null;
  return (
    <section>
      <h2>{title}</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={title + " table"}>
        <table>
          <caption>Top 3 by field goals made</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Team</th>
              <th scope="col">FG made</th>
              <th scope="col">FG attempts</th>
              <th scope="col">Longest</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.name + "-" + r.team}>
                <td>{r.name}</td>
                <td>{r.team}</td>
                <td>{r.made}</td>
                <td>{r.attempts}</td>
                <td>{r.longest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="table-message">{message}</p>}
    </section>
  );
}
