#!/usr/bin/env python3
"""resource_allocator.py - Phase 8 Resource Allocator

Allocates traffic management resources (police personnel and barricades)
greedily across BBMP zones based on their congestion scores.
"""
import math

def allocate_resources(zone_scores: dict, total_police: int, total_barricades: int) -> dict:
    """Allocates police officers and barricades proportionally to active zones.
    
    - Highly congested zones (score > 50) receive at least 1 police officer.
    - Remaining resources are allocated proportionally.
    - Rounding drift is corrected by giving the remainder to the highest-score zone.
    """
    # Initialize empty allocation for all zones in zone_scores
    allocation = {str(k): {"police": 0, "barricades": 0} for k in zone_scores.keys()}
    
    # Filter to active zones (score > 0)
    active_zones = {str(k): float(v) for k, v in zone_scores.items() if float(v) > 0.0}
    if not active_zones:
        return allocation
        
    # Sort zones by score descending
    sorted_zones = sorted(active_zones.items(), key=lambda x: x[1], reverse=True)
    top_zone_id = sorted_zones[0][0]
    total_active_score = sum(score for z_id, score in sorted_zones)
    
    # 1. Allocate Police Officers
    if total_police > 0:
        police_allocated = 0
        
        # Pass 1: Ensure minimum 1 police officer to any zone with score > 50
        for z_id, score in sorted_zones:
            if score > 50.0 and police_allocated < total_police:
                allocation[z_id]["police"] = 1
                police_allocated += 1
                
        # Pass 2: Distribute remaining police proportionally
        remaining_police = total_police - police_allocated
        if remaining_police > 0 and total_active_score > 0:
            proportional_sum = 0
            for z_id, score in sorted_zones:
                share = int(math.floor(remaining_police * score / total_active_score))
                allocation[z_id]["police"] += share
                proportional_sum += share
                
            # Correct rounding drift: add remainder to the highest score zone
            drift = remaining_police - proportional_sum
            if drift > 0:
                allocation[top_zone_id]["police"] += drift
                
    # 2. Allocate Barricades
    if total_barricades > 0 and total_active_score > 0:
        proportional_sum = 0
        for z_id, score in sorted_zones:
            share = int(math.floor(total_barricades * score / total_active_score))
            allocation[z_id]["barricades"] = share
            proportional_sum += share
            
        # Correct rounding drift: add remainder to the highest score zone
        drift = total_barricades - proportional_sum
        if drift > 0:
            allocation[top_zone_id]["barricades"] += drift
            
    return allocation

if __name__ == '__main__':
    # Test allocation logic
    test_scores = {"180": 80.0, "20": 45.0, "15": 10.0, "3": 0.0}
    res = allocate_resources(test_scores, total_police=5, total_barricades=10)
    print("Test Allocation Result:", res)
