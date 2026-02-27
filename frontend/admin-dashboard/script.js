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

    // Chart.js Global Defaults for Dark Theme
    Chart.defaults.color = '#bdc3c7';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    let impactChartInstance = null;
    let sourceChartInstance = null;

    async function loadAdminAnalytics() {
        try {
            const res = await fetch('http://localhost:5000/donations');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            
            processAndRender(data);
        } catch(e) {
            console.error(e);
            // Even if it fails, render empty charts
            processAndRender({});
        }
    }

    function processAndRender(donations) {
        let totalQty = 0;
        let categories = {
            'Prepared Food': 0,
            'Raw Ingredients': 0,
            'Baked Goods': 0,
            'Packaged Items': 0,
            'Other': 0
        };

        const values = Object.values(donations || {});
        
        values.forEach(d => {
            const qty = parseInt(d.quantity) || 0;
            totalQty += qty;

            const t = d.type || 'Other';
            if (categories[t] !== undefined) {
                categories[t] += qty;
            } else {
                categories['Other'] += qty;
            }
        });

        // Update DOM Metrics
        document.getElementById('statDonated').textContent = `${totalQty} lbs`;
        document.getElementById('statMeals').textContent = `${Math.floor(totalQty * 0.8)}`; // proxy for meals
        document.getElementById('statWaste').textContent = `${(totalQty * 0.0005).toFixed(2)} T`; // proxy for CO2

        // Render Charts
        renderImpactChart(totalQty);
        renderSourceChart(categories);
    }

    function renderImpactChart(totalToday) {
        const impactCanvas = document.getElementById('impactChart');
        if (!impactCanvas) return;

        // Creating some dummy historical data, but appending dynamic today
        const historical = [1200, 1900, 1500, 2200, 2000, 2800];
        historical.push(totalToday > 0 ? totalToday : 14205); // ensure visual output if no data

        if (impactChartInstance) impactChartInstance.destroy();

        impactChartInstance = new Chart(impactCanvas, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
                datasets: [
                    {
                        label: 'Food Rescued (lbs)',
                        data: historical,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Active NGOs',
                        type: 'bar',
                        data: [65, 70, 72, 75, 78, 80, 84],
                        backgroundColor: 'rgba(52, 152, 219, 0.4)',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#bdc3c7',
                        borderColor: '#333',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: {
                        type: 'linear', display: true, position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        title: { display: true, text: 'Pounds (lbs)' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Organizations Count' }
                    }
                }
            }
        });
    }

    function renderSourceChart(catData) {
        const sourceCanvas = document.getElementById('sourceChart');
        if (!sourceCanvas) return;

        if (sourceChartInstance) sourceChartInstance.destroy();

        const labels = Object.keys(catData);
        let data = Object.values(catData);
        
        // If everything is 0, provide placeholder
        if (data.every(v => v === 0)) {
            data = [45, 25, 15, 10, 5]; // fallback
        }

        sourceChartInstance = new Chart(sourceCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#e74c3c'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.9)',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function (context) {
                                return ` ${context.label}: ${context.raw} lbs`;
                            }
                        }
                    }
                },
                cutout: '70%',
                layout: { padding: 10 }
            }
        });
    }

    // Trigger load
    loadAdminAnalytics();

    // Simple Tab Filtering Logic for the User Table
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
    const tableRows = document.querySelectorAll('.data-table tbody tr');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active class from all
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');

            const filterValue = e.target.textContent.toLowerCase();

            tableRows.forEach(row => {
                const roleCell = row.querySelector('td:nth-child(2)').textContent.toLowerCase();

                if (filterValue === 'all') {
                    row.style.display = '';
                } else if (filterValue === 'ngos' && roleCell.includes('ngo')) {
                    row.style.display = '';
                } else if (filterValue === 'donors' && roleCell.includes('donor')) {
                    row.style.display = '';
                } else if (filterValue === 'volunteers' && roleCell.includes('volunteer')) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

});
