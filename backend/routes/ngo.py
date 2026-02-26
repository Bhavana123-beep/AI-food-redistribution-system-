from flask import Blueprint, request, jsonify
from utils.db import load_data, save_data

ngo_bp = Blueprint('ngo', __name__)

@ngo_bp.route('/donations', methods=['GET'])
def get_donations():
    ngo_id = request.args.get('ngo_id')
    donations = load_data('donations.json')
    
    if ngo_id:
        # Filter by assigned NGO
        donations = [d for d in donations if d.get('assigned_ngo') == ngo_id]
        
    return jsonify({
        "status": "success",
        "message": "Donations retrieved",
        "data": donations
    }), 200

@ngo_bp.route('/update-status', methods=['POST'])
def update_status():
    data = request.json
    donation_id = data.get('donation_id')
    new_status = data.get('status') # accepted, picked, delivered
    
    if not donation_id or not new_status:
        return jsonify({"status": "error", "message": "Missing donation_id or status"}), 400
        
    donations = load_data('donations.json')
    updated = False
    
    for donation in donations:
        if donation['id'] == donation_id:
            donation['status'] = new_status
            updated = True
            
            # If delivered, save to history
            if new_status == 'delivered':
                deliveries = load_data('deliveries.json')
                deliveries.append(donation)
                save_data('deliveries.json', deliveries)
            break
            
    if updated:
        save_data('donations.json', donations)
        return jsonify({"status": "success", "message": "Status updated"}), 200
    
    return jsonify({"status": "error", "message": "Donation not found"}), 404

@ngo_bp.route('/history', methods=['GET'])
def get_history():
    ngo_id = request.args.get('ngo_id')
    deliveries = load_data('deliveries.json')
    
    if ngo_id:
        deliveries = [d for d in deliveries if d.get('assigned_ngo') == ngo_id]
        
    return jsonify({
        "status": "success",
        "message": "History retrieved",
        "data": deliveries
    }), 200
