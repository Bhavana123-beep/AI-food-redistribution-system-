// Dummy NGO Data for demonstration
const MOCK_NGOS = [
    { id: 1, name: "Hope Foundation", address: "123 Charity Lane, City Center", phone: "+1 (555) 123-4567", latOffset: 0.01, lngOffset: 0.015, acceptsCooked: true },
    { id: 2, name: "Grace Food Bank", address: "45 Shelter Ave, Westside", phone: "+1 (555) 987-6543", latOffset: -0.015, lngOffset: -0.01, acceptsCooked: false },
    { id: 3, name: "Community Kitchen", address: "88 Harmony Blvd, Eastside", phone: "+1 (555) 456-7890", latOffset: 0.02, lngOffset: -0.005, acceptsCooked: true },
    { id: 4, name: "City Mission", address: "210 Rescue Rd, Downtown", phone: "+1 (555) 222-3333", latOffset: -0.005, lngOffset: 0.025, acceptsCooked: true },
    { id: 5, name: "Share A Meal", address: "77 Unity Square, Northpark", phone: "+1 (555) 777-8888", latOffset: 0.03, lngOffset: 0.02, acceptsCooked: false }
];

let map;
let userMarker;
let markers = [];
let infoWindow;
let placesService;
let autocomplete;

const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // Default to NYC if no GPS

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            }
        ]
    });

    infoWindow = new google.maps.InfoWindow();

    // Set up search autocomplete
    const searchInput = document.getElementById('searchInput');
    autocomplete = new google.maps.places.Autocomplete(searchInput);
    autocomplete.bindTo('bounds', map);

    // Listen for place changes in the search bar
    autocomplete.addListener('place_changed', onPlaceChanged);

    // Initial load
    document.getElementById('mapLoader').style.display = 'none';
    loadNGOsAround(defaultLocation);

    // Setup GPS Button
    document.getElementById('useLocationBtn').addEventListener('click', getUserLocation);
}

// Ensure the map initializes once scripts are loaded
window.onload = () => {
    // If google maps is loaded
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        document.getElementById('mapLoader').innerHTML = '<p>Failed to load Google Maps. Check your API Key.</p>';
    }

    // UI Interactions
    document.getElementById('menuTriggerBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('active');
    });

    document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('active');
    });

    document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('clearSearchBtn').style.display = 'none';
    });

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        document.getElementById('clearSearchBtn').style.display = e.target.value ? 'block' : 'none';
    });
};

function getUserLocation() {
    if (navigator.geolocation) {
        document.getElementById('mapLoader').style.display = 'flex';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                map.setCenter(pos);
                map.setZoom(13);

                if (userMarker) {
                    userMarker.setPosition(pos);
                } else {
                    userMarker = new google.maps.Marker({
                        position: pos,
                        map: map,
                        title: "Your Location",
                        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    });
                }

                document.getElementById('mapLoader').style.display = 'none';
                loadNGOsAround(pos); // Refresh NGOs around new location
            },
            () => {
                handleLocationError(true);
                document.getElementById('mapLoader').style.display = 'none';
            }
        );
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false);
    }
}

function handleLocationError(browserHasGeolocation) {
    alert(browserHasGeolocation ?
        "Error: The Geolocation service failed. Please allow location access." :
        "Error: Your browser doesn't support geolocation.");
}

function onPlaceChanged() {
    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
        window.alert("No details available for input: '" + place.name + "'");
        return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(13);
    }

    loadNGOsAround({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
    });
}

function loadNGOsAround(center) {
    clearMarkers();

    const listContainer = document.getElementById('ngoList');
    listContainer.innerHTML = '';

    // Simulate API fetch by placing mock NGOs around the center
    const activeNGOs = MOCK_NGOS.map(ngo => {
        return {
            ...ngo,
            lat: center.lat + ngo.latOffset,
            lng: center.lng + ngo.lngOffset
        }
    });

    document.getElementById('resultCount').textContent = `Found ${activeNGOs.length} NGOs near you`;

    activeNGOs.forEach((ngo, index) => {
        // 1. Calculate Distance
        const distanceStr = calcDistanceStr(center, ngo);
        ngo.distanceStr = distanceStr;

        // 2. Create Map Marker
        const marker = new google.maps.Marker({
            position: { lat: ngo.lat, lng: ngo.lng },
            map: map,
            title: ngo.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            animation: google.maps.Animation.DROP
        });

        markers.push(marker);

        // 3. Create List Item
        const itemHtml = `
            <div class="ngo-item" id="ngo-item-${ngo.id}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4>${ngo.name}</h4>
                    ${ngo.acceptsCooked ? '<span class="ngo-status">Cooked Food</span>' : '<span class="ngo-status" style="color:var(--orange)">Raw Only</span>'}
                </div>
                <p><i class="fa-solid fa-location-dot"></i> ${ngo.address}</p>
                <div class="ngo-meta">
                    <p style="margin:0;"><i class="fa-solid fa-phone"></i> ${ngo.phone}</p>
                    <span class="ngo-distance"><i class="fa-solid fa-route"></i> ${distanceStr}</span>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHtml);

        // 4. Interactions
        const itemEl = document.getElementById(`ngo-item-${ngo.id}`);

        marker.addListener('click', () => {
            selectNGO(ngo, marker, itemEl);
        });

        itemEl.addEventListener('click', () => {
            selectNGO(ngo, marker, itemEl);
            map.setCenter(marker.getPosition());
            map.setZoom(14);
        });
    });
}

function selectNGO(ngo, marker, element) {
    // Highlight list item
    document.querySelectorAll('.ngo-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Open InfoWindow
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lng}`;

    const content = `
        <div class="info-window">
            <h3>${ngo.name}</h3>
            <p><i class="fa-solid fa-location-dot"></i> ${ngo.address}</p>
            <p><i class="fa-solid fa-phone"></i> ${ngo.phone}</p>
            <p><i class="fa-solid fa-route"></i> Distance: <strong>${ngo.distanceStr}</strong></p>
            <a href="${directionsUrl}" target="_blank" class="dir-btn">
                <i class="fa-solid fa-diamond-turn-right"></i> Get Directions
            </a>
        </div>
    `;

    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// Helper to calculate straight line distance in Miles
function calcDistanceStr(centerLatlng, targetLatlng) {
    // Basic Haversine approximation or use google maps geometry library
    if (google.maps.geometry && google.maps.geometry.spherical) {
        const from = new google.maps.LatLng(centerLatlng.lat, centerLatlng.lng);
        const to = new google.maps.LatLng(targetLatlng.lat, targetLatlng.lng);
        const distMeters = google.maps.geometry.spherical.computeDistanceBetween(from, to);
        const miles = distMeters * 0.000621371;
        return miles.toFixed(1) + ' mi';
    }
    return "~ mi";
}
