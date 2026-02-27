document.addEventListener('DOMContentLoaded', () => {

    // UI Elements
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
    const emptyState = document.getElementById('emptyState');
    const notificationsList = document.getElementById('notificationsList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const unreadCountBadge = document.getElementById('unreadCountBadge');

    let notificationCards = []; // populated dynamically

    // 1. Fetch Backend Data
    async function loadNotifications() {
        try {
            const res = await fetch('http://localhost:5000/donations');
            if (res.ok) {
                const data = await res.json();
                renderNotifications(data);
            }
        } catch(e) {
            console.error("Failed to fetch notifications", e);
        }
    }

    // 2. Render Logic
    function renderNotifications(donations) {
        notificationsList.innerHTML = '';
        
        const items = Object.entries(donations || {}).map(([id, val]) => ({id, ...val})).reverse();

        let notifsHTML = '';
        let validCount = 0;

        // Generate dynamic notifications based on donation status
        items.forEach((item) => {
            if (item.status === 'Pending AI Match') return; // no notification for just uploading
            
            const isUnread = validCount < 2; // fake unread logic for top 2 recent events
            const unreadClass = isUnread ? 'unread' : '';
            
            if (item.status === 'Accepted') {
                notifsHTML += `
                    <div class="notification-card ${unreadClass}" data-type="matches">
                        <div class="notif-icon bg-blue">
                            <i class="fa-solid fa-handshake-angle"></i>
                        </div>
                        <div class="notif-content">
                            <div class="notif-header">
                                <h4>New AI Match Found!</h4>
                                <span class="time">Recent</span>
                            </div>
                            <p>An NGO has accepted your '${item.foodItem}' donation.</p>
                        </div>
                        ${isUnread ? '<button class="mark-read-indicator" title="Mark as read"></button>' : ''}
                    </div>
                `;
                validCount++;
            } else if (item.status === 'In Transit') {
                notifsHTML += `
                    <div class="notification-card ${unreadClass}" data-type="deliveries">
                        <div class="notif-icon bg-orange">
                            <i class="fa-solid fa-user-check"></i>
                        </div>
                        <div class="notif-content">
                            <div class="notif-header">
                                <h4>Volunteer In Transit</h4>
                                <span class="time">Update</span>
                            </div>
                            <p>A volunteer is currently transporting your '${item.foodItem}'.</p>
                            <div class="notif-actions">
                                <a href="../live-tracking/index.html" class="btn btn-outline btn-sm">Track Volunteer</a>
                            </div>
                        </div>
                        ${isUnread ? '<button class="mark-read-indicator" title="Mark as read"></button>' : ''}
                    </div>
                `;
                validCount++;
            } else if (item.status === 'Delivered') {
                notifsHTML += `
                    <div class="notification-card ${unreadClass}" data-type="deliveries">
                        <div class="notif-icon bg-green">
                            <i class="fa-solid fa-check-circle"></i>
                        </div>
                        <div class="notif-content">
                            <div class="notif-header">
                                <h4>Delivered Successfully</h4>
                                <span class="time">Completed</span>
                            </div>
                            <p>Your '${item.foodItem}' donation has reached its destination. Thank you!</p>
                        </div>
                        ${isUnread ? '<button class="mark-read-indicator" title="Mark as read"></button>' : ''}
                    </div>
                `;
                validCount++;
            }
        });

        // Let's create a welcome notification always at the bottom
        notifsHTML += `
            <div class="notification-card" data-type="system">
                <div class="notif-icon bg-gray">
                    <i class="fa-solid fa-bell"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-header">
                        <h4>Welcome to AI Food Rescue</h4>
                        <span class="time">System</span>
                    </div>
                    <p>Complete your profile to receive better AI matching suggestions for your redistributions.</p>
                </div>
            </div>
        `;

        notificationsList.innerHTML = notifsHTML;

        // Re-bind dynamic elements
        notificationCards = document.querySelectorAll('.notification-card');
        const markReadIndicators = document.querySelectorAll('.mark-read-indicator');
        
        markReadIndicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.notification-card');
                card.style.transition = 'all 0.3s ease';
                card.classList.remove('unread');
                indicator.remove(); // hide the blue dot
                updateUnreadBadge();
            });
        });

        updateUnreadBadge();
        applyFilter(document.querySelector('.tab-btn.active').getAttribute('data-filter'));
    }

    // 3. Filtering logic
    function applyFilter(filterValue) {
        let visibleCount = 0;

        notificationCards.forEach(card => {
            const type = card.getAttribute('data-type');
            const isUnread = card.classList.contains('unread');

            let shouldShow = false;

            if (filterValue === 'all') {
                shouldShow = true;
            } else if (filterValue === 'unread' && isUnread) {
                shouldShow = true;
            } else if (filterValue === type) {
                shouldShow = true;
            }

            if (shouldShow) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            emptyState.style.display = 'block';
            const emptyText = emptyState.querySelector('p');
            if (filterValue === 'unread') {
                emptyText.textContent = "You're all caught up! No unread notifications.";
            } else {
                emptyText.textContent = "No notifications found for this category.";
            }
        } else {
            emptyState.style.display = 'none';
        }
    }

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            const targetTab = e.currentTarget;
            targetTab.classList.add('active');
            applyFilter(targetTab.getAttribute('data-filter'));
        });
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            const unreadCards = document.querySelectorAll('.notification-card.unread');

            if (unreadCards.length > 0) {
                // Add a subtle brief pulse animation to the button
                markAllReadBtn.style.transform = 'scale(1.1)';
                setTimeout(() => markAllReadBtn.style.transform = 'scale(1)', 200);

                unreadCards.forEach(card => {
                    card.classList.remove('unread');
                });

                updateUnreadBadge();

                // If we are currently ON the 'unread' tab, refresh the filter to show empty state
                const currentActiveTab = document.querySelector('.tab-btn.active');
                if (currentActiveTab && currentActiveTab.getAttribute('data-filter') === 'unread') {
                    currentActiveTab.click(); // Trigger click to re-run filter logic
                }
            }
        });
    }

    // Update unread count badge
    function updateUnreadBadge() {
        if (unreadCountBadge) {
            const unreadCount = document.querySelectorAll('.notification-card.unread').length;

            if (unreadCount > 0) {
                unreadCountBadge.textContent = unreadCount;
                unreadCountBadge.style.display = 'inline-block';
            } else {
                unreadCountBadge.style.display = 'none';
            }

            // Update document title for reality feel
            if (unreadCount > 0) {
                document.title = `(${unreadCount}) Notifications - AI Food Rescue`;
            } else {
                document.title = `Notifications - AI Food Rescue`;
            }
        }
    }

    // Initialize badge on load (for static empty state)
    updateUnreadBadge();

    // Load real notifications
    loadNotifications();
});
