document.addEventListener('DOMContentLoaded', () => {

    // Sidebar Toggle Logic for Mobile
    const sidebar = document.getElementById('sidebar');
    const menuTriggerBtn = document.getElementById('menuTriggerBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (menuTriggerBtn && sidebar && closeSidebarBtn) {
        menuTriggerBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });

        // Close sidebar if clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuTriggerBtn.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // Modal UI Logic
    const logFoodModal = document.getElementById('logFoodModal');
    const openLogFoodBtn = document.getElementById('openLogFoodBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const logFoodForm = document.getElementById('logFoodForm');
    const submitFoodBtn = document.getElementById('submitFoodBtn');
    const toast = document.getElementById('toast');
    const tableBody = document.getElementById('donationsTableBody');

    // Open Modal (Protected by Time Slot)
    let isDonationAllowed = false;
    
    function openModal() {
        if (!isDonationAllowed) {
            alert("Food donation is allowed only during Breakfast (7-10 AM), Lunch (12-2 PM), and Dinner (7-10 PM).");
            return;
        }
        logFoodModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close Modal
    function closeModal() {
        logFoodModal.classList.remove('active');
        document.body.style.overflow = '';
        if (logFoodForm) logFoodForm.reset(); // clear form
    }

    // Time Slot Checking Logic
    const sessionLabel = document.getElementById('sessionLabel');
    function checkTimeSlot() {
        const now = new Date();
        const currentHour = now.getHours();

        let currentSession = "Closed";
        isDonationAllowed = false;

        // Breakfast (7:00 AM to 10:00 AM -> 7 to 9:59)
        if (currentHour >= 7 && currentHour < 10) {
            isDonationAllowed = true;
            currentSession = "Breakfast";
        }
        // Lunch (12:00 PM to 2:00 PM -> 12 to 13:59)
        else if (currentHour >= 12 && currentHour < 14) {
            isDonationAllowed = true;
            currentSession = "Lunch";
        }
        // Dinner (7:00 PM to 10:00 PM -> 19 to 21:59)
        else if (currentHour >= 19 && currentHour < 22) {
            isDonationAllowed = true;
            currentSession = "Dinner";
        }

        // Update UI Label
        if (sessionLabel) {
            sessionLabel.innerHTML = `<i class="fa-regular fa-clock"></i> Session: <span style="color: ${isDonationAllowed ? 'var(--primary)' : 'var(--error)'}">${currentSession}</span>`;
        }

        // Update Button State
        if (isDonationAllowed) {
            openLogFoodBtn.style.backgroundColor = 'var(--primary)';
            openLogFoodBtn.style.borderColor = 'var(--primary)';
            openLogFoodBtn.style.opacity = '1';
            openLogFoodBtn.style.cursor = 'pointer';
        } else {
            openLogFoodBtn.style.backgroundColor = '#95a5a6'; // Grey
            openLogFoodBtn.style.borderColor = '#95a5a6';
            openLogFoodBtn.style.opacity = '0.7';
            openLogFoodBtn.style.cursor = 'not-allowed';
        }
    }

    // Run immediately and then every 60 seconds
    checkTimeSlot();
    setInterval(checkTimeSlot, 60000);

    if (openLogFoodBtn) openLogFoodBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    // Close on overlay click
    if (logFoodModal) {
        logFoodModal.addEventListener('click', (e) => {
            if (e.target === logFoodModal) {
                closeModal();
            }
        });
    }

    // Handle Form Submission and Dynamic Table update
    logFoodForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Grab values
        const title = document.getElementById('foodTitle').value;
        const type = document.getElementById('foodType').value;
        const qty = document.getElementById('quantity').value;
        const time = document.getElementById('expiryTime').value;

        // Visual loading state
        const originalText = submitFoodBtn.innerHTML;
        submitFoodBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing AI Match...';
        submitFoodBtn.disabled = true;

        try {
            // Send Data to the Firebase/Node.js Backend
            const response = await fetch('http://localhost:5000/donate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    foodItem: title,
                    type: type,
                    quantity: qty,
                    expiryTime: time,
                    status: 'Pending AI Match',
                    createdAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Pick an icon based on type
            let iconClass = "fa-utensils";
            if (type === "Prepared Food") iconClass = "fa-burger";
            if (type === "Raw Ingredients") iconClass = "fa-carrot";
            if (type === "Baked Goods") iconClass = "fa-bread-slice";
            if (type === "Packaged Items") iconClass = "fa-box";

            // Reset UI
            submitFoodBtn.innerHTML = originalText;
            submitFoodBtn.disabled = false;
            closeModal();
            showToast();

            // Fetch the updated real data from the backend to reflect the new entry instantly
            await loadDonations();

        } catch (error) {
            console.error('Error logging food:', error);
            alert("Failed to connect to the backend server. Make sure it is running on port 5000.");
            submitFoodBtn.innerHTML = originalText;
            submitFoodBtn.disabled = false;
        }
    });

    // Show Success Toast
    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Initial Metrics from DOM
    const statMealsDonated = document.getElementById('statMealsDonated');
    const statActiveListings = document.getElementById('statActiveListings');

    async function loadDonations() {
        try {
            const response = await fetch('http://localhost:5000/donations');
            if (!response.ok) throw new Error("Failed connecting to server");
            const data = await response.json();
            
            tableBody.innerHTML = ''; // clear loading or previous

            let totalMeals = 0;
            let activeCount = 0;

            const items = Object.entries(data || {}).map(([id, val]) => ({id, ...val})).reverse();

            // Populate table and stats
            items.forEach((item) => {
                const qty = parseInt(item.quantity) || 0;
                totalMeals += Math.floor(qty * 0.8);

                const type = item.type || 'Other';
                const status = item.status || 'Pending AI Match';
                
                // Track active listings
                if (status === 'Pending AI Match' || status === 'Accepted' || status === 'In Transit') {
                    activeCount++;
                }

                // Pick an icon based on type
                let iconClass = "fa-utensils";
                if (type === "Prepared Food") iconClass = "fa-burger";
                if (type === "Raw Ingredients") iconClass = "fa-carrot";
                if (type === "Baked Goods") iconClass = "fa-bread-slice";
                if (type === "Packaged Items") iconClass = "fa-box";

                // Map status to badge
                let badgeClass = "badge-pending";
                if (status === 'Accepted') badgeClass = 'badge-matched';
                if (status === 'In Transit') badgeClass = 'badge-transit';
                if (status === 'Delivered') badgeClass = 'badge-delivered';

                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>
                        <div class="item-info">
                            <div class="item-icon"><i class="fa-solid ${iconClass}"></i></div>
                            <div>
                                <h4>${item.foodItem || 'Unknown'}</h4>
                                <p>${type}</p>
                            </div>
                        </div>
                    </td>
                    <td>${item.quantity || '0 lbs'}</td>
                    <td>${item.expiryTime || 'N/A'}</td>
                    <td><span class="status ${badgeClass}">${status}</span></td>
                    <td>
                        ${status === 'In Transit' 
                            ? `<a href="../live-tracking/index.html" class="btn-icon" title="Track Live" style="color:var(--brand-blue)"><i class="fa-solid fa-map-location-dot"></i></a>` 
                            : status === 'Pending AI Match'
                                ? `<button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                   <button class="btn-icon text-danger" title="Cancel"><i class="fa-solid fa-trash"></i></button>`
                                : `<button class="btn-icon" title="View Details"><i class="fa-solid fa-eye"></i></button>`
                        }
                    </td>
                `;
                tableBody.appendChild(newRow);
            });

            if(statMealsDonated) statMealsDonated.textContent = totalMeals;
            if(statActiveListings) statActiveListings.textContent = activeCount;

        } catch(e) {
            console.error("Failed to fetch donor data:", e);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Failed to connect to backend server.</td></tr>';
        }
    }


    // Helper: Format 24h time to 12h AM/PM
    function formatTime(time24) {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        let h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${minute} ${ampm}`;
    }

    // Initialize Dashboard Chart
    const chartCanvas = document.getElementById('donationChart');
    if (chartCanvas) {
        new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Matched', 'Pending', 'In Transit', 'Completed'],
                datasets: [{
                    data: [45, 15, 10, 30],
                    backgroundColor: [
                        '#2ecc71', // Matched (primary)
                        '#f1c40f', // Pending
                        '#3498db', // Transit
                        '#9b59b6'  // Completed
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                family: "'Outfit', sans-serif"
                            },
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                cutout: '75%'
            }
        });
    }

    // Run On Load
    loadDonations();
});
