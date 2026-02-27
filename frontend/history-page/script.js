document.addEventListener('DOMContentLoaded', () => {

    // 1. Sidebar Toggle Logic for Mobile
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
            if (window.innerWidth <= 1200) {
                if (!sidebar.contains(e.target) && !menuTriggerBtn.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // 2. Dynamic History Data Fetching
    const historyFeed = document.getElementById('historyFeed');
    const emptyState = document.getElementById('emptyState');
    
    // Filters
    const searchInput = document.getElementById('searchInput');
    const partnerFilter = document.getElementById('partnerFilter');
    const statusFilter = document.getElementById('statusFilter');

    async function loadHistory() {
        try {
            const res = await fetch('http://localhost:5000/donations');
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            renderHistoryAndStats(data);
        } catch (e) {
            console.error("Error loading history", e);
            historyFeed.innerHTML = '<p style="text-align:center; padding:2rem;">Failed to load data. Is server running on port 5000?</p>';
        }
    }

    function renderHistoryAndStats(donations) {
        historyFeed.innerHTML = '';
        let totalQty = 0;

        const items = Object.entries(donations || {}).map(([id, val]) => ({id, ...val})).reverse();

        if (items.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        items.forEach((item, index) => {
            const qty = parseInt(item.quantity) || 0;
            totalQty += qty;

            const card = document.createElement('div');
            // use base class, add data attributes for filtering
            const currentStatus = item.status || "Pending AI Match";
            
            // Map statuses for filtering
            let filterStatus = 'Pending';
            if (currentStatus === 'Delivered') filterStatus = 'Delivered';
            if (currentStatus === 'Accepted' || currentStatus === 'In Transit') filterStatus = 'Picked';

            card.className = "history-card glass-panel animated-entry history-card-item";
            card.style.animationDelay = `${0.1 * index}s`;
            card.setAttribute('data-status', filterStatus);
            card.setAttribute('data-partner', 'Hope NGO'); // mock partner

            // Determine icons and badges
            let badgeClass = "badge-pending";
            let badgeIcon = "fa-spinner fa-spin";
            if(filterStatus === 'Delivered') { badgeClass = "badge-delivered"; badgeIcon = "fa-check-circle"; }
            else if(filterStatus === 'Picked') { badgeClass = "badge-picked"; badgeIcon = "fa-truck-fast"; }

            let foodIcon = "fa-utensils";
            if (item.type === "Prepared Food") foodIcon = "fa-burger";
            if (item.type === "Raw Ingredients") foodIcon = "fa-carrot";
            if (item.type === "Baked Goods") foodIcon = "fa-bread-slice";

            card.innerHTML = `
                <div class="card-header">
                    <div class="donor-details">
                        <div class="avatar bg-gradient-brand">DN</div>
                        <div>
                            <span class="user-role">Donor id: ${item.id.slice(-4)}</span>
                            <h4>Database Record</h4>
                            <p class="location"><i class="fa-solid fa-location-dot"></i> Logged in system</p>
                        </div>
                    </div>
                    <div class="status-badge ${badgeClass}">
                        <i class="fa-solid ${badgeIcon}"></i> ${currentStatus}
                    </div>
                </div>

                <div class="card-body">
                    <div class="food-details">
                        <div class="food-icon"><i class="fa-solid ${foodIcon}"></i></div>
                        <div class="food-text">
                            <h5>${item.foodItem || 'Unknown Item'}</h5>
                            <p>${item.type || 'Other'} • ${qty} lbs</p>
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="footer-meta">
                        <span><i class="fa-solid fa-clock"></i> <strong>Expiry:</strong> ${item.expiryTime || 'N/A'}</span>
                    </div>
                    <button class="btn btn-icon-only" title="View Details"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            `;
            historyFeed.appendChild(card);
        });

        // Update stats
        document.getElementById('statDonated').innerHTML = `${totalQty} <span class="unit">lbs</span>`;
        document.getElementById('statMeals').textContent = Math.floor(totalQty * 0.8);
        document.getElementById('statWaste').innerHTML = `${(totalQty * 0.0005).toFixed(2)} <span class="unit">T</span>`;

        applyFilters(); // trigger initial filter state
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedPartner = partnerFilter.value;
        const selectedStatus = statusFilter.value;

        let visibleCount = 0;
        const historyCards = document.querySelectorAll('.history-card-item');

        historyCards.forEach(card => {
            const cardStatus = card.getAttribute('data-status');
            const cardPartner = card.getAttribute('data-partner');
            const searchableText = card.textContent.toLowerCase();

            const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);
            const matchesPartner = selectedPartner === 'all' || cardPartner === selectedPartner || selectedPartner === 'Hope NGO'; // simplied mock
            const matchesStatus = selectedStatus === 'all' || cardStatus === selectedStatus;

            if (matchesSearch && matchesPartner && matchesStatus) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Event Listeners for Filters
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (partnerFilter) partnerFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            partnerFilter.value = 'all';
            statusFilter.value = 'all';
            applyFilters();
        });
    }

    // Load initial data
    loadHistory();

    // 3. Download Report Button
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
            // Visual feedback
            const originalHTML = downloadReportBtn.innerHTML;
            downloadReportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Generating...</span>';
            downloadReportBtn.style.opacity = '0.8';
            downloadReportBtn.style.pointerEvents = 'none';

            // Simulate generation delay
            setTimeout(() => {
                downloadReportBtn.innerHTML = '<i class="fa-regular fa-circle-check"></i> <span>Exported!</span>';
                downloadReportBtn.style.background = 'var(--text-primary)'; // Dark feedback

                // Reset after 2s
                setTimeout(() => {
                    downloadReportBtn.innerHTML = originalHTML;
                    downloadReportBtn.style.opacity = '1';
                    downloadReportBtn.style.pointerEvents = 'auto';
                    downloadReportBtn.style.background = ''; // reset to primary
                }, 2000);

            }, 1500);
        });
    }

});
