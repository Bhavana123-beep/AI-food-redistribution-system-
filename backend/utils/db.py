import json
import os
import uuid
from datetime import datetime

"""
Database Utility Module
Handles all JSON File Operations (Simulating a NoSQL Document Store)
Optimized for zero-setup Hackathon execution
"""

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

def _ensure_dir():
    # Helper to create directory structure safely if it doesn't exist
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_data(filename):
    """
    Reads JSON data from the db.
    Returns: List of dictionary entries
    """
    _ensure_dir()
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            print(f"[Warning] JSON file {filename} is corrupt. Returning empty array.")
            return []

def save_data(filename, data):
    """
    Writes Python Dictionary directly to JSON format.
    """
    _ensure_dir()
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

def generate_id(prefix=""):
    """
    Generates cryptographically unique IDs for database entries.
    Prefix example: don- for donation, ngo- for NGOs
    """
    return f"{prefix}{uuid.uuid4().hex[:8]}"

def get_current_timestamp():
    """
    Standardized ISO8601 Timestamp format for frontend parsing compatibility.
    """
    return datetime.now().isoformat()
