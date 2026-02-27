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

    // Fetch and Output Dynamic Data
    const tableBody = document.getElementById('pickupsTableBody');
    let donationsCache = {}; // keep map of items for easy lookup

    async function loadDonations() {
        try {
            const response = await fetch('http://localhost:5000/donations');
            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            donationsCache = data;
            renderTable(data);
        } catch (error) {
            console.error("Failed to load donations:", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Error mapping donations off backend backend. Ensure Node server is running on port 5000.</td></tr>`;
        }
    }

    function renderTable(donations) {
        tableBody.innerHTML = ''; // clear

        if (!donations || Object.keys(donations).length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No donations found in database.</td></tr>`;
            return;
        }

        // Convert object to array and sort by latest
        const items = Object.entries(donations).map(([id, val]) => ({ id, ...val })).reverse();

        let pendingCount = 0;

        items.forEach(item => {
            // Pick an icon based on type
            let iconClass = "fa-utensils";
            if (item.type === "Prepared Food") iconClass = "fa-burger";
            if (item.type === "Raw Ingredients") iconClass = "fa-carrot";
            if (item.type === "Baked Goods") iconClass = "fa-bread-slice";
            if (item.type === "Packaged Items") iconClass = "fa-box";

            // Format time
            const formattedTime = item.expiryTime ? formatTime(item.expiryTime) : 'N/A';

            // Determine badge and buttons based on status
            let statusMarkup = '';
            let actionMarkup = '';

            const currentStatus = item.status || 'Pending AI Match';

            if (currentStatus === 'Pending AI Match') {
                pendingCount++;
                statusMarkup = `<span class="status badge-matched">Available (AI Matched)</span>`;
                actionMarkup = `<button class="btn btn-primary btn-sm accept-btn" data-id="${item.id}"><i class="fa-solid fa-check"></i> Accept</button>`;
            } else if (currentStatus === 'Accepted') {
                statusMarkup = `<span class="status badge-transit">Ready for Pickup</span>`;
                actionMarkup = `<button class="btn btn-outline btn-sm update-status-btn" data-id="${item.id}">Update Status</button>`;
            } else if (currentStatus === 'In Transit') {
                statusMarkup = `<span class="status badge-transit">Volunteer En Route</span>`;
                actionMarkup = `<button class="btn btn-outline btn-sm update-status-btn" data-id="${item.id}">Update Status</button>`;
            } else if (currentStatus === 'Delivered') {
                statusMarkup = `<span class="status badge-completed">Delivered</span>`;
                actionMarkup = `<button class="btn-icon" title="View Details"><i class="fa-solid fa-eye"></i></button>`;
            } else {
                 statusMarkup = `<span class="status badge-pending">${currentStatus}</span>`;
                 actionMarkup = `<button class="btn btn-outline btn-sm update-status-btn" data-id="${item.id}">Update Status</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="item-info">
                        <div class="item-icon"><i class="fa-solid ${iconClass}"></i></div>
                        <div>
                            <h4>Donor ID: ${item.id.slice(-4)}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-bold">${item.foodItem || 'Unknown'}</span><br>
                    <span class="text-xs text-muted">${item.quantity || '?'} items/lbs</span>
                </td>
                <td>Today, Before ${formattedTime}</td>
                <td>${statusMarkup}</td>
                <td>${actionMarkup}</td>
            `;

            tableBody.appendChild(tr);
        });

        const nearbyCountEl = document.getElementById('nearbyDonationsCount');
        if (nearbyCountEl) {
            nearbyCountEl.textContent = pendingCount;
        }

        const mapPinsEl = document.getElementById('dynamicMapPins');
        if (mapPinsEl) {
            mapPinsEl.innerHTML = ''; // clear
            
            // Randomly scatter pins for each pending donation on the visual map
            for (let i = 0; i < pendingCount; i++) {
                const topP = 20 + Math.random() * 50; 
                const leftP = 20 + Math.random() * 50; 
                const activeClass = i === 0 ? 'active-pin' : '';
                mapPinsEl.innerHTML += `<div class="pin ${activeClass}" style="top: ${topP}%; left: ${leftP}%;"><i class="fa-solid fa-location-dot"></i></div>`;
            }
        }

        attachEventListeners();
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

    // Modal UI Logic
    const statusModal = document.getElementById('statusModal');
    const closeStatusModalBtn = document.getElementById('closeStatusModalBtn');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    const toast = document.getElementById('toast');

    const issueNotes = document.getElementById('issueNotes');
    const statusRadios = document.querySelectorAll('input[name="deliveryStatus"]');

    let currentUpdateId = null;

    function attachEventListeners() {
        const acceptBtns = document.querySelectorAll('.accept-btn');
         const updateBtns = document.querySelectorAll('.update-status-btn');

        // Handle "Accept" Donation logic
        acceptBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                await updateStatusAPI(id, 'Accepted', e.target.closest('button'));
            });
        });

        // Bind existing "Update Status" buttons
        updateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                openStatusModal(id);
            });
        });
    }

    // Backend API Call for Updates
    async function updateStatusAPI(id, status, btnElement) {
         if (btnElement) {
            btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
            btnElement.disabled = true;
         }

         try {
             const res = await fetch('http://localhost:5000/update-status', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ donationId: id, newStatus: status })
             });

             if(!res.ok) throw new Error("Update Failed");

             showToast('Success', `Donation marked as ${status}!`, 'fa-check-circle');
             
             // reload data
             await loadDonations();
         } catch(e) {
             console.error(e);
             alert("Error updating database.");
         }
    }

    // Open Modal
    function openStatusModal(id) {
        currentUpdateId = id;
        statusModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reset form
        statusRadios[0].checked = true;
        issueNotes.style.display = 'none';
        issueNotes.querySelector('textarea').value = '';
    }

    // Close Modal
    function closeModal() {
        statusModal.classList.remove('active');
        document.body.style.overflow = '';
        currentUpdateId = null;
    }

    if (closeStatusModalBtn) {
        closeStatusModalBtn.addEventListener('click', closeModal);
    }

    statusModal.addEventListener('click', (e) => {
        if (e.target === statusModal) {
            closeModal();
        }
    });

    // Toggle Issue notes field based on radio selection
    statusRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'issue') {
                issueNotes.style.display = 'block';
            } else {
                issueNotes.style.display = 'none';
            }
        });
    });

    // Handle Save Status Update from Modal
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', async () => {
            const selectedStatusParam = document.querySelector('input[name="deliveryStatus"]:checked').value;
            
            if (!currentUpdateId) return;

            let finalStatus = '';
            if (selectedStatusParam === 'picked_up') finalStatus = 'In Transit';
            if (selectedStatusParam === 'delivered') finalStatus = 'Delivered';
            if (selectedStatusParam === 'issue') finalStatus = 'Issue Reported';

            const originalText = saveStatusBtn.textContent;
            saveStatusBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';
            saveStatusBtn.disabled = true;

            await updateStatusAPI(currentUpdateId, finalStatus, null);

            saveStatusBtn.textContent = originalText;
            saveStatusBtn.disabled = false;
            closeModal();
        });
    }

    // Show Success/Status Toast
    function showToast(title, msg, iconClass = 'fa-check') {
        const toastTitle = toast.querySelector('.text-1');
        const toastMsg = toast.querySelector('.text-2');
        const toastIcon = toast.querySelector('i');

        toastTitle.textContent = title;
        toastMsg.textContent = msg;
        toastIcon.className = `fa-solid ${iconClass}`;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Initial Load
    loadDonations();
});
