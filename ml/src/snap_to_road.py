#!/usr/bin/env python3
"""snap_to_road.py - Phase 2 Map Generation

Snaps raw event coordinates to the road network using MapmyIndia Snap to Road API,
with a fallback to standard OSMnx matching. Also performs a spatial join with BBMP zones
to assign each event to a ward zone ID.
"""
import os
import pickle
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import requests
import osmnx as ox
from dotenv import load_dotenv

# Configure osmnx cache
ox.settings.use_cache = True
ox.settings.log_console = True

def get_mappls_token(client_id, client_secret):
    """Generates an OAuth2 access token for Mappls/MapmyIndia."""
    if not client_id or not client_secret:
        print("Mappls credentials missing. Skipping token generation.")
        return None
        
    token_url = "https://outpost.mappls.com/api/security/oauth/token"
    token_data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    try:
        print("Attempting to generate Mappls OAuth2 token...")
        r = requests.post(token_url, data=token_data, timeout=10)
        if r.status_code == 200:
            token_json = r.json()
            access_token = token_json.get("access_token")
            print("Mappls token generated successfully.")
            return access_token
        else:
            print(f"Mappls token generation failed with status code {r.status_code}: {r.text}")
    except Exception as e:
        print(f"Exception during Mappls token generation: {e}")
        
    return None

def snap_coordinates_mappls(events_df, access_token):
    """Queries MapmyIndia Snap to Road API in batches of 100 to get high-accuracy coordinates.
    
    Returns a dict mapping event ID -> (snapped_lat, snapped_lon).
    """
    snapped = {}
    if not access_token:
        # Return empty dict so all fallback to original
        return snapped
        
    coords = []
    for _, row in events_df.iterrows():
        coords.append((row["id"], row["latitude"], row["longitude"]))
        
    batch_size = 100
    print(f"Starting Mappls snapToRoad for {len(coords)} coordinates in batches of {batch_size}...")
    
    for i in range(0, len(coords), batch_size):
        batch = coords[i:i+batch_size]
        # MapmyIndia expects longitude first: lon,lat;lon,lat...
        pts = ";".join(f"{lon},{lat}" for _, lat, lon in batch)
        
        # Standard GET endpoint
        snap_url = "https://route.mappls.com/route/movement/snapToRoad"
        try:
            r = requests.get(snap_url, params={"pts": pts, "access_token": access_token}, timeout=15)
            
            # Fallback to POST with "points" parameter if GET fails/unsupported
            if r.status_code != 200:
                print(f"GET snapToRoad failed ({r.status_code}). Trying POST fallback...")
                snap_url_post = f"https://route.mappls.com/route/movement/snapToRoad?access_token={access_token}"
                r = requests.post(snap_url_post, data={"points": pts}, timeout=15)
                
            if r.status_code == 200:
                res = r.json()
                snapped_points = res.get("snappedPoints", [])
                
                # Match snapped points back to original batch by waypoint_index
                for idx, (event_id, orig_lat, orig_lon) in enumerate(batch):
                    matched = False
                    for sp in snapped_points:
                        if sp and sp.get("waypoint_index") == idx:
                            loc = sp.get("location")
                            if loc:
                                if isinstance(loc, list) and len(loc) >= 2:
                                    snapped[event_id] = (float(loc[1]), float(loc[0])) # lat, lon
                                    matched = True
                                elif isinstance(loc, dict):
                                    lat_val = loc.get("latitude", loc.get("lat"))
                                    lon_val = loc.get("longitude", loc.get("lon"))
                                    if lat_val is not None and lon_val is not None:
                                        snapped[event_id] = (float(lat_val), float(lon_val))
                                        matched = True
                                elif isinstance(loc, str):
                                    parts = loc.split(",")
                                    if len(parts) == 2:
                                        snapped[event_id] = (float(parts[1]), float(parts[0]))
                                        matched = True
                            break
                    if not matched:
                        snapped[event_id] = (orig_lat, orig_lon)
            else:
                print(f"Mappls snapToRoad failed for batch {i//batch_size} (code {r.status_code}). Using fallback.")
                for event_id, orig_lat, orig_lon in batch:
                    snapped[event_id] = (orig_lat, orig_lon)
        except Exception as e:
            print(f"Exception in Mappls snapToRoad for batch {i//batch_size}: {e}. Using fallback.")
            for event_id, orig_lat, orig_lon in batch:
                snapped[event_id] = (orig_lat, orig_lon)
                
    return snapped

def main():
    # Load .env file
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    load_dotenv(os.path.join(ml_dir, ".env"))
    
    client_id = os.getenv("MAPMYINDIA_CLIENT_ID")
    client_secret = os.getenv("MAPMYINDIA_CLIENT_SECRET")
    
    # Define paths
    events_clean_path = os.path.join(ml_dir, "data", "processed", "events_clean.csv")
    graph_path = os.path.join(ml_dir, "data", "geo", "bengaluru_graph.pkl")
    zones_path = os.path.join(ml_dir, "data", "geo", "bengaluru_zones.geojson")
    node_mapping_path = os.path.join(ml_dir, "data", "processed", "node_mapping.csv")
    
    print("Step 1: Loading clean events and road graph...")
    if not os.path.exists(events_clean_path):
        raise FileNotFoundError(f"Clean events CSV not found at {events_clean_path}.")
    if not os.path.exists(graph_path):
        raise FileNotFoundError(f"Bengaluru road graph pickle not found at {graph_path}. Please run build_graph.py first.")
        
    events_df = pd.read_csv(events_clean_path)
    with open(graph_path, "rb") as f:
        G = pickle.load(f)
        
    print(f"Loaded {len(events_df)} clean events.")
    print(f"Loaded road graph with {len(G.nodes)} nodes.")
    
    # Step 2: Attempt MapmyIndia Snapping
    access_token = get_mappls_token(client_id, client_secret)
    snapped_coords = {}
    
    if access_token:
        try:
            snapped_coords = snap_coordinates_mappls(events_df, access_token)
        except Exception as e:
            print(f"Failed MapmyIndia snapping: {e}. Falling back entirely to original coords.")
            
    # For any coordinates not snapped (or if MapmyIndia failed/skipped), default to original coordinates
    final_coords = {}
    fallback_count = 0
    for _, row in events_df.iterrows():
        ev_id = row["id"]
        if ev_id in snapped_coords:
            final_coords[ev_id] = snapped_coords[ev_id]
        else:
            final_coords[ev_id] = (row["latitude"], row["longitude"])
            fallback_count += 1
            
    print(f"Snapping complete. Fallback to original coordinates: {fallback_count}/{len(events_df)}")
    
    # Step 3: Map snapped coordinates to OSM nodes
    print("Step 3: Finding nearest OSM nodes for each snapped coordinate...")
    node_mappings = []
    
    # Batch processing nodes using ox.nearest_nodes
    lats = [final_coords[row["id"]][0] for _, row in events_df.iterrows()]
    lons = [final_coords[row["id"]][1] for _, row in events_df.iterrows()]
    
    # ox.nearest_nodes takes arrays of X (longitude) and Y (latitude)
    nearest_node_ids = ox.nearest_nodes(G, X=lons, Y=lats)
    
    for idx, (_, row) in enumerate(events_df.iterrows()):
        ev_id = row["id"]
        node_id = nearest_node_ids[idx]
        node_data = G.nodes[node_id]
        node_mappings.append({
            "event_id": ev_id,
            "nearest_node_id": node_id,
            "node_lat": node_data["y"],
            "node_lon": node_data["x"]
        })
        
    node_mapping_df = pd.DataFrame(node_mappings)
    node_mapping_df.to_csv(node_mapping_path, index=False)
    print(f"Node mapping saved to {node_mapping_path}")
    
    # Step 4: Spatial join events to zones
    print("Step 4: Performing spatial join with BBMP zones GeoJSON...")
    if not os.path.exists(zones_path):
        raise FileNotFoundError(f"BBMP zones GeoJSON not found at {zones_path}. Please run build_graph.py first.")
        
    zones_gdf = gpd.read_file(zones_path)
    
    # Let's inspect the columns to determine the zone_id identifier column
    print(f"BBMP zones columns: {list(zones_gdf.columns)}")
    zone_id_col = "KGISWardNo" if "KGISWardNo" in zones_gdf.columns else zones_gdf.columns[0]
    print(f"Using '{zone_id_col}' as zone_id column.")
    
    # Create GeoDataFrame for events using snapped coords
    geometry = [Point(final_coords[row["id"]][1], final_coords[row["id"]][0]) for _, row in events_df.iterrows()]
    events_gdf = gpd.GeoDataFrame(events_df.copy(), geometry=geometry, crs="EPSG:4326")
    
    # Spatial join 'within' to map coordinates to zones
    joined = gpd.sjoin(events_gdf, zones_gdf, how="left", predicate="within")
    
    # Add zone_id column
    events_df["zone_id"] = joined[zone_id_col].astype(str)
    
    # Print out matching stats
    null_zones = events_df["zone_id"].isna().sum() + (events_df["zone_id"] == "nan").sum()
    print(f"Spatial join complete. Events with missing zone_id: {null_zones}/{len(events_df)}")
    
    # Re-export events_clean.csv with zone_id added
    events_df.to_csv(events_clean_path, index=False)
    print(f"Updated events_clean.csv saved to {events_clean_path}")
    print("Phase 2 Snapping & Zone Join Complete!")

if __name__ == "__main__":
    main()
