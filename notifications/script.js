document.addEventListener('DOMContentLoaded', () => {

    // UI Elements
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
    const notificationCards = document.querySelectorAll('.notification-card');
    const emptyState = document.getElementById('emptyState');
    const notificationsList = document.getElementById('notificationsList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const markReadIndicators = document.querySelectorAll('.mark-read-indicator');
    const unreadCountBadge = document.getElementById('unreadCountBadge');

    // Filtering logic
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add to clicked tab
            const targetTab = e.currentTarget;
            targetTab.classList.add('active');

            const filterValue = targetTab.getAttribute('data-filter');
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

            // Handle empty state
            if (visibleCount === 0) {
                emptyState.style.display = 'block';
                // Update empty state text based on filter
                const emptyText = emptyState.querySelector('p');
                if (filterValue === 'unread') {
                    emptyText.textContent = "You're all caught up! No unread notifications.";
                } else {
                    emptyText.textContent = "No notifications found for this category.";
                }
            } else {
                emptyState.style.display = 'none';
            }
        });
    });

    // Mark individual notification as read
    markReadIndicators.forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click event if wrapped in a link
            const card = e.target.closest('.notification-card');

            // visually animate it out of unread state
            card.style.transition = 'all 0.3s ease';
            card.classList.remove('unread');

            updateUnreadBadge();
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

    // Initialize badge on load
    updateUnreadBadge();
});
