import os
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
from ml.src.congestion_propagation import clean_zone_id

def main():
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    
    events_path = os.path.join(ml_dir, "data", "processed", "events_ml_ready.csv")
    zones_path = os.path.join(ml_dir, "data", "geo", "bengaluru_zones.geojson")
    
    print(f"Loading events from {events_path}...")
    df = pd.read_csv(events_path)
    
    print(f"Loading zones from {zones_path}...")
    zones_gdf = gpd.read_file(zones_path)
    
    print("Performing spatial join...")
    geometry = [Point(lon, lat) for lat, lon in zip(df["longitude"], df["latitude"])]
    gdf = gpd.GeoDataFrame(df.copy(), geometry=geometry, crs="EPSG:4326")
    
    joined = gpd.sjoin(gdf, zones_gdf, how="left", predicate="within")
    
    # Add zone_id column
    df["zone_id"] = joined["KGISWardNo"].apply(clean_zone_id)
    
    # Fill any null zone_id with empty string
    df["zone_id"] = df["zone_id"].fillna("")
    
    # Save back
    df.to_csv(events_path, index=False)
    print("Done! Added zone_id to events_ml_ready.csv")

if __name__ == '__main__':
    main()
