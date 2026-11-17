"""Run with: python3 -m unittest discover scripts"""

import io
import os
import unittest
import urllib.error
from unittest import mock

import scrape_kickers
from scrape_kickers import COLUMNS, main, parse_list, parse_stats, scrape, upsert


def athlete(espn_id, attempts=None):
    return {
        "athlete": {"id": espn_id, "displayName": "K" + espn_id, "teamShortName": "T"},
        "categories": [{"name": "kicking", "values": [1.0, attempts]}],
    }


def list_page(athletes, pages=1):
    return {
        "requestedSeason": {"year": 2026},
        "pagination": {"pages": pages},
        "categories": [{"name": "kicking", "names": ["fieldGoalsMade", "fieldGoalAttempts"]}],
        "athletes": athletes,
    }


def stats_payload():
    by_category = {}
    for category, name in COLUMNS.values():
        by_category.setdefault(category, []).append({"name": name, "value": 1.0})
    return {"splits": {"categories": [{"name": c, "stats": s} for c, s in by_category.items()]}}


def fake_espn(lists, broken_ids=(), broken_pages=()):
    """get_json stand-in: lists maps page number to a list payload."""
    calls = []

    def get_json(url):
        calls.append(url)
        if "/athletes/" in url:
            if any(f"/athletes/{i}/" in url for i in broken_ids):
                raise OSError("HTTP Error 503")
            return stats_payload()
        page = int(url.split("page=")[1].split("&")[0])
        if page in broken_pages:
            raise OSError("HTTP Error 503")
        return lists[page]

    return get_json, calls


class ParseTest(unittest.TestCase):
    def test_parse_list_reads_id_name_and_team(self):
        page = {
            "athletes": [
                {"athlete": {"id": "3124679", "displayName": "Jason Sanders", "teamShortName": "NYJ"}}
            ]
        }
        self.assertEqual(
            parse_list(page), [{"espn_id": "3124679", "name": "Jason Sanders", "team": "NYJ"}]
        )

    def test_parse_stats_maps_espn_names_to_columns(self):
        by_category = {}
        for i, (category, name) in enumerate(COLUMNS.values()):
            by_category.setdefault(category, []).append({"name": name, "value": float(i)})
        by_category["kicking"].append({"name": "fieldGoalPct", "value": 90.6})
        stats = {
            "splits": {
                "categories": [{"name": c, "stats": s} for c, s in by_category.items()]
            }
        }
        self.assertEqual(parse_stats(stats), {col: i for i, col in enumerate(COLUMNS)})


    def test_parse_list_attempted_only_drops_zero_and_blank_attempts(self):
        page = list_page([athlete("1", 3.0), athlete("2", 0.0), athlete("3", None)])
        self.assertEqual([k["espn_id"] for k in parse_list(page, attempted_only=True)], ["1"])


@mock.patch("time.sleep")
class ScrapeTest(unittest.TestCase):
    def test_nfl_stops_paging_at_first_zero_attempt_row(self, _sleep):
        get_json, calls = fake_espn(
            {1: list_page([athlete("1", 5.0), athlete("2", 0.0)], pages=40)}
        )
        failures = []
        with mock.patch.object(scrape_kickers, "get_json", get_json):
            rows = scrape("nfl", failures)
        self.assertEqual([r["espn_id"] for r in rows], ["1"])
        self.assertFalse(any("page=2" in u for u in calls))
        self.assertIn("isqualified=false", calls[0])
        self.assertEqual(failures, [])

    def test_fbs_uses_qualified_list(self, _sleep):
        get_json, calls = fake_espn({1: list_page([athlete("1")])})
        with mock.patch.object(scrape_kickers, "get_json", get_json):
            rows = scrape("fbs", [])
        self.assertEqual(len(rows), 1)
        self.assertIn("isqualified=true", calls[0])

    def test_failed_kicker_is_skipped_and_recorded(self, _sleep):
        get_json, _ = fake_espn(
            {1: list_page([athlete("1", 5.0), athlete("2", 4.0)])}, broken_ids=["1"]
        )
        failures = []
        with mock.patch.object(scrape_kickers, "get_json", get_json):
            rows = scrape("nfl", failures)
        self.assertEqual([r["espn_id"] for r in rows], ["2"])
        self.assertEqual(len(failures), 1)
        self.assertIn("(1)", failures[0])

    def test_failed_list_page_keeps_earlier_pages(self, _sleep):
        get_json, _ = fake_espn({1: list_page([athlete("1")], pages=3)}, broken_pages=[2])
        failures = []
        with mock.patch.object(scrape_kickers, "get_json", get_json):
            rows = scrape("fbs", failures)
        self.assertEqual([r["espn_id"] for r in rows], ["1"])
        self.assertEqual(failures, ["fbs list page 2: HTTP Error 503"])


class MainTest(unittest.TestCase):
    def test_partial_failure_upserts_rest_then_exits_nonzero(self):
        def fake_scrape(league, failures):
            if league == "fbs":
                failures.append("fbs list page 1: HTTP Error 503")
                return []
            return [{"league": "nfl"}]

        env = {"SUPABASE_URL": "https://x.supabase.co", "SUPABASE_SECRET_KEY": "k"}
        with mock.patch.dict(os.environ, env), mock.patch("sys.argv", ["x"]), mock.patch.object(
            scrape_kickers, "scrape", fake_scrape
        ), mock.patch.object(scrape_kickers, "upsert") as up:
            with self.assertRaises(SystemExit) as cm:
                main()
        up.assert_called_once_with([{"league": "nfl"}])
        self.assertIn("fbs list page 1", str(cm.exception.code))


class UpsertTest(unittest.TestCase):
    def test_upsert_error_reports_response_body(self):
        body = b'{"code":"PGRST204","message":"Could not find the \'season\' column"}'
        error = urllib.error.HTTPError("u", 400, "Bad Request", {}, io.BytesIO(body))
        env = {"SUPABASE_URL": "https://x.supabase.co", "SUPABASE_SECRET_KEY": "k"}
        with mock.patch.dict(os.environ, env), mock.patch(
            "urllib.request.urlopen", side_effect=error
        ):
            with self.assertRaises(SystemExit) as cm:
                upsert([{"league": "nfl"}])
        self.assertIn("400", str(cm.exception.code))
        self.assertIn("PGRST204", str(cm.exception.code))


if __name__ == "__main__":
    unittest.main()
