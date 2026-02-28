document.addEventListener('DOMContentLoaded', () => {

    // ── UI refs ──────────────────────────────────────────────
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
    const emptyState = document.getElementById('emptyState');
    const notificationsList = document.getElementById('notificationsList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const unreadCountBadge = document.getElementById('unreadCountBadge');

    const API = 'http://localhost:5000';

    // ── Relative timestamp ───────────────────────────────────
    function timeAgo(dateStr) {
        if (!dateStr) return 'Just now';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000); // seconds
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
        if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
        return new Date(dateStr).toLocaleDateString();
    }

    // Is this notification "unread"? → submitted within last 2 hours
    function isRecent(dateStr) {
        if (!dateStr) return true;
        return (Date.now() - new Date(dateStr)) < 2 * 3600 * 1000;
    }

    // ── Fetch all donations from backend ─────────────────────
    async function loadNotifications() {
        notificationsList.innerHTML = `
            <div style="text-align:center;padding:2.5rem;color:#7f8c8d;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size:1.8rem;color:#2ecc71;"></i>
                <p style="margin-top:10px;font-weight:600;">Loading notifications...</p>
            </div>`;

        try {
            // ✅ Use the /donations endpoint which returns { success, donations: [...] }
            const res = await fetch(`${API}/donations`);
            const data = await res.json();

            // ✅ Correct: data.donations is the array
            const donations = Array.isArray(data.donations) ? data.donations : [];
            renderNotifications(donations);

        } catch (err) {
            console.error('Failed to load notifications:', err);
            notificationsList.innerHTML = `
                <div style="text-align:center;padding:2.5rem;color:#e74c3c;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:10px;"></i>
                    <p>Could not reach server. Make sure Node is running on port 5000.</p>
                </div>`;
        }
    }

    // ── Status → card config ──────────────────────────────────
    const STATUS_CONFIG = {
        'Pending AI Match': {
            icon: 'fa-robot',
            bg: 'bg-blue',
            title: 'New Donation — AI Scanning',
            type: 'matches',
            body: (item) => `<b>${item.foodItem}</b> (${item.quantity || '?'}) submitted by ${item.donorName || 'Anonymous'}. AI is finding the nearest NGO.`,
        },
        'Accepted': {
            icon: 'fa-handshake-angle',
            bg: 'bg-orange',
            title: 'Donation Accepted by NGO ✓',
            type: 'matches',
            body: (item) => `An NGO has accepted the <b>${item.foodItem}</b> donation. Pickup will happen soon.`,
            action: null,
        },
        'In Transit': {
            icon: 'fa-truck-fast',
            bg: 'bg-orange',
            title: 'Volunteer En Route 🚐',
            type: 'deliveries',
            body: (item) => `A volunteer is transporting <b>${item.foodItem}</b> to the shelter right now.`,
            action: `<a href="../live-tracking/index.html" class="btn btn-outline btn-sm">Track Live</a>`,
        },
        'Delivered': {
            icon: 'fa-circle-check',
            bg: 'bg-green',
            title: 'Food Delivered Successfully 🎉',
            type: 'deliveries',
            body: (item) => `<b>${item.foodItem}</b> has been delivered. Thank you for making a difference!`,
        },
        'Issue Reported': {
            icon: 'fa-triangle-exclamation',
            bg: 'bg-red',
            title: 'Issue Reported ⚠️',
            type: 'system',
            body: (item) => `An issue was reported for the <b>${item.foodItem}</b> pickup. Our team has been notified.`,
        },
    };

    // ── Render ────────────────────────────────────────────────
    function renderNotifications(donations) {
        // Sort newest first
        const sorted = [...donations].sort((a, b) =>
            new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
        );

        let html = '';
        let totalCards = 0;

        sorted.forEach(item => {
            const status = item.status || 'Pending AI Match';
            const cfg = STATUS_CONFIG[status];
            if (!cfg) return;

            const timestamp = item.updatedAt || item.createdAt;
            const unread = isRecent(timestamp);
            const unreadCls = unread ? 'unread' : '';
            const timeLabel = timeAgo(timestamp);
            const bodyText = cfg.body(item);
            const actionHTML = cfg.action || '';
            const dotBtn = unread
                ? `<button class="mark-read-indicator" title="Mark as read"></button>`
                : '';

            html += `
                <div class="notification-card ${unreadCls}" data-type="${cfg.type}">
                    <div class="notif-icon ${cfg.bg}">
                        <i class="fa-solid ${cfg.icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-header">
                            <h4>${cfg.title}</h4>
                            <span class="time">${timeLabel}</span>
                        </div>
                        <p>${bodyText}</p>
                        ${actionHTML ? `<div class="notif-actions">${actionHTML}</div>` : ''}
                    </div>
                    ${dotBtn}
                </div>`;
            totalCards++;
        });

        // Always append a system welcome card
        html += `
            <div class="notification-card" data-type="system">
                <div class="notif-icon bg-gray">
                    <i class="fa-solid fa-leaf"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-header">
                        <h4>Welcome to Food Rescue AI 🌿</h4>
                        <span class="time">System</span>
                    </div>
                    <p>Every donation you make feeds a family. Complete your profile for smarter AI matching.</p>
                </div>
            </div>`;

        notificationsList.innerHTML = html;

        // Rebind mark-read dots
        document.querySelectorAll('.mark-read-indicator').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.notification-card');
                card.classList.remove('unread');
                dot.remove();
                updateUnreadBadge();
                // Re-run current filter
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) applyFilter(activeTab.getAttribute('data-filter'));
            });
        });

        updateUnreadBadge();
        const activeTab = document.querySelector('.tab-btn.active');
        applyFilter(activeTab ? activeTab.getAttribute('data-filter') : 'all');
    }

    // ── Filter ────────────────────────────────────────────────
    function applyFilter(filterValue) {
        const cards = document.querySelectorAll('.notification-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const type = card.getAttribute('data-type');
            const unread = card.classList.contains('unread');

            const show = filterValue === 'all'
                || (filterValue === 'unread' && unread)
                || (filterValue === type);

            card.style.display = show ? 'flex' : 'none';
            if (show) visibleCount++;
        });

        if (visibleCount === 0) {
            emptyState.style.display = 'block';
            const p = emptyState.querySelector('p');
            if (p) p.textContent = filterValue === 'unread'
                ? "You're all caught up! No unread notifications."
                : "No notifications found in this category.";
        } else {
            emptyState.style.display = 'none';
        }
    }

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            applyFilter(e.currentTarget.getAttribute('data-filter'));
        });
    });

    // ── Mark all read ─────────────────────────────────────────
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            document.querySelectorAll('.notification-card.unread').forEach(card => {
                card.classList.remove('unread');
                const dot = card.querySelector('.mark-read-indicator');
                if (dot) dot.remove();
            });
            markAllReadBtn.style.transform = 'scale(1.15)';
            setTimeout(() => markAllReadBtn.style.transform = 'scale(1)', 200);
            updateUnreadBadge();
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.getAttribute('data-filter') === 'unread') {
                applyFilter('unread');
            }
        });
    }

    // ── Unread badge ──────────────────────────────────────────
    function updateUnreadBadge() {
        if (!unreadCountBadge) return;
        const count = document.querySelectorAll('.notification-card.unread').length;
        unreadCountBadge.textContent = count;
        unreadCountBadge.style.display = count > 0 ? 'inline-block' : 'none';
        document.title = count > 0
            ? `(${count}) Notifications — Food Rescue AI`
            : 'Notifications — Food Rescue AI';
    }

    // ── Boot ──────────────────────────────────────────────────
    updateUnreadBadge();
    loadNotifications();

    // Auto-refresh every 30s to pick up new donations/status changes
    setInterval(loadNotifications, 30000);
});
