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

    // 2. Search and Filter Logic
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const partnerFilter = document.getElementById('partnerFilter');
    const statusFilter = document.getElementById('statusFilter');
    const historyCards = document.querySelectorAll('.history-card');
    const emptyState = document.getElementById('emptyState');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedDate = dateFilter.value; // For demo, we just pretend this works alongside others
        const selectedPartner = partnerFilter.value;
        const selectedStatus = statusFilter.value;

        let visibleCount = 0;

        historyCards.forEach(card => {
            // Get data attributes
            const cardStatus = card.getAttribute('data-status');
            const cardPartner = card.getAttribute('data-partner');

            // Get searchable text content
            const searchableText = card.textContent.toLowerCase();

            // Check conditions
            const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm);
            const matchesPartner = selectedPartner === 'all' || cardPartner === selectedPartner;
            const matchesStatus = selectedStatus === 'all' || cardStatus === selectedStatus;

            // Date filter simulation (in a real app, this parses data-date attributes)
            const matchesDate = true;

            if (matchesSearch && matchesPartner && matchesStatus && matchesDate) {
                card.style.display = 'block';
                // Trigger reflow to restart animation simply
                card.style.animation = 'none';
                card.offsetHeight; /* trigger reflow */
                card.style.animation = null;
                card.classList.add('animated-entry'); // Ensures animation plays on re-show

                visibleCount++;
            } else {
                card.style.display = 'none';
                card.classList.remove('animated-entry');
            }
        });

        // Toggle empty state
        if (visibleCount === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    // Event Listeners for Filters
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
    if (partnerFilter) partnerFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            dateFilter.value = 'all';
            partnerFilter.value = 'all';
            statusFilter.value = 'all';
            applyFilters();
        });
    }

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
