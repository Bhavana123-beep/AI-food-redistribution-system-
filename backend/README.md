# AI Food Redistribution Backend

This is the fully functional Python Flask backend for the AI Food Redistribution Platform. It includes a JSON-based database structure, CORS enabled, Modular Blueprints, and basic AI Logic.

## Prerequisites
1. Python 3.8+ installed on your system.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Backend
From the `backend` directory, simply run:
```bash
python app.py
```
The server will start on `http://127.0.0.1:5000/`. You can navigate to this URL to see the health check response.

## Connecting Frontend using Fetch API

Since CORS is enabled, making requests from your frontend HTML/JS files is very simple. Use the `fetch()` API like in the examples below.

### 1. Donor Module: Making a Donation (POST)
```javascript
async function submitDonation() {
    const data = {
        donor_name: "John Doe",
        food_type: "Cooked Meals",
        quantity: "50 plates",
        location: "gachibowli", // This will trigger smart assignment to Food Bank NGO
        phone_number: "1234567890",
        expiry_time: "4 hours"
    };

    try {
        const response = await fetch("http://127.0.0.1:5000/donate/donate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log("Donation result:", result);
        
        // You can use result.data.prediction to show AI Demand
        // And result.data.assigned_ngo to show assigned NGO details
    } catch (error) {
        console.error("Error:", error);
    }
}
```

### 2. NGO Module: Get Assigned Donations (GET)
```javascript
async function getNgoDonations(ngoId) {
    try {
        // Pass ngo_id as a query parameter
        const response = await fetch(`http://127.0.0.1:5000/ngo/donations?ngo_id=${ngoId}`);
        const result = await response.json();
        console.log("Donations for NGO:", result);
    } catch (error) {
        console.error("Error fetching donations:", error);
    }
}
```

### 3. NGO Module: Update Status (POST)
```javascript
async function updateDonationStatus(donationId, newStatus) {
    try {
        const response = await fetch("http://127.0.0.1:5000/ngo/update-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                donation_id: donationId,
                status: newStatus // "accepted", "picked", or "delivered"
            })
        });
        const result = await response.json();
        console.log("Update status:", result);
    } catch (error) {
        console.error("Error updating status:", error);
    }
}
```

### 4. Admin Module: Get Analytics (GET)
```javascript
async function getAdminAnalytics() {
    try {
        const response = await fetch("http://127.0.0.1:5000/admin/analytics");
        const result = await response.json();
        console.log("Dashboard Analytics:", result.data);
    } catch (error) {
        console.error("Error fetching analytics:", error);
    }
}
```
