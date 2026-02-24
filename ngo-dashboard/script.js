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
    const statusModal = document.getElementById('statusModal');
    const closeStatusModalBtn = document.getElementById('closeStatusModalBtn');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    const toast = document.getElementById('toast');

    // Interactive Elements
    const acceptBtns = document.querySelectorAll('.accept-btn');
    const updateBtns = document.querySelectorAll('.update-status-btn');
    const issueNotes = document.getElementById('issueNotes');
    const statusRadios = document.querySelectorAll('input[name="deliveryStatus"]');

    let currentRowToUpdate = null;

    // Handle "Accept" Donation logic
    acceptBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const originalBtnHtml = e.target.innerHTML;

            e.target.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Accepting...';
            e.target.disabled = true;

            setTimeout(() => {
                // Update table row styling
                row.classList.add('highlight-row');

                // Update Badge
                const statusBadge = row.querySelector('.status');
                statusBadge.className = 'status badge-transit';
                statusBadge.textContent = 'En Route';

                // Replace Action Button
                const actionCell = row.querySelector('td:last-child');
                actionCell.innerHTML = '<button class="btn btn-outline btn-sm update-status-btn">Update Status</button>';

                // Bind the new button to modal logic
                const newBtn = actionCell.querySelector('.update-status-btn');
                newBtn.addEventListener('click', () => openStatusModal(row));

                showToast('Success', 'Donation accepted! Route added to navigation.', 'fa-check-circle');
            }, 1000);
        });
    });

    // Open Modal
    function openStatusModal(row) {
        currentRowToUpdate = row;
        statusModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Get donor name for modal context
        const donorName = row.querySelector('h4').textContent;
        statusModal.querySelector('.modal-body p strong').textContent = donorName;

        // Reset form
        statusRadios[0].checked = true;
        issueNotes.style.display = 'none';
        issueNotes.querySelector('textarea').value = '';
    }

    // Bind existing "Update Status" buttons
    updateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            openStatusModal(row);
        });
    });

    // Close Modal
    function closeModal() {
        statusModal.classList.remove('active');
        document.body.style.overflow = '';
        currentRowToUpdate = null;
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

    // Handle Save Status Update
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', () => {
            const selectedStatus = document.querySelector('input[name="deliveryStatus"]:checked').value;

            if (!currentRowToUpdate) return;

            const originalText = saveStatusBtn.textContent;
            saveStatusBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';
            saveStatusBtn.disabled = true;

            setTimeout(() => {
                const statusBadge = currentRowToUpdate.querySelector('.status');
                currentRowToUpdate.classList.remove('highlight-row');

                if (selectedStatus === 'picked_up') {
                    statusBadge.className = 'status badge-transit';
                    statusBadge.textContent = 'In Transit';
                    showToast('Update', 'Food picked up. Proceed to shelter.', 'fa-truck-fast');
                } else if (selectedStatus === 'delivered') {
                    statusBadge.className = 'status badge-completed';
                    statusBadge.textContent = 'Delivered';
                    const actionCell = currentRowToUpdate.querySelector('td:last-child');
                    actionCell.innerHTML = '<button class="btn-icon" title="View Details"><i class="fa-solid fa-eye"></i></button>';

                    // increase metric
                    const mealsEl = document.getElementById('rescuedMealsCount');
                    if (mealsEl) {
                        const current = parseInt(mealsEl.textContent.replace(/,/g, ''), 10);
                        mealsEl.textContent = (current + 20).toLocaleString(); // simulate adding 20 meals
                    }
                    showToast('Completed', 'Delivery Successful! Great job.', 'fa-hands-clapping');
                } else if (selectedStatus === 'issue') {
                    statusBadge.className = 'status badge-pending';
                    statusBadge.textContent = 'Issue Reported';
                    showToast('Alert', 'Issue reported to support team.', 'fa-triangle-exclamation');
                }

                saveStatusBtn.textContent = originalText;
                saveStatusBtn.disabled = false;
                closeModal();
            }, 800);
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
});
