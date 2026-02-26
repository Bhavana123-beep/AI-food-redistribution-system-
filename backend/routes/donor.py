from flask import Blueprint, request, jsonify
from utils.db import load_data, save_data, generate_id, get_current_timestamp
from utils.ai import predict_food_demand, assign_nearest_ngo, predict_food_spoilage, calculate_priority_score

donor_bp = Blueprint('donor', __name__)

@donor_bp.route('/donate', methods=['POST'])
def donate_food():
    """
    Core API for collecting donations with Advanced AI metrics enabled.
    """
    data = request.json
    
    required_fields = ['donor_name', 'food_type', 'quantity', 'location', 'phone_number']
    if not all(field in data for field in required_fields):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
    donations = load_data('donations.json')
    
    # 1. AI Logic Integration
    expiry_time = data.get('expiry_time', '24 hours') # Default if none provided
    spoilage_risk = predict_food_spoilage(data['food_type'], expiry_time)
    demand_pred = predict_food_demand()
    
    # Calculate holistic Priority Delivery Score (0-100)
    score = calculate_priority_score(spoilage_risk, data['quantity'], demand_pred['demand'])
    
    # Smart Matching Algorithm runs based on location text
    assigned_ngo = assign_nearest_ngo(data['location'], data['quantity'])
    
    # 2. Package Donation Object
    donation = {
        "id": generate_id("don-"),
        "donor_name": data['donor_name'],
        "food_type": data['food_type'],
        "quantity": data['quantity'],
        "location": data['location'],
        "expiry_time": expiry_time,
        "phone_number": data['phone_number'],
        "timestamp": get_current_timestamp(),
        "status": "pending",
        
        # New AI Properties mapped
        "ai_metrics": {
            "spoilage_risk": spoilage_risk,
            "demand_prediction": demand_pred['demand'],
            "priority_score": score
        },
        "assigned_ngo": assigned_ngo['id'] if assigned_ngo else None
    }
    
    # 3. Store Database
    donations.append(donation)
    save_data('donations.json', donations)
    
    # Return professional structured response for the hackathon
    return jsonify({
        "status": "success",
        "message": "Donation successfully submitted and ranked via AI engine",
        "data": {
            "donation_id": donation['id'],
            "assigned_ngo": assigned_ngo,
            "ai_insights": donation['ai_metrics']
        }
    }), 201
