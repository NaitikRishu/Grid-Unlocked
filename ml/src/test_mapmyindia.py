#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

def test_api():
    # Load .env file
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    env_path = os.path.join(ml_dir, '.env')
    
    print(f"Loading .env from: {env_path}")
    load_dotenv(env_path)
    
    client_id = os.getenv("MAPMYINDIA_CLIENT_ID")
    client_secret = os.getenv("MAPMYINDIA_CLIENT_SECRET")
    rest_key = os.getenv("MAPMYINDIA_REST_API_KEY")
    
    print(f"Loaded credentials:")
    print(f"  Client ID: {client_id[:5]}...{client_id[-5:] if client_id else ''}")
    print(f"  Client Secret: {client_secret[:5]}...{client_secret[-5:] if client_secret else ''}")
    print(f"  REST API Key: {rest_key[:5]}...{rest_key[-5:] if rest_key else ''}")
    
    if not client_id or not client_secret or not rest_key:
        print("Error: Missing credentials in .env file.")
        return

    # 1. Test OAuth2 Token Generation
    print("\n--- Test 1: OAuth2 Token Generation ---")
    token_url = "https://outpost.mappls.com/api/security/oauth/token"
    token_data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    try:
        r = requests.post(token_url, data=token_data, timeout=10)
        print(f"Response Code: {r.status_code}")
        if r.status_code == 200:
            token_json = r.json()
            access_token = token_json.get("access_token")
            token_type = token_json.get("token_type")
            expires_in = token_json.get("expires_in")
            print("Token generation successful!")
            print(f"  Access Token: {access_token[:10]}...{access_token[-10:]}")
            print(f"  Token Type: {token_type}")
            print(f"  Expires In: {expires_in} seconds")
        else:
            print("Token generation failed:")
            print(r.text)
            return
    except Exception as e:
        print(f"Exception during token generation: {e}")
        return

    # 2. Test Snap to Road API
    print("\n--- Test 2: Snap to Road API ---")
    # Coordinates in Bengaluru (near Chinnaswamy Stadium)
    # longitude,latitude;longitude,latitude...
    points = "77.598,12.978;77.599,12.979"
    snap_url = f"https://route.mappls.com/route/movement/snapToRoad?access_token={access_token}"
    snap_data = {
        "points": points
    }
    
    try:
        r = requests.post(snap_url, data=snap_data, timeout=10)
        print(f"Response Code: {r.status_code}")
        if r.status_code == 200:
            snap_json = r.json()
            print("Snap to Road successful!")
            print(snap_json)
        else:
            print("Snap to Road failed:")
            print(r.text)
    except Exception as e:
        print(f"Exception during Snap to Road: {e}")

if __name__ == "__main__":
    test_api()
