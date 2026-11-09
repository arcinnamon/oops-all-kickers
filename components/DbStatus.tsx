import { connection } from "next/server";
import { formatDbTime, getDbStatus } from "@/lib/db-status";

export async function DbStatus() {
  await connection();
  const result = await getDbStatus();
  return (
    <footer className="db-status">
      <p>
        {result.status === "ok"
          ? `Database: connected, time ${formatDbTime(result.time)}`
          : "Database: unreachable"}
      </p>
    </footer>
  );
}
