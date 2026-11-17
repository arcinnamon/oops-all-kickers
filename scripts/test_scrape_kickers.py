"""Run with: python3 -m unittest discover scripts"""

import unittest

from scrape_kickers import COLUMNS, parse_list, parse_stats


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


if __name__ == "__main__":
    unittest.main()
