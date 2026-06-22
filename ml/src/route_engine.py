#!/usr/bin/env python3
"""route_engine.py - Phase 6 Route Engine

Computes alternate routes for traffic events by identifying and avoiding
blocked road segments around the event epicenter.
"""
import os
import pickle
import math
import pandas as pd
import networkx as nx
import osmnx as ox

from ml.src.graph_utils import load_graph, get_edges_in_radius, path_to_geojson

# Cache file path
src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(src_dir)
CACHE_PATH = os.path.join(ml_dir, 'data', 'processed', 'route_cache.pkl')
EVENTS_PATH = os.path.join(ml_dir, 'data', 'processed', 'events_ml_ready.csv')
MAPPING_PATH = os.path.join(ml_dir, 'data', 'processed', 'node_mapping.csv')

_route_cache = None

def get_blocked_edges(G, event_lat: float, event_lon: float, radius_m: float = 500) -> list:
    """Finds all road edges in G within radius_m of the event coordinates."""
    # Returns list of (u, v, key) tuples
    try:
        edges = get_edges_in_radius(G, event_lat, event_lon, radius_m)
        return edges
    except Exception as e:
        print(f"Error getting edges in radius: {e}")
        return []

def find_downstream_node(G, origin_node: int, target_distance_m: float = 2000) -> int:
    """Finds a reachable downstream node approximately target_distance_m away from origin_node using BFS."""
    queue = [(origin_node, 0.0)]
    visited = {origin_node}
    best_node = origin_node
    best_dist = 0.0
    
    while queue:
        node, dist = queue.pop(0)
        
        if dist >= target_distance_m:
            return node
            
        if dist > best_dist:
            best_dist = dist
            best_node = node
            
        # successors returns neighbors with outgoing directed edges
        for neighbor in G.successors(node):
            if neighbor not in visited:
                visited.add(neighbor)
                
                # Get edge length
                edge_data = G.get_edge_data(node, neighbor)
                length = 30.0  # default fallback edge length in meters
                if edge_data:
                    # G is a MultiDiGraph, edge_data is a dict key -> attributes
                    first_key = list(edge_data.keys())[0]
                    length = edge_data[first_key].get('length', 30.0)
                    
                queue.append((neighbor, dist + length))
                
        # Safety cutoff to prevent long loops in large graphs
        if len(visited) > 1000:
            break
            
    return best_node

def compute_alternate_routes(G, origin_node: int, dest_node: int, blocked_edges: list, num_routes: int = 3) -> list:
    """Computes up to num_routes paths from origin_node to dest_node avoiding blocked_edges."""
    if origin_node == dest_node:
        return [[origin_node]]
        
    G_copy = G.copy()
    
    # Penalize blocked edges in the routing graph instead of removing them.
    # This prevents NetworkXNoPath when the origin is inside the blocked area,
    # forcing the path to exit the blocked zone as quickly as possible and detour around it.
    for u, v, k in blocked_edges:
        if G_copy.has_edge(u, v, k):
            G_copy[u][v][k]['length'] = G_copy[u][v][k].get('length', 30.0) * 1000.0
            
    routes = []
    for i in range(num_routes):
        try:
            # nx.shortest_path returns list of node IDs
            path = nx.shortest_path(G_copy, source=origin_node, target=dest_node, weight="length")
            routes.append(path)
            
            # Penalize edges along this path so subsequent iterations find distinct routes
            for u, v in zip(path[:-1], path[1:]):
                edge_data = G_copy.get_edge_data(u, v)
                if edge_data:
                    for key in edge_data:
                        if 'length' in G_copy[u][v][key]:
                            G_copy[u][v][key]['length'] *= 3.0
        except nx.NetworkXNoPath:
            break
            
    # Fallback: if blocked edges completely disconnected origin and destination,
    # compute the single shortest path on the original graph G
    if not routes:
        try:
            path = nx.shortest_path(G, source=origin_node, target=dest_node, weight="length")
            routes.append(path)
        except nx.NetworkXNoPath:
            pass
            
    return routes

def estimate_delay(congestion_score: float) -> float:
    """Estimates travel delay in minutes based on the congestion score."""
    base_delay = 10.0
    return round(base_delay * (1.0 + float(congestion_score) / 50.0), 1)

def edges_to_geojson(G, edges_list: list, label: str) -> list:
    """Converts a list of edge tuples (u, v, k) into a list of GeoJSON Features representing blocked segments."""
    features = []
    for u, v, k in edges_list:
        edge_data = G.get_edge_data(u, v, k)
        if edge_data and 'geometry' in edge_data:
            geom = edge_data['geometry']
            coords = list(geom.coords)
        else:
            node_u = G.nodes[u]
            node_v = G.nodes[v]
            coords = [[node_u['x'], node_u['y']], [node_v['x'], node_v['y']]]
            
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": {
                "route_label": label,
                "is_blocked": True
            }
        })
    return features

def routes_to_geojson(G, routes_list: list, congestion_score: float, blocked_edges: list = None, delay_multiplier: float = 1.0) -> dict:
    """Converts alternate routes to a standard GeoJSON FeatureCollection."""
    labels = ["Fastest alternate", "Second alternate", "Third alternate"]
    features = []
    
    delay = estimate_delay(congestion_score) * delay_multiplier
    for i, path in enumerate(routes_list):
        label = labels[i] if i < len(labels) else f"Alternate {i+1}"
        try:
            feat = path_to_geojson(G, path, label, delay)
            features.append(feat)
        except Exception as e:
            print(f"Error converting route to geojson: {e}")
            
    if blocked_edges:
        try:
            blocked_features = edges_to_geojson(G, blocked_edges, "Congested Corridor")
            features.extend(blocked_features)
        except Exception as e:
            print(f"Error converting blocked edges to geojson: {e}")
            
    return {
        "type": "FeatureCollection",
        "features": features
    }

def load_route_cache() -> dict:
    """Loads the precomputed route cache dictionary."""
    global _route_cache
    if _route_cache is not None:
        return _route_cache
        
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, 'rb') as f:
                _route_cache = pickle.load(f)
            return _route_cache
        except Exception as e:
            print(f"Error loading route cache: {e}")
            
    _route_cache = {}
    return _route_cache

def save_route_cache(cache: dict):
    """Saves the route cache dictionary to disk."""
    global _route_cache
    _route_cache = cache
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    with open(CACHE_PATH, 'wb') as f:
        pickle.dump(cache, f)

def get_route_for_event(G, event_id: str, events_df=None, mapping_df=None) -> dict:
    """Gets routes for an event, loading from cache or computing live and updating cache."""
    cache = load_route_cache()
    if event_id in cache:
        geojson = cache[event_id]
        # Overlay the blocked edges dynamically if not already in features
        has_blocked = any(f.get("properties", {}).get("is_blocked") for f in geojson.get("features", []))
        if not has_blocked:
            if events_df is None:
                events_df = pd.read_csv(EVENTS_PATH)
            event_row = events_df[events_df['id'] == event_id]
            if not event_row.empty:
                event = event_row.iloc[0]
                lat = float(event['latitude'])
                lon = float(event['longitude'])
                blocked = get_blocked_edges(G, lat, lon, radius_m=500)
                blocked_features = edges_to_geojson(G, blocked, "Congested Corridor")
                import copy
                geojson = copy.deepcopy(geojson)
                geojson["features"].extend(blocked_features)
        return geojson
        
    # Live computation fallback
    if events_df is None:
        events_df = pd.read_csv(EVENTS_PATH)
    if mapping_df is None:
        mapping_df = pd.read_csv(MAPPING_PATH)
        
    event_row = events_df[events_df['id'] == event_id]
    
    if event_row.empty:
        # Default empty FeatureCollection
        return {"type": "FeatureCollection", "features": []}
        
    event = event_row.iloc[0]
    lat = float(event['latitude'])
    lon = float(event['longitude'])
    
    mapping_row = mapping_df[mapping_df['event_id'] == event_id]
    if not mapping_row.empty:
        mapping = mapping_row.iloc[0]
        origin_node = int(mapping['nearest_node_id'])
    else:
        from ml.src.graph_utils import get_nearest_node
        origin_node = get_nearest_node(G, lat, lon)
    
    # Calculate congestion score
    duration = float(event['event_duration_minutes']) if pd.notna(event['event_duration_minutes']) else 30.0
    congestion_score = min(max(duration / 120.0 * 100.0, 0.0), 100.0)
    
    # Compute downstream destination and alternate routes
    dest_node = find_downstream_node(G, origin_node, target_distance_m=2000)
    blocked = get_blocked_edges(G, lat, lon, radius_m=500)
    routes = compute_alternate_routes(G, origin_node, dest_node, blocked)
    geojson = routes_to_geojson(G, routes, congestion_score, blocked)
    
    # Save to cache
    cache[event_id] = geojson
    save_route_cache(cache)
    
    return geojson

def main():
    print("Loading graph...")
    G = load_graph()
    
    print("Loading events and node mappings...")
    events_df = pd.read_csv(EVENTS_PATH)
    mapping_df = pd.read_csv(MAPPING_PATH)
    
    # Precalculate score column
    events_df["congestion_score"] = (events_df["event_duration_minutes"] / 120.0 * 100.0).clip(0, 100).fillna(30.0)
    
    # Determine cache status
    cache = load_route_cache()
    print(f"Loaded existing cache with {len(cache)} entries.")
    
    # Select first 200 events to pre-compute
    precompute_events = events_df.head(200)
    count_computed = 0
    
    print("Pre-computing alternate routes for the first 200 events...")
    for idx, row in precompute_events.iterrows():
        ev_id = row['id']
        if ev_id in cache:
            continue
            
        mapping_row = mapping_df[mapping_df['event_id'] == ev_id]
        if mapping_row.empty:
            continue
            
        origin_node = int(mapping_row.iloc[0]['nearest_node_id'])
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        score = float(row['congestion_score'])
        
        dest_node = find_downstream_node(G, origin_node, target_distance_m=2000)
        blocked = get_blocked_edges(G, lat, lon, radius_m=500)
        routes = compute_alternate_routes(G, origin_node, dest_node, blocked)
        geojson = routes_to_geojson(G, routes, score)
        
        cache[ev_id] = geojson
        count_computed += 1
        
        if count_computed % 20 == 0:
            print(f" -> Computed {count_computed} routes...")
            
    if count_computed > 0:
        save_route_cache(cache)
        print(f"Successfully computed {count_computed} new routes and saved route_cache.pkl.")
    else:
        print("All target pre-computation events were already cached.")
        
    print("Phase 6 Route Engine Initialization Complete!")

if __name__ == '__main__':
    main()
