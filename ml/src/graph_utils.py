#!/usr/bin/env python3
"""graph_utils.py - Graph helper functions for loading, snapping, and path-to-geojson.

Phase 2 Map Generation task for Team A.
"""
import os
import pickle
import osmnx as ox
import geopandas as gpd
import networkx as nx
from shapely.geometry import Point

# Global variables for caching spatial index of edges
_edges_gdf_projected = None
_projected_crs = 'EPSG:32643'  # UTM Zone 43N for Bengaluru

def load_graph() -> nx.MultiDiGraph:
    """Loads the Bengaluru road graph from the pickle file."""
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    graph_path = os.path.join(ml_dir, 'data', 'geo', 'bengaluru_graph.pkl')
    
    if not os.path.exists(graph_path):
        raise FileNotFoundError(f"Graph file not found at {graph_path}. Please run build_graph.py first.")
        
    with open(graph_path, 'rb') as f:
        G = pickle.load(f)
    return G

def get_nearest_node(G, lat: float, lon: float) -> int:
    """Returns the nearest node ID to the given latitude and longitude."""
    # OSMnx nearest_nodes expects X=lon, Y=lat
    return ox.nearest_nodes(G, X=lon, Y=lat)

def get_edges_in_radius(G, lat: float, lon: float, radius_m: float) -> list:
    """Returns a list of (u, v, key) edge tuples within radius_m of the point."""
    global _edges_gdf_projected
    
    if _edges_gdf_projected is None:
        print("Initializing edges GeoDataFrame spatial index (this runs once)...")
        edges_gdf = ox.graph_to_gdfs(G, nodes=False, fill_edge_geometry=True)
        # Project to UTM zone 43N for accurate metric distance calculations
        _edges_gdf_projected = edges_gdf.to_crs(_projected_crs)
        
    # Create point in WGS84 and project to UTM 43N
    point_wgs84 = gpd.GeoSeries([Point(lon, lat)], crs='EPSG:4326')
    point_projected = point_wgs84.to_crs(_projected_crs).iloc[0]
    
    # Create metric buffer around projected point
    buffer = point_projected.buffer(radius_m)
    
    # Spatial index query (extremely fast)
    possible_matches_index = _edges_gdf_projected.sindex.query(buffer, predicate='intersects')
    possible_matches = _edges_gdf_projected.iloc[possible_matches_index]
    
    # Filter by exact distance to ensure precision
    precise_matches = possible_matches[possible_matches.geometry.distance(point_projected) <= radius_m]
    
    return list(precise_matches.index)

def path_to_geojson(G, node_path: list, label: str, delay_minutes: float) -> dict:
    """Converts a list of node IDs into a GeoJSON LineString Feature, tracing edge geometries."""
    if not node_path:
        return {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": []
            },
            "properties": {}
        }
        
    coordinates = []
    
    # Start with the first node coordinate
    node_data = G.nodes[node_path[0]]
    coordinates.append([node_data['x'], node_data['y']])
    
    for u, v in zip(node_path[:-1], node_path[1:]):
        edge_data = G.get_edge_data(u, v)
        if edge_data:
            # G is a MultiDiGraph, so get_edge_data returns a dict key -> attributes
            # Select the edge with the shortest length
            best_key = min(edge_data.keys(), key=lambda k: edge_data[k].get('length', float('inf')))
            edge_attr = edge_data[best_key]
            
            if 'geometry' in edge_attr:
                geom = edge_attr['geometry']
                coords = list(geom.coords)
                
                # Check directionality: ensure we trace from u to v
                u_data = G.nodes[u]
                first_dist = (coords[0][0] - u_data['x'])**2 + (coords[0][1] - u_data['y'])**2
                last_dist = (coords[-1][0] - u_data['x'])**2 + (coords[-1][1] - u_data['y'])**2
                
                # If the last coordinate of the geometry is closer to u, reverse the points order
                if first_dist > last_dist:
                    coords = coords[::-1]
                    
                # Append all coordinates except the first one (to prevent duplicates with u)
                for pt in coords[1:]:
                    coordinates.append([pt[0], pt[1]])
            else:
                node_v = G.nodes[v]
                coordinates.append([node_v['x'], node_v['y']])
        else:
            node_v = G.nodes[v]
            coordinates.append([node_v['x'], node_v['y']])
        
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        },
        "properties": {
            "route_label": label,
            "estimated_delay_minutes": delay_minutes
        }
    }
