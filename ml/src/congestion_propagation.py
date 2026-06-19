#!/usr/bin/env python3
"""congestion_propagation.py - Phase 5 Congestion Propagation

Precomputes the Dijkstra shortest path distances between all BBMP zone centroids
to speed up propagation queries. Also aggregates propagated scores across events.
"""
import os
import pickle
import math
from collections import defaultdict
import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx
import osmnx as ox
from shapely.geometry import Point

# Configure osmnx cache
ox.settings.use_cache = True
ox.settings.log_console = True

_cached_distances = None

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates the direct haversine distance in km between two coordinate points."""
    R = 6371.0  # Earth's radius in km
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_zone_centroid(zone_id, zones_gdf):
    """Returns the centroid (lat, lon) coordinates of the zone."""
    zone_id_str = str(zone_id).strip().rstrip('.0')
    match = zones_gdf[zones_gdf['KGISWardNo'].astype(str).str.strip().str.rstrip('.0') == zone_id_str]
    if match.empty:
        return None
    centroid = match.geometry.centroid.iloc[0]
    return (centroid.y, centroid.x) # lat, lon

def precompute_zone_distances(G, zones_gdf, cache_path):
    """Precomputes and caches distances between all zone pairs using Dijkstra's algorithm."""
    print("Precomputing all-pairs shortest paths using Single-Source Dijkstra...")
    zone_nodes = {}
    zone_coords = {}
    
    # Vectorized snap of all centroids to graph nodes
    centroids = zones_gdf.geometry.centroid
    lons = [c.x for c in centroids]
    lats = [c.y for c in centroids]
    nearest_node_ids = ox.nearest_nodes(G, X=lons, Y=lats)
    
    for idx, row in zones_gdf.iterrows():
        zone_id = str(row['KGISWardNo']).strip().rstrip('.0')
        zone_nodes[zone_id] = nearest_node_ids[idx]
        centroid = row.geometry.centroid
        zone_coords[zone_id] = (centroid.y, centroid.x)
        
    print(f"Snapped {len(zone_nodes)} zones to graph nodes.")
    
    # Step 2: Run Dijkstra from each zone node
    distances = {}
    total_zones = len(zone_nodes)
    
    for idx, (zone_id_1, node_1) in enumerate(zone_nodes.items(), 1):
        if idx % 50 == 0 or idx == total_zones:
            print(f" -> Processed {idx}/{total_zones} zones...")
            
        # Run Dijkstra from node_1 to find distance to all reachable nodes in the graph
        lengths = nx.single_source_dijkstra_path_length(G, node_1, weight="length")
        
        for zone_id_2, node_2 in zone_nodes.items():
            if node_2 in lengths:
                # Convert meters to km
                distances[(zone_id_1, zone_id_2)] = lengths[node_2] / 1000.0
            else:
                # Fallback: Haversine distance
                c1 = zone_coords[zone_id_1]
                c2 = zone_coords[zone_id_2]
                distances[(zone_id_1, zone_id_2)] = haversine_distance(c1[0], c1[1], c2[0], c2[1])
                
    # Save cache
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, 'wb') as f:
        pickle.dump(distances, f)
    print(f"Successfully cached {len(distances)} zone distance pairs to {cache_path}")
    return distances

def load_distances(cache_path):
    """Loads precomputed zone-to-zone distances from the cache file."""
    global _cached_distances
    if _cached_distances is not None:
        return _cached_distances
        
    if os.path.exists(cache_path):
        with open(cache_path, 'rb') as f:
            _cached_distances = pickle.load(f)
        return _cached_distances
    return None

def graph_distance_km(zone_id_1, zone_id_2, G, zones_gdf, cache_path):
    """Looks up graph distance in km, falling back to Haversine if not cached/found."""
    dists = load_distances(cache_path)
    z1 = str(zone_id_1).strip().rstrip('.0')
    z2 = str(zone_id_2).strip().rstrip('.0')
    
    if dists and (z1, z2) in dists:
        return dists[(z1, z2)]
        
    # Dynamic fallback
    c1 = get_zone_centroid(z1, zones_gdf)
    c2 = get_zone_centroid(z2, zones_gdf)
    if not c1 or not c2:
        return 0.0
    return haversine_distance(c1[0], c1[1], c2[0], c2[1])

def propagate_scores(epicentre_zone_id, base_score, G, zones_gdf, cache_path, lambda_decay=0.3):
    """Propagates a congestion score from an epicenter zone to all other zones."""
    scores = {}
    z1 = str(epicentre_zone_id).strip().rstrip('.0')
    base_score_float = float(base_score)
    
    for idx, row in zones_gdf.iterrows():
        zone_id = str(row['KGISWardNo']).strip().rstrip('.0')
        if zone_id == z1:
            scores[zone_id] = base_score_float
        else:
            d = graph_distance_km(z1, zone_id, G, zones_gdf, cache_path)
            score = base_score_float * math.exp(-lambda_decay * d)
            scores[zone_id] = score
    return scores

def aggregate_zone_scores(active_events_list, G, zones_gdf, cache_path, lambda_decay=0.3):
    """Aggregates propagated scores across concurrent events, capping the results at 100."""
    scores = defaultdict(float)
    
    for event in active_events_list:
        event_zone = str(event.get("zone_id", "")).strip().rstrip('.0')
        base_score = float(event.get("congestion_score", 0.0))
        if not event_zone or event_zone == "nan":
            continue
            
        propagated = propagate_scores(event_zone, base_score, G, zones_gdf, cache_path, lambda_decay)
        for zone_id, score in propagated.items():
            scores[zone_id] += score
            
    # Cap at 100
    capped = {zone_id: min(float(score), 100.0) for zone_id, score in scores.items()}
    
    # Ensure all zones are represented
    for idx, row in zones_gdf.iterrows():
        z_id = str(row['KGISWardNo']).strip().rstrip('.0')
        if z_id not in capped:
            capped[z_id] = 0.0
            
    return capped

def main():
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    
    # Define paths
    events_clean_path = os.path.join(ml_dir, "data", "processed", "events_clean.csv")
    graph_path = os.path.join(ml_dir, "data", "geo", "bengaluru_graph.pkl")
    zones_path = os.path.join(ml_dir, "data", "geo", "bengaluru_zones.geojson")
    cache_path = os.path.join(ml_dir, "data", "processed", "zone_distances.pkl")
    zone_scores_csv_path = os.path.join(ml_dir, "data", "processed", "zone_scores.csv")
    
    print("Loading data...")
    events_df = pd.read_csv(events_clean_path)
    zones_gdf = gpd.read_file(zones_path)
    with open(graph_path, "rb") as f:
        G = pickle.load(f)
        
    print(f"Loaded {len(events_df)} clean events.")
    print(f"Loaded {len(zones_gdf)} BBMP zones.")
    print(f"Loaded graph with {len(G.nodes)} nodes.")
    
    # Precompute distances if cache doesn't exist
    if not os.path.exists(cache_path):
        precompute_zone_distances(G, zones_gdf, cache_path)
    else:
        print("Using cached zone distances.")
        
    # Calculate congestion score for each event (same formula as feature engineering)
    # congestion_score = min(event_duration_minutes / 120 * 100, 100)
    events_df["congestion_score"] = np.clip(events_df["event_duration_minutes"] / 120 * 100, 0, 100).fillna(0)
    
    print("Generating zone_scores.csv by propagating each event's score...")
    zone_scores_rows = []
    
    total_events = len(events_df)
    for idx, (_, row) in enumerate(events_df.iterrows(), 1):
        if idx % 1000 == 0 or idx == total_events:
            print(f" -> Propagated {idx}/{total_events} events...")
            
        ev_id = row["id"]
        ev_zone = row["zone_id"]
        score = row["congestion_score"]
        
        # If zone_id is missing, skip score propagation (or match to 0.0 for all zones)
        if pd.isna(ev_zone) or str(ev_zone).strip() == "nan" or not str(ev_zone).strip():
            # Create 0.0 scores for all zones
            for _, z_row in zones_gdf.iterrows():
                z_id = str(z_row['KGISWardNo']).strip().rstrip('.0')
                zone_scores_rows.append({
                    "event_id": ev_id,
                    "zone_id": z_id,
                    "score": 0.0
                })
            continue
            
        # Treat as sole active event and run propagation
        event_dict = {"zone_id": ev_zone, "congestion_score": score}
        scores = aggregate_zone_scores([event_dict], G, zones_gdf, cache_path)
        
        for z_id, z_score in scores.items():
            zone_scores_rows.append({
                "event_id": ev_id,
                "zone_id": z_id,
                "score": z_score
            })
            
    print("Saving zone_scores.csv...")
    zone_scores_df = pd.DataFrame(zone_scores_rows)
    zone_scores_df.to_csv(zone_scores_csv_path, index=False)
    print(f"Successfully generated zone_scores.csv at {zone_scores_csv_path} with shape {zone_scores_df.shape}")
    print("Phase 5 Congestion Propagation Complete!")

if __name__ == "__main__":
    main()
