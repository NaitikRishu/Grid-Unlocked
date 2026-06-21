#!/usr/bin/env python3
import unittest
from ml.src.event_simulator import recommend_interventions

class TestRecommendation(unittest.TestCase):
    def test_recommendation_generation(self):
        req = {
            "event_type": "unplanned",
            "latitude": 13.0400041,
            "longitude": 77.5180991,
            "start_datetime": "2024-03-07T17:01:48.111000+00:00"
        }
        res = recommend_interventions(req)
        
        # Check keys are present
        self.assertIn("recommended_manpower", res)
        self.assertIn("recommended_barricades", res)
        self.assertIn("recommended_diversion_active", res)
        self.assertIn("recommended_offset_minutes", res)
        self.assertIn("explanation", res)
        self.assertIn("similar_events", res)
        
        # Check value constraints
        self.assertTrue(0 <= res["recommended_manpower"] <= 50)
        self.assertTrue(0 <= res["recommended_barricades"] <= 20)
        self.assertIsInstance(res["recommended_diversion_active"], bool)
        self.assertIn(res["recommended_offset_minutes"], [-60, -30, 0, 30, 60])
        self.assertIsInstance(res["explanation"], str)
        self.assertIsInstance(res["similar_events"], list)
        
        if res["similar_events"]:
            item = res["similar_events"][0]
            self.assertIn("id", item)
            self.assertIn("event_cause", item)
            self.assertIn("duration_minutes", item)

if __name__ == '__main__':
    unittest.main()
