document.addEventListener('DOMContentLoaded', () => {

    // ── Sidebar Toggle ───────────────────────────────────────
    const sidebar = document.getElementById('sidebar');
    const menuTriggerBtn = document.getElementById('menuTriggerBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (menuTriggerBtn && sidebar && closeSidebarBtn) {
        menuTriggerBtn.addEventListener('click', () => sidebar.classList.add('open'));
        closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !menuTriggerBtn.contains(e.target) &&
                sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }

    // ── Config ───────────────────────────────────────────────
    const API = 'http://localhost:5000';
    const tableBody = document.getElementById('pickupsTableBody');

    // Get auth token if NGO is logged in (optional – PATCH route requires it)
    const authToken = localStorage.getItem('token') || '';

    // ── Load Donations from Backend ──────────────────────────
    async function loadDonations() {
        try {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;">
                <i class="fa-solid fa-circle-notch fa-spin" style="color:#2ecc71;font-size:1.5rem;"></i>
                <br><span style="color:#7f8c8d;margin-top:8px;display:block;">Loading donations...</span>
            </td></tr>`;

            const res = await fetch(`${API}/donations`);
            if (!res.ok) throw new Error('API Error: ' + res.status);

            const data = await res.json();

            // Server returns { success: true, donations: [...] }
            const donations = data.donations || [];
            renderTable(donations);

        } catch (err) {
            console.error('Failed to load donations:', err);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#e74c3c;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Could not reach the backend. Make sure the Node server is running on port 5000.
            </td></tr>`;
        }
    }

    // ── Render Table ─────────────────────────────────────────
    function renderTable(donations) {
        tableBody.innerHTML = '';

        if (!Array.isArray(donations) || donations.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:#7f8c8d;">
                <i class="fa-solid fa-inbox" style="font-size:2rem;margin-bottom:10px;display:block;color:#bdc3c7;"></i>
                No donations found in the database yet.
            </td></tr>`;
            updateMetrics(0, 0, 0);
            return;
        }

        let pendingCount = 0;
        let acceptedCount = 0;
        let deliveredCount = 0;

        // Sort: newest first (by createdAt if available)
        const sorted = [...donations].sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        sorted.forEach(item => {
            // Resolve the real ID (Mongoose _id or id)
            const itemId = item._id || item.id;

            // Food type icon
            let iconClass = 'fa-utensils';
            if (item.type === 'Prepared Food' || item.type === 'Cooked Meal') iconClass = 'fa-burger';
            if (item.type === 'Raw Ingredients' || item.type === 'Raw Vegetables') iconClass = 'fa-carrot';
            if (item.type === 'Baked Goods' || item.type === 'Bread & Bakery') iconClass = 'fa-bread-slice';
            if (item.type === 'Packaged Food' || item.type === 'Packaged Items') iconClass = 'fa-box';
            if (item.type === 'Fruits') iconClass = 'fa-apple-whole';
            if (item.type === 'Dairy') iconClass = 'fa-jar';

            // Format expiry/pickup window
            const pickupWindow = item.expiryTime
                ? `Before ${item.expiryTime}`
                : item.session
                    ? item.session + ' window'
                    : 'ASAP';

            // Donor display
            const donorLabel = item.donorName || (item.donorType === 'quick_donor' ? 'Quick Donor' : `Donor #${String(itemId).slice(-4)}`);
            const donorSub = item.address || item.phone || '';

            const currentStatus = item.status || 'Pending AI Match';

            let statusMarkup = '';
            let actionMarkup = '';

            if (currentStatus === 'Pending AI Match') {
                pendingCount++;
                statusMarkup = `<span class="status badge-matched">Available (AI Matched)</span>`;
                actionMarkup = `
                    <button class="btn btn-primary btn-sm accept-btn" data-id="${itemId}">
                        <i class="fa-solid fa-check"></i> Accept Pickup
                    </button>`;
            } else if (currentStatus === 'Accepted') {
                acceptedCount++;
                statusMarkup = `<span class="status badge-transit">Ready for Pickup</span>`;
                actionMarkup = `
                    <button class="btn btn-outline btn-sm update-status-btn" data-id="${itemId}">
                        <i class="fa-solid fa-truck-fast"></i> Update Status
                    </button>`;
            } else if (currentStatus === 'In Transit') {
                acceptedCount++;
                statusMarkup = `<span class="status badge-transit">Volunteer En Route</span>`;
                actionMarkup = `
                    <button class="btn btn-outline btn-sm update-status-btn" data-id="${itemId}">
                        <i class="fa-solid fa-location-dot"></i> Update Status
                    </button>`;
            } else if (currentStatus === 'Delivered') {
                deliveredCount++;
                statusMarkup = `<span class="status badge-completed">Delivered ✓</span>`;
                actionMarkup = `<span style="color:#7f8c8d;font-size:0.82rem;">Completed</span>`;
            } else {
                statusMarkup = `<span class="status badge-pending">${currentStatus}</span>`;
                actionMarkup = `
                    <button class="btn btn-outline btn-sm update-status-btn" data-id="${itemId}">
                        Update Status
                    </button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="item-info">
                        <div class="item-icon"><i class="fa-solid ${iconClass}"></i></div>
                        <div>
                            <h4>${donorLabel}</h4>
                            <span class="text-xs text-muted">${donorSub}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-bold">${item.foodItem || 'Unknown'}</span><br>
                    <span class="text-xs text-muted">${item.quantity || '?'} &bull; ${item.type || 'Food'}</span>
                </td>
                <td>${pickupWindow}</td>
                <td>${statusMarkup}</td>
                <td>${actionMarkup}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Update metric cards
        updateMetrics(pendingCount, acceptedCount, deliveredCount);

        // Dynamic map pins for pending donations
        const mapPinsEl = document.getElementById('dynamicMapPins');
        if (mapPinsEl) {
            mapPinsEl.innerHTML = '';
            for (let i = 0; i < Math.min(pendingCount, 6); i++) {
                const top = 20 + Math.random() * 50;
                const left = 20 + Math.random() * 55;
                const activeClass = i === 0 ? 'active-pin' : '';
                mapPinsEl.innerHTML += `<div class="pin ${activeClass}" style="top:${top}%;left:${left}%;">
                    <i class="fa-solid fa-location-dot"></i>
                </div>`;
            }
        }

        attachEventListeners();
    }

    // ── Metric Cards ─────────────────────────────────────────
    function updateMetrics(pending, active, delivered) {
        const nearbyEl = document.getElementById('nearbyDonationsCount');
        if (nearbyEl) nearbyEl.textContent = pending;

        // "Active Pickups" card (3rd metric card)
        const allH3 = document.querySelectorAll('.metric-data h3');
        if (allH3[2]) allH3[2].textContent = active;
        // "Families Served" based on delivered
        if (allH3[3]) allH3[3].textContent = (150 + delivered * 5) + '+';
    }

    // ── Event Listeners ──────────────────────────────────────
    function attachEventListeners() {
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                await updateStatusAPI(id, 'Accepted', e.target.closest('button'));
            });
        });

        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                openStatusModal(id);
            });
        });
    }

    // ── PATCH /donations/:id/status ──────────────────────────
    async function updateStatusAPI(id, status, btnElement) {
        if (!id) { showToast('Error', 'Missing donation ID.', 'fa-triangle-exclamation'); return; }

        if (btnElement) {
            btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';
            btnElement.disabled = true;
        }

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

            // ✅ Correct endpoint: PATCH /donations/:id/status
            const res = await fetch(`${API}/donations/${id}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status }) // ✅ correct field name
            });

            const data = await res.json();

            if (!res.ok) {
                // If auth fails (no token), server returns 401
                if (res.status === 401 || res.status === 403) {
                    showToast('Auth Required', 'Login as NGO to update statuses.', 'fa-lock');
                } else {
                    showToast('Error', data.message || 'Update failed.', 'fa-triangle-exclamation');
                }
                // Reload to restore button state
                await loadDonations();
                return;
            }

            showToast('Success! ✓', `Donation marked as "${status}"`, 'fa-check-circle');
            await loadDonations(); // Refresh table

        } catch (err) {
            console.error('Update failed:', err);
            showToast('Error', 'Could not reach server. Check connection.', 'fa-triangle-exclamation');
            await loadDonations();
        }
    }

    // ── Status Modal ─────────────────────────────────────────
    const statusModal = document.getElementById('statusModal');
    const closeStatusModalBtn = document.getElementById('closeStatusModalBtn');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    const issueNotes = document.getElementById('issueNotes');
    const statusRadios = document.querySelectorAll('input[name="deliveryStatus"]');
    let currentUpdateId = null;

    function openStatusModal(id) {
        currentUpdateId = id;
        statusModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reset form
        if (statusRadios[0]) statusRadios[0].checked = true;
        if (issueNotes) issueNotes.style.display = 'none';
        const ta = issueNotes && issueNotes.querySelector('textarea');
        if (ta) ta.value = '';
    }

    function closeModal() {
        statusModal.classList.remove('active');
        document.body.style.overflow = '';
        currentUpdateId = null;
    }

    if (closeStatusModalBtn) closeStatusModalBtn.addEventListener('click', closeModal);

    statusModal.addEventListener('click', (e) => {
        if (e.target === statusModal) closeModal();
    });

    // Toggle issue notes
    statusRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (issueNotes) issueNotes.style.display = e.target.value === 'issue' ? 'block' : 'none';
        });
    });

    // Save from modal
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', async () => {
            const selected = document.querySelector('input[name="deliveryStatus"]:checked');
            if (!selected || !currentUpdateId) return;

            const statusMap = {
                'picked_up': 'In Transit',
                'delivered': 'Delivered',
                'issue': 'In Transit'   // keep in pipeline if issue reported
            };
            const finalStatus = statusMap[selected.value] || 'In Transit';

            const originalHTML = saveStatusBtn.innerHTML;
            saveStatusBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
            saveStatusBtn.disabled = true;

            await updateStatusAPI(currentUpdateId, finalStatus, null);

            saveStatusBtn.innerHTML = originalHTML;
            saveStatusBtn.disabled = false;
            closeModal();
        });
    }

    // "Find Donations" button — just refreshes
    const findBtn = document.getElementById('findDonationsBtn');
    if (findBtn) {
        findBtn.addEventListener('click', () => {
            showToast('Scanning...', 'Refreshing nearby donations via AI.', 'fa-magnifying-glass-location');
            loadDonations();
        });
    }

    // Filter tabs (client-side filter)
    const tabBtns = document.querySelectorAll('.tab-btn');
    let currentFilter = 'all';
    const filterMap = {
        'Available Nearby': 'Pending AI Match',
        'My Pickups': 'active',   // Accepted + In Transit
        'Completed': 'Delivered'
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = filterMap[btn.textContent.trim()] || 'all';
            filterTable(currentFilter);
        });
    });

    function filterTable(filter) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const statusCell = row.querySelector('.status');
            if (!statusCell) return;
            const text = statusCell.textContent;
            if (filter === 'all') {
                row.style.display = '';
            } else if (filter === 'active') {
                row.style.display = (text.includes('Pickup') || text.includes('En Route')) ? '' : 'none';
            } else if (filter === 'Pending AI Match') {
                row.style.display = text.includes('AI Matched') ? '' : 'none';
            } else {
                row.style.display = text.includes('Delivered') ? '' : 'none';
            }
        });
    }

    // ── Toast ────────────────────────────────────────────────
    const toast = document.getElementById('toast');

    function showToast(title, msg, iconClass = 'fa-check') {
        const toastTitle = toast.querySelector('.text-1');
        const toastMsg = toast.querySelector('.text-2');
        const toastIcon = toast.querySelector('i');

        if (toastTitle) toastTitle.textContent = title;
        if (toastMsg) toastMsg.textContent = msg;
        if (toastIcon) toastIcon.className = `fa-solid ${iconClass}`;

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    }

    // ── Initial load ─────────────────────────────────────────
    loadDonations();

    // Auto-refresh every 30 seconds
    setInterval(loadDonations, 30000);
});
