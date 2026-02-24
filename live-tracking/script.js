document.addEventListener('DOMContentLoaded', () => {

    // UI Elements
    const etaDisplay = document.getElementById('etaDisplay');
    const transitLine = document.getElementById('transitLine');
    const transitStep = document.getElementById('transitStep');
    const deliveredLine = document.getElementById('deliveredLine');
    const deliveredStep = document.getElementById('deliveredStep');
    const progressFill = transitLine.querySelector('.progress-fill');

    const liveVehicle = document.getElementById('liveVehicle');
    const liveRoutePath = document.getElementById('liveRoutePath');
    const simDeliveredBtn = document.getElementById('simDeliveredBtn');

    // SVG Path setup for animation
    const pathLength = liveRoutePath.getTotalLength();
    liveRoutePath.style.strokeDasharray = pathLength;
    liveRoutePath.style.strokeDashoffset = pathLength; // hide initially

    // Simulation state
    let progress = 0; // 0 to 1
    let animationInterval;
    let isDelivered = false;

    // Start Simulation
    function startTrackingSimulation() {
        // Assume 15 minute drive, we sim it in ~15 seconds for demo
        const totalSimTimeMs = 15000;
        const updateIntervalMs = 50;
        const increments = updateIntervalMs / totalSimTimeMs;

        let minutesLeft = 15;

        animationInterval = setInterval(() => {
            if (isDelivered) {
                clearInterval(animationInterval);
                return;
            }

            progress += increments;

            if (progress >= 1) {
                progress = 1;
                completeDelivery();
                clearInterval(animationInterval);
            }

            updateUI();

            // Update ETA text roughly every 6.6% progress (1 min of 15 min)
            if (progress > 0 && progress < 1) {
                minutesLeft = 15 - Math.floor(progress * 15);
                etaDisplay.textContent = `${minutesLeft} mins`;
            }

        }, updateIntervalMs);
    }

    function updateUI() {
        // 1. Update Map Route Fill
        const offset = pathLength - (progress * pathLength);
        liveRoutePath.style.strokeDashoffset = offset;

        // 2. Move Vehicle Pin along the path
        const point = liveRoutePath.getPointAtLength(progress * pathLength);

        // The SVG viewBox is 1000x800. We map these coordinates to percentages 
        // to position the absolutely positioned vehicle pin
        const xPercent = (point.x / 1000) * 100;
        const yPercent = (point.y / 800) * 100;

        liveVehicle.style.left = `${xPercent}%`;
        liveVehicle.style.top = `${yPercent}%`;

        // 3. Update Status Tracker Progress Bar (UI Left Panel)
        progressFill.style.height = `${progress * 100}%`;
    }

    function completeDelivery() {
        isDelivered = true;
        progress = 1;
        updateUI();

        // Update ETA Display
        etaDisplay.textContent = 'Arrived';
        etaDisplay.style.color = 'var(--primary-dark)';

        // Stop pulsing icon on "On the Way"
        const transitIcon = transitStep.querySelector('i');
        transitIcon.classList.remove('icon-pulse');
        transitIcon.className = 'fa-solid fa-check'; // Change truck to checkmark
        transitStep.classList.remove('active');
        transitStep.classList.add('completed');

        // Fill the rest of the lines
        transitLine.classList.add('completed');
        deliveredLine.classList.remove('pending');
        deliveredLine.classList.add('completed');

        // Activate "Delivered" step
        deliveredStep.classList.remove('pending');
        deliveredStep.classList.add('active'); // active first for blue glow

        setTimeout(() => {
            deliveredStep.classList.remove('active');
            deliveredStep.classList.add('completed'); // then green complete
        }, 1000);

        // Stop vehicle pulsing
        liveVehicle.classList.remove('moving');
        liveVehicle.style.backgroundColor = 'var(--primary)';

        // Hide button
        simDeliveredBtn.style.display = 'none';

        // Optionally show toast or celebration here
    }

    // Manual Override Button
    if (simDeliveredBtn) {
        simDeliveredBtn.addEventListener('click', () => {
            if (!isDelivered) {
                completeDelivery();
                clearInterval(animationInterval);
            }
        });
    }

    // Start on load
    setTimeout(() => {
        startTrackingSimulation();
    }, 1000); // 1s delay before starting
});
