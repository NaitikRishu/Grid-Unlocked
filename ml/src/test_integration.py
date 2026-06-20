#!/usr/bin/env python3
import unittest
from ml.src import event_simulator
from ml.src import resource_allocator

class TestIntegration(unittest.TestCase):
    def test_resource_allocation(self):
        scores = {"180": 80.0, "20": 45.0, "15": 10.0}
        alloc = resource_allocator.allocate_resources(scores, total_police=5, total_barricades=10)
        self.assertEqual(alloc["180"]["police"], 4) # 1 min + proportional
        self.assertEqual(alloc["20"]["police"], 1)
        self.assertEqual(alloc["15"]["police"], 0)
        
    def test_run_simulation(self):
        req = {
            "event_type": "unplanned",
            "latitude": 13.0400041,
            "longitude": 77.5180991,
            "start_datetime": "2024-03-07T17:01:48.111000+00:00"
        }
        params = {
            "manpower": 10,
            "barricades": 5,
            "diversion_active": True,
            "start_time_offset_minutes": 30
        }
        res = event_simulator.run_simulation(req, params)
        self.assertIn("zone_scores", res)
        self.assertIn("predicted_duration_minutes", res)
        self.assertIn("delay_saved_minutes", res)
        self.assertIn("alternate_routes", res)
        self.assertIn("resource_allocation", res)

if __name__ == '__main__':
    unittest.main()
