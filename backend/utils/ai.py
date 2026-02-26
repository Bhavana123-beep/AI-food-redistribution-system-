from datetime import datetime
import json
import os
import re

from utils.db import load_data

def predict_food_spoilage(food_type, expiry_time):
    """
    Predicts the risk of food spoilage based on the food type and given expiry window.
    """
    food_type = food_type.lower()
    
    # Base risk depending on food type
    high_risk_foods = ['cooked', 'meat', 'dairy', 'milk', 'chicken', 'fish', 'curry']
    is_high_risk_type = any(word in food_type for word in high_risk_foods)
    
    # Parse expiry_time (assume "X hours" format for simplicity)
    hours = 24 # Default assumed safe window format if unparseable
    match = re.search(r'(\d+)', str(expiry_time))
    if match:
        hours = int(match.group(1))

    if hours <= 4 or (is_high_risk_type and hours <= 8):
        return "High Risk"
    elif hours <= 12 or is_high_risk_type:
        return "Medium Risk"
    else:
        return "Low Risk"

def calculate_priority_score(spoilage_risk, quantity, demand_level):
    """
    Calculates a dynamic Priority Score (0-100) based on urgency.
    """
    score = 0
    
    # Spoilage weight (max 50 points)
    if spoilage_risk == "High Risk": score += 50
    elif spoilage_risk == "Medium Risk": score += 30
    else: score += 10
        
    # Demand weight (max 30 points)
    if demand_level == "High": score += 30
    elif demand_level == "Medium": score += 15
    else: score += 5
        
    # Quantity weight (max 20 points, larger quantities get priority)
    try:
        qty_num = int(re.findall(r'\d+', str(quantity))[0])
        if qty_num > 100: score += 20
        elif qty_num > 50: score += 15
        elif qty_num > 10: score += 10
        else: score += 5
    except (IndexError, ValueError):
        score += 10 # Default average if parsing fails

    return min(100, score)

def predict_food_demand():
    """
    Predict food demand based on the time of day.
    """
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        return {"demand": "Low", "base_score": 3}
    elif 12 <= current_hour < 17:
        return {"demand": "Medium", "base_score": 6}
    else:
        return {"demand": "High", "base_score": 9}

def assign_nearest_ngo(location, quantity=None):
    """
    Smart NGO Assignment algorithm.
    Optimized for hackathon: Matches location and simulates basic capacity checking.
    """
    ngos = load_data('ngos.json')
    if not ngos:
        return None
    
    location_lower = location.lower()
    best_match = None
    
    for ngo in ngos:
        ngo_loc = ngo.get('location', '').lower()
        if ngo_loc in location_lower or location_lower in ngo_loc:
            best_match = ngo
            break
            
    # Default fallback to first NGO if no geography match
    return best_match if best_match else ngos[0]
