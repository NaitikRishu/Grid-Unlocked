#!/usr/bin/env python3
import os
import pickle
import osmnx as ox

def main():
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    geo_dir = os.path.join(ml_dir, 'data', 'geo')
    os.makedirs(geo_dir, exist_ok=True)
    graph_path = os.path.join(geo_dir, 'bengaluru_graph.pkl')
    
    print("Downloading drive graph for Bengaluru, Karnataka, India (this might take 1-3 minutes)...")
    ox.settings.use_cache = True
    ox.settings.log_console = True
    G = ox.graph_from_place("Bengaluru, Karnataka, India", network_type="drive")
    
    print(f"Graph loaded successfully. Nodes: {len(G.nodes)}, Edges: {len(G.edges)}")
    with open(graph_path, 'wb') as f:
        pickle.dump(G, f)
    print(f"Graph saved successfully to {graph_path}")

if __name__ == '__main__':
    main()
