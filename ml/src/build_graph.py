#!/usr/bin/env python3
"""build_graph.py - Download OSM graph and BBMP zones for Bengaluru.

Phase 2 Map Generation task for Team A.
"""
import os
import pickle
import requests
import osmnx as ox

# Configure osmnx cache
ox.settings.use_cache = True
ox.settings.log_console = True

def main():
    # Define paths relative to the script location
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    geo_dir = os.path.join(ml_dir, 'data', 'geo')
    
    os.makedirs(geo_dir, exist_ok=True)
    
    graph_path = os.path.join(geo_dir, 'bengaluru_graph.pkl')
    roads_path = os.path.join(geo_dir, 'bengaluru_roads.geojson')
    zones_path = os.path.join(geo_dir, 'bengaluru_zones.geojson')

    print("Step 1: Downloading road graph for Bengaluru from OSM...")
    # Download the drive road network for Bengaluru
    G = ox.graph_from_place("Bengaluru, Karnataka, India", network_type="drive")
    num_nodes = len(G.nodes)
    num_edges = len(G.edges)
    print(f"Graph loaded successfully. Nodes: {num_nodes}, Edges: {num_edges}")

    print("Step 2: Saving graph to pickle...")
    with open(graph_path, 'wb') as f:
        pickle.dump(G, f)
    print(f"Graph saved to {graph_path}")

    print("Step 3: Exporting road edges as GeoJSON...")
    edges = ox.graph_to_gdfs(G, nodes=False)
    # Convert list columns to strings to avoid GeoJSON export issues
    for col in edges.columns:
        if isinstance(edges[col].iloc[0], list):
            edges[col] = edges[col].astype(str)
    edges.to_file(roads_path, driver="GeoJSON")
    print(f"Road edges saved to {roads_path}")

    print("Step 4: Downloading BBMP ward zones GeoJSON...")
    zones_url = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/bangalore/BBMP_Wards.geojson"
    try:
        r = requests.get(zones_url, timeout=30)
        r.raise_for_status()
        
        # Verify it is valid JSON before writing
        zones_data = r.json()
        num_zones = len(zones_data.get('features', []))
        
        with open(zones_path, 'w', encoding='utf-8') as f:
            f.write(r.text)
        print(f"BBMP zones saved to {zones_path} (Loaded {num_zones} zones)")
    except Exception as e:
        print(f"Error downloading BBMP zones: {e}")
        # If GitHub fails, we'll try an alternative source or output a helpful error
        raise

    print("\nPhase 2 Graph & GeoJSON Generation Complete!")
    print(f"Nodes loaded: {num_nodes}")
    print(f"Edges loaded: {num_edges}")
    print(f"Zones loaded: {num_zones}")

if __name__ == '__main__':
    main()
