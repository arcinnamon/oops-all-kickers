"""Run with: python3 -m unittest discover scripts"""

import io
import os
import unittest
import urllib.error
from unittest import mock

from scrape_kickers import COLUMNS, parse_list, parse_stats, upsert


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
