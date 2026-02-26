import re
from flask import Blueprint, jsonify
from utils.db import load_data

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/all-donations', methods=['GET'])
def get_all_donations():
    """Fetches all raw donations for admin oversight."""
    donations = load_data('donations.json')
    return jsonify({
        "status": "success",
        "message": "All donations retrieved",
        "data": donations
    }), 200

@admin_bp.route('/ngos', methods=['GET'])
def get_all_ngos():
    """Fetches all registered NGOs."""
    ngos = load_data('ngos.json')
    return jsonify({
        "status": "success",
        "message": "All NGOs retrieved",
        "data": ngos
    }), 200

@admin_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """
    Advanced Analytics Dashboard.
    Provides detailed impact metrics necessary for hackathon scoring criteria:
    - total food donated
    - meals served (estimated via regex parse)
    - active ngos
    - spoilage prevented by AI
    """
    donations = load_data('donations.json')
    deliveries = load_data('deliveries.json')
    ngos = load_data('ngos.json')
    
    total_donations = len(donations)
    total_delivered = len(deliveries)
    
    # Calculate estimated Total Meals Served 
    # (Extracts numbers from strings like "50 plates", "20 kg")
    total_meals_served = 0
    for d in deliveries:
        qty_str = str(d.get('quantity', '0'))
        numbers = re.findall(r'\d+', qty_str)
        if numbers:
            total_meals_served += int(numbers[0])
            
    # Calculate High Risk Spoilage Prevented (Proof of AI Impact)
    spoilage_prevented = sum(
        1 for d in deliveries 
        if d.get('ai_metrics', {}).get('spoilage_risk') == "High Risk"
    )
    
    # Today's Impact
    from datetime import datetime
    today = datetime.now().date()
    
    food_saved_today = 0
    for d in deliveries:
        try:
            ts = d.get('timestamp')
            if ts and datetime.fromisoformat(ts).date() == today:
                food_saved_today += 1
        except ValueError:
            pass
    
    return jsonify({
        "status": "success",
        "message": "AI-Powered Analytics initialized successfully",
        "data": {
            "platform_impact": {
                "total_donations_processed": total_donations,
                "total_successful_deliveries": total_delivered,
                "estimated_meals_served": total_meals_served,
                "active_ngos_network": len(ngos),
            },
            "ai_insights": {
                "high_risk_spoilage_prevented": spoilage_prevented,
                "food_batches_saved_today": food_saved_today,
                "system_efficiency": f"{round((total_delivered / total_donations) * 100) if total_donations > 0 else 0}%"
            }
        }
    }), 200
