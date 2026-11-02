export type League = "nfl" | "fbs";

/** One kicker's field goal line, from one game or summed over a week. */
export type GameKicking = {
  name: string;
  team: string;
  made: number;
  attempts: number;
  longest: number;
};

export type KickerRow = GameKicking;

export type ScoreboardGame = { id: string; kickoff: Date };

export type KickersResult = {
  status: "ok" | "no-games" | "unavailable";
  rows: KickerRow[];
};
