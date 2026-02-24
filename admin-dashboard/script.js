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

    // 1. Impact & Waste Reduction Chart (Line/Bar mixed)
    const impactCanvas = document.getElementById('impactChart');
    if (impactCanvas) {
        new Chart(impactCanvas, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Food Rescued (lbs)',
                        data: [1200, 1900, 1500, 2200, 2000, 2800, 14205],
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
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#bdc3c7',
                        borderColor: '#333',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                        },
                        title: {
                            display: true,
                            text: 'Pounds (lbs)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        title: {
                            display: true,
                            text: 'Organizations Count'
                        }
                    },
                }
            }
        });
    }

    // 2. Donation Sources Doughnut Chart
    const sourceCanvas = document.getElementById('sourceChart');
    if (sourceCanvas) {
        new Chart(sourceCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Restaurants', 'Grocery Stores', 'Caterers', 'Bakeries', 'Farms'],
                datasets: [{
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: [
                        '#2ecc71', // Restaurants
                        '#3498db', // Grocery
                        '#f39c12', // Caterers
                        '#9b59b6', // Bakeries
                        '#e74c3c'  // Farms
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
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.9)',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function (context) {
                                return ` ${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                cutout: '70%',
                layout: {
                    padding: 10
                }
            }
        });
    }

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
