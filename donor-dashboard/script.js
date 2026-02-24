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

    // Open Modal
    function openModal() {
        logFoodModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close Modal
    function closeModal() {
        logFoodModal.classList.remove('active');
        document.body.style.overflow = '';
        logFoodForm.reset(); // clear form
    }

    openLogFoodBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Close on overlay click
    logFoodModal.addEventListener('click', (e) => {
        if (e.target === logFoodModal) {
            closeModal();
        }
    });

    // Handle Form Submission and Dynamic Table update
    logFoodForm.addEventListener('submit', (e) => {
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

        // Simulate API delay
        setTimeout(() => {
            // Pick an icon based on type
            let iconClass = "fa-utensils";
            if (type === "Prepared Food") iconClass = "fa-burger";
            if (type === "Raw Ingredients") iconClass = "fa-carrot";
            if (type === "Baked Goods") iconClass = "fa-bread-slice";
            if (type === "Packaged Items") iconClass = "fa-box";

            // Create new table row
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>
                    <div class="item-info">
                        <div class="item-icon"><i class="fa-solid ${iconClass}"></i></div>
                        <div>
                            <h4>${title}</h4>
                            <p>${type}</p>
                        </div>
                    </div>
                </td>
                <td>${qty}</td>
                <td>Today, ${formatTime(time)}</td>
                <td><span class="status badge-pending">Pending AI Match</span></td>
                <td>
                    <button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon text-danger" title="Cancel"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            // Insert at the top of the table
            tableBody.insertBefore(newRow, tableBody.firstChild);

            // Add highlight animation to new row
            newRow.style.backgroundColor = 'var(--primary-light)';
            newRow.style.transition = 'background-color 2s ease';
            setTimeout(() => {
                newRow.style.backgroundColor = '';
            }, 1000);

            // Reset UI
            submitFoodBtn.innerHTML = originalText;
            submitFoodBtn.disabled = false;
            closeModal();
            showToast();

            // Update Metrics (simulated)
            updateMetrics();

        }, 1200);
    });

    // Show Success Toast
    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
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

    // Helper: Simulate incrementing the "Active Listings" counter
    function updateMetrics() {
        const activeListingsEl = document.querySelector('.metric-card:nth-child(3) h3');
        if (activeListingsEl) {
            let current = parseInt(activeListingsEl.textContent, 10);
            activeListingsEl.textContent = current + 1;
        }
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
});
