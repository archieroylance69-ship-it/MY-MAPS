// ======================================================
// MY MAPS
// CLEAN VERSION
// ======================================================


// ======================================================
// MAP
// ======================================================

const map = L.map("map").setView(
    [53.4808, -2.2426],
    11
);


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// ======================================================
// ELEMENTS
// ======================================================

const startInput =
    document.getElementById("startInput");

const destinationInput =
    document.getElementById(
        "destinationInput"
    );

const startRecommendations =
    document.getElementById(
        "startRecommendations"
    );

const destinationRecommendations =
    document.getElementById(
        "destinationRecommendations"
    );

const startRecommendBtn =
    document.getElementById(
        "startRecommendBtn"
    );

const destinationRecommendBtn =
    document.getElementById(
        "destinationRecommendBtn"
    );

const routeBtn =
    document.getElementById(
        "routeBtn"
    );

const navigateBtn =
    document.getElementById(
        "navigateBtn"
    );

const voiceTestBtn =
    document.getElementById(
        "voiceTestBtn"
    );

const routeInfo =
    document.getElementById(
        "routeInfo"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchBtn =
    document.getElementById(
        "searchBtn"
    );

const speedElement =
    document.getElementById(
        "speed"
    );

const speedometer =
    document.getElementById(
        "speedometer"
    );

const speedLimitElement =
    document.getElementById(
        "speedLimit"
    );

const gpsStatus =
    document.getElementById(
        "gpsStatus"
    );

const turnCard =
    document.getElementById(
        "turnCard"
    );

const turnIcon =
    document.getElementById(
        "turnIcon"
    );

const turnText =
    document.getElementById(
        "turnText"
    );

const turnDistance =
    document.getElementById(
        "turnDistance"
    );


// ======================================================
// ROUTE STATE
// ======================================================

let routeLine = null;

let startMarker = null;

let destinationMarker = null;

let navigationMarker = null;

let currentRoute = null;

let routeCoordinates = [];

let startCoords = null;

let destinationCoords = null;

let navigating = false;


// ======================================================
// AUTOCOMPLETE STATE
// ======================================================

let startTimer = null;

let destinationTimer = null;

let startRequestId = 0;

let destinationRequestId = 0;


// ======================================================
// GPS STATE
// ======================================================

let gpsWatchId = null;

let previousGPS = null;

let targetSpeed = 0;

let displayedSpeed = 0;


// ======================================================
// SPEED LIMIT STATE
// ======================================================

let currentSpeedLimit = null;

let lastSpeedLimitLookup = 0;

let lastSpeedLimitPosition = null;


// ======================================================
// NAVIGATION STATE
// ======================================================

let currentStepIndex = 0;

let lastSpokenStep = -1;


// ======================================================
// VOICES
// ======================================================

let voices = [];


// ======================================================
// QUICK LOCATIONS
// ======================================================

const quickPlaces = [

    {
        name:
            "Manchester Piccadilly",
        query:
            "Manchester Piccadilly Station",
        icon:
            "🚉"
    },

    {
        name:
            "Manchester Airport",
        query:
            "Manchester Airport",
        icon:
            "✈️"
    },

    {
        name:
            "Trafford Centre",
        query:
            "Trafford Centre",
        icon:
            "🛍️"
    },

    {
        name:
            "Manchester City Centre",
        query:
            "Manchester City Centre",
        icon:
            "🏙️"
    },

    {
        name:
            "Stockport",
        query:
            "Stockport",
        icon:
            "📍"
    },

    {
        name:
            "Liverpool City Centre",
        query:
            "Liverpool City Centre",
        icon:
            "🌆"
    },

    {
        name:
            "Old Trafford",
        query:
            "Old Trafford Stadium",
        icon:
            "⚽"
    },

    {
        name:
            "Leeds City Centre",
        query:
            "Leeds City Centre",
        icon:
            "🏙️"
    }

];


// ======================================================
// QUICK PLACE MENU
// ======================================================

function showQuickPlaces(
    container,
    input
) {

    container.innerHTML = `
        <div class="recommendation-title">
            Quick locations
        </div>
    `;


    quickPlaces.forEach(
        place => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "recommendation";


            button.textContent =
                `${place.icon} ${place.name}`;


            button.addEventListener(
                "click",
                () => {

                    setLocation(
                        input,
                        place.query
                    );


                    container.classList.add(
                        "hidden"
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );


    container.classList.remove(
        "hidden"
    );
}


// ======================================================
// AUTOCOMPLETE
// ======================================================

function setupAutocomplete(
    input,
    container,
    type
) {

    input.addEventListener(
        "focus",
        () => {

            if (
                !input.value.trim()
            ) {

                showQuickPlaces(
                    container,
                    input
                );

            }

        }
    );


    input.addEventListener(
        "input",
        () => {

            // User changed the text,
            // so remove any previously
            // selected coordinates.

            delete input.dataset.lat;

            delete input.dataset.lon;

            delete input.dataset.displayName;


            const query =
                input.value.trim();


            if (
                type === "start"
            ) {

                startRequestId++;

                clearTimeout(
                    startTimer
                );

            } else {

                destinationRequestId++;

                clearTimeout(
                    destinationTimer
                );

            }


            if (
                !query
            ) {

                showQuickPlaces(
                    container,
                    input
                );

                return;
            }


            // Start searching after
            // a couple of characters.

            if (
                query.length < 2
            ) {

                container.classList.add(
                    "hidden"
                );

                return;
            }


            const requestId =
                type === "start"
                    ? startRequestId
                    : destinationRequestId;


            const timer =
                setTimeout(
                    () => {

                        searchAddresses(
                            query,
                            input,
                            container,
                            type,
                            requestId
                        );

                    },
                    450
                );


            if (
                type === "start"
            ) {

                startTimer =
                    timer;

            } else {

                destinationTimer =
                    timer;
            }

        }
    );
}


setupAutocomplete(
    startInput,
    startRecommendations,
    "start"
);


setupAutocomplete(
    destinationInput,
    destinationRecommendations,
    "destination"
);


// ======================================================
// SEARCH ADDRESSES
// ======================================================

async function searchAddresses(
    query,
    input,
    container,
    type,
    requestId
) {

    container.classList.remove(
        "hidden"
    );


    container.innerHTML = `
        <div class="recommendation-title">
            Searching...
        </div>
    `;


    const params =
        new URLSearchParams({

            q:
                query,

            format:
                "jsonv2",

            addressdetails:
                "1",

            limit:
                "10",

            countrycodes:
                "gb",

            layer:
                "address,poi",

            "accept-language":
                "en-GB"

        });


    try {

        const response =
            await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`
            );


        if (!response.ok) {

            throw new Error(
                "Address search failed."
            );
        }


        const results =
            await response.json();


        const latestRequest =
            type === "start"
                ? startRequestId
                : destinationRequestId;


        // Ignore an old request if
        // the user has typed something
        // newer.

        if (
            requestId !== latestRequest
        ) {

            return;
        }


        container.innerHTML = "";


        if (
            !results.length
        ) {

            container.innerHTML = `
                <div class="recommendation-title">
                    No matching addresses
                </div>
            `;

            return;
        }


        const title =
            document.createElement(
                "div"
            );


        title.className =
            "recommendation-title";


        title.textContent =
            "Choose an address";


        container.appendChild(
            title
        );


        results.forEach(
            result => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "recommendation";


                const address =
                    result.address || {};


                const number =
                    address.house_number ||
                    "";


                const road =
                    address.road ||
                    address.pedestrian ||
                    address.footway ||
                    "";


                const postcode =
                    address.postcode ||
                    "";


                const suburb =
                    address.suburb ||
                    address.neighbourhood ||
                    "";


                const town =
                    address.town ||
                    address.city ||
                    address.village ||
                    "";


                const county =
                    address.county ||
                    "";


                /*
                    Build a clear main line.

                    Example:
                    3 Beech Avenue
                */

                let mainText =
                    result.display_name
                        .split(",")[0];


                if (
                    number &&
                    road
                ) {

                    mainText =
                        `${number} ${road}`;

                } else if (
                    road
                ) {

                    mainText =
                        road;

                }


                /*
                    Build the location line.

                    Example:
                    Greenacres, Oldham, OL4 2EG
                */

                const locationParts = [

                    suburb,

                    town,

                    county,

                    postcode

                ].filter(Boolean);


                let secondText =
                    locationParts.join(
                        ", "
                    );


                if (
                    !secondText
                ) {

                    secondText =
                        result.display_name;
                }


                button.innerHTML = `
                    <span class="suggestion-main">
                        📍 ${escapeHTML(mainText)}
                    </span>

                    <span class="suggestion-secondary">
                        ${escapeHTML(secondText)}
                    </span>
                `;


                /*
                    Save the exact coordinates
                    of the result the user clicked.
                */

                button.addEventListener(
                    "click",
                    () => {

                        setLocation(
                            input,
                            result.display_name,
                            result.lat,
                            result.lon
                        );


                        container.classList.add(
                            "hidden"
                        );

                    }
                );


                container.appendChild(
                    button
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );


        container.innerHTML = `
            <div class="recommendation-title">
                Couldn't load suggestions
            </div>
        `;
    }
}


// ======================================================
// SET LOCATION
// ======================================================

function setLocation(
    input,
    value,
    lat = null,
    lon = null
) {

    input.value =
        value;


    if (
        lat !== null &&
        lon !== null
    ) {

        input.dataset.lat =
            lat;

        input.dataset.lon =
            lon;

        input.dataset.displayName =
            value;

    } else {

        delete input.dataset.lat;

        delete input.dataset.lon;

        delete input.dataset.displayName;
    }


    input.focus();
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


// ======================================================
// STAR BUTTONS
// ======================================================

startRecommendBtn.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        destinationRecommendations
            .classList.add(
                "hidden"
            );


        if (
            startRecommendations
                .classList
                .contains("hidden")
        ) {

            showQuickPlaces(
                startRecommendations,
                startInput
            );

        } else {

            startRecommendations
                .classList.add(
                    "hidden"
                );
        }

    }
);


destinationRecommendBtn.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        startRecommendations
            .classList.add(
                "hidden"
            );


        if (
            destinationRecommendations
                .classList
                .contains("hidden")
        ) {

            showQuickPlaces(
                destinationRecommendations,
                destinationInput
            );

        } else {

            destinationRecommendations
                .classList.add(
                    "hidden"
                );
        }

    }
);


// ======================================================
// CLOSE MENUS
// ======================================================

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".location-input"
            ) &&
            !event.target.closest(
                ".recommendation-menu"
            )
        ) {

            startRecommendations
                .classList.add(
                    "hidden"
                );

            destinationRecommendations
                .classList.add(
                    "hidden"
                );
        }

    }
);


// ======================================================
// GEOCODING
// ======================================================

async function geocode(
    text,
    input
) {

    /*
        If an autocomplete result was clicked,
        use its exact coordinates.
    */

    if (
        input &&
        input.dataset.lat &&
        input.dataset.lon
    ) {

        return {

            lat:
                Number(
                    input.dataset.lat
                ),

            lon:
                Number(
                    input.dataset.lon
                ),

            name:
                input.dataset.displayName ||
                text

        };
    }


    const params =
        new URLSearchParams({

            q:
                text,

            format:
                "jsonv2",

            addressdetails:
                "1",

            limit:
                "1",

            countrycodes:
                "gb",

            "accept-language":
                "en-GB"

        });


    const response =
        await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`
        );


    if (!response.ok) {

        throw new Error(
            "Could not find location."
        );
    }


    const results =
        await response.json();


    if (
        !results.length
    ) {

        throw new Error(
            `Couldn't find "${text}".`
        );
    }


    return {

        lat:
            Number(
                results[0].lat
            ),

        lon:
            Number(
                results[0].lon
            ),

        name:
            results[0].display_name

    };
}


// ======================================================
// CALCULATE ROUTE
// ======================================================

routeBtn.addEventListener(
    "click",
    calculateRoute
);


async function calculateRoute() {

    const startText =
        startInput.value.trim();

    const destinationText =
        destinationInput.value.trim();


    if (
        !startText ||
        !destinationText
    ) {

        alert(
            "Enter both a starting point and destination."
        );

        return;
    }


    routeBtn.disabled =
        true;

    routeBtn.textContent =
        "Finding route...";


    try {

        startCoords =
            await geocode(
                startText,
                startInput
            );


        destinationCoords =
            await geocode(
                destinationText,
                destinationInput
            );


        const route =
            await getRoute(
                startCoords,
                destinationCoords
            );


        drawRoute(
            route
        );


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message
        );

    } finally {

        routeBtn.disabled =
            false;

        routeBtn.textContent =
            "Calculate route";
    }
}


// ======================================================
// OSRM ROUTING
// ======================================================

async function getRoute(
    start,
    destination
) {

    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start.lon},${start.lat};` +
        `${destination.lon},${destination.lat}` +
        `?overview=full&geometries=geojson&steps=true`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Routing service failed."
        );
    }


    const data =
        await response.json();


    if (
        data.code !== "Ok" ||
        !data.routes ||
        !data.routes.length
    ) {

        throw new Error(
            "No driving route found."
        );
    }


    return data.routes[0];
}


// ======================================================
// DRAW ROUTE
// ======================================================

function drawRoute(
    route
) {

    clearRoute();


    currentRoute =
        route;


    routeCoordinates =
        route.geometry.coordinates.map(
            point => [
                point[1],
                point[0]
            ]
        );


    routeLine =
        L.polyline(
            routeCoordinates,
            {

                color:
                    "#1683ff",

                weight:
                    7,

                opacity:
                    0.95

            }
        ).addTo(map);


    startMarker =
        L.marker(
            [
                startCoords.lat,
                startCoords.lon
            ]
        )
            .addTo(map)
            .bindPopup(
                "Starting point"
            );


    destinationMarker =
        L.marker(
            [
                destinationCoords.lat,
                destinationCoords.lon
            ]
        )
            .addTo(map)
            .bindPopup(
                "Destination"
            );


    map.fitBounds(
        routeLine.getBounds(),
        {
            padding:
                [45, 45]
        }
    );


    const miles =
        route.distance /
        1609.344;


    const minutes =
        Math.round(
            route.duration /
            60
        );


    routeInfo.innerHTML = `
        <strong>
            ${miles.toFixed(1)} miles
        </strong>
        <br>
        Approx. ${minutes} minutes
    `;


    navigateBtn.disabled =
        false;


    currentStepIndex =
        0;


    lastSpokenStep =
        -1;
}


// ======================================================
// CLEAR ROUTE
// ======================================================

function clearRoute() {

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine =
            null;
    }


    if (startMarker) {

        map.removeLayer(
            startMarker
        );

        startMarker =
            null;
    }


    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

        destinationMarker =
            null;
    }


    if (navigationMarker) {

        map.removeLayer(
            navigationMarker
        );

        navigationMarker =
            null;
    }


    routeCoordinates =
        [];

    currentRoute =
        null;

    navigating =
        false;

    turnCard.classList.add(
        "hidden"
    );
}


// ======================================================
// START NAVIGATION
// ======================================================

navigateBtn.addEventListener(
    "click",
    startNavigation
);


function startNavigation() {

    if (
        !routeCoordinates.length
    ) {

        return;
    }


    navigating =
        true;


    currentStepIndex =
        0;


    lastSpokenStep =
        -1;


    navigationMarker =
        L.circleMarker(
            routeCoordinates[0],
            {

                radius:
                    9,

                color:
                    "#ffffff",

                weight:
                    3,

                fillColor:
                    "#1683ff",

                fillOpacity:
                    1

            }
        ).addTo(map);


    navigateBtn.textContent =
        "Navigation active";


    navigateBtn.disabled =
        true;


    turnCard.classList.remove(
        "hidden"
    );


    startGPS();


    speak(
        "Navigation started."
    );
}


// ======================================================
// GPS
// ======================================================

function startGPS() {

    if (
        !navigator.geolocation
    ) {

        gpsStatus.textContent =
            "GPS unavailable";

        return;
    }


    if (
        gpsWatchId !== null
    ) {

        return;
    }


    gpsWatchId =
        navigator.geolocation.watchPosition(

            handleGPS,

            handleGPSError,

            {

                enableHighAccuracy:
                    true,

                maximumAge:
                    1000,

                timeout:
                    10000

            }

        );
}


// ======================================================
// GPS SUCCESS
// ======================================================

function handleGPS(
    position
) {

    const accuracy =
        position.coords.accuracy ||
        0;


    gpsStatus.textContent =
        `GPS active • ±${Math.round(
            accuracy
        )}m`;


    updateRealSpeed(
        position
    );


    checkSpeedLimit(
        position
    );


    if (
        navigating
    ) {

        updateNavigation(
            position
        );
    }
}


// ======================================================
// GPS ERROR
// ======================================================

function handleGPSError(
    error
) {

    console.log(
        "GPS error:",
        error.message
    );


    gpsStatus.textContent =
        "GPS unavailable";
}


// ======================================================
// REAL SPEED
// ======================================================

function updateRealSpeed(
    position
) {

    const coords =
        position.coords;


    let metresPerSecond =
        null;


    /*
        First choice:
        browser's GPS speed.
    */

    if (
        Number.isFinite(
            coords.speed
        ) &&
        coords.speed >= 0
    ) {

        metresPerSecond =
            coords.speed;
    }


    /*
        Backup:
        calculate speed using two
        actual GPS positions.
    */

    if (
        metresPerSecond === null &&
        previousGPS
    ) {

        const distance =
            distanceBetweenPoints(
                previousGPS.lat,
                previousGPS.lon,
                coords.latitude,
                coords.longitude
            );


        const elapsed =
            (
                position.timestamp -
                previousGPS.timestamp
            ) /
            1000;


        if (
            elapsed > 0 &&
            elapsed <= 10
        ) {

            metresPerSecond =
                distance /
                elapsed;
        }
    }


    previousGPS = {

        lat:
            coords.latitude,

        lon:
            coords.longitude,

        timestamp:
            position.timestamp

    };


    if (
        metresPerSecond === null
    ) {

        targetSpeed =
            0;

        return;
    }


    let mph =
        metresPerSecond *
        2.236936;


    /*
        Remove tiny stationary GPS noise.
    */

    if (
        mph < 1.5
    ) {

        mph =
            0;
    }


    /*
        Ignore obviously impossible GPS jumps.
    */

    if (
        mph > 160
    ) {

        return;
    }


    targetSpeed =
        mph;
}


// ======================================================
// SMOOTH SPEED
// ======================================================

function animateSpeed() {

    /*
        This only smooths actual GPS data.
        It does not create a fake speed.
    */

    displayedSpeed +=
        (
            targetSpeed -
            displayedSpeed
        ) *
        0.10;


    if (
        Math.abs(
            targetSpeed -
            displayedSpeed
        ) < 0.05
    ) {

        displayedSpeed =
            targetSpeed;
    }


    speedElement.textContent =
        Math.round(
            displayedSpeed
        );


    const percentage =
        Math.min(
            displayedSpeed /
            120,
            1
        );


    const angle =
        percentage *
        360;


    speedometer.style.setProperty(
        "--speed-angle",
        `${angle}deg`
    );


    if (
        currentSpeedLimit !== null &&
        displayedSpeed >
            currentSpeedLimit + 2
    ) {

        speedometer.classList.add(
            "over-limit"
        );

    } else {

        speedometer.classList.remove(
            "over-limit"
        );
    }


    requestAnimationFrame(
        animateSpeed
    );
}


animateSpeed();


// ======================================================
// NAVIGATION GPS
// ======================================================

function updateNavigation(
    position
) {

    if (
        !navigationMarker
    ) {

        return;
    }


    const lat =
        position.coords.latitude;

    const lon =
        position.coords.longitude;


    navigationMarker.setLatLng(
        [
            lat,
            lon
        ]
    );


    updateTurn(
        lat,
        lon
    );


    map.setView(
        [
            lat,
            lon
        ],
        Math.max(
            map.getZoom(),
            15
        ),
        {
            animate:
                true
        }
    );
}


// ======================================================
// TURN-BY-TURN
// ======================================================

function updateTurn(
    lat,
    lon
) {

    if (
        !currentRoute ||
        !currentRoute.legs ||
        !currentRoute.legs[0]
    ) {

        return;
    }


    const steps =
        currentRoute
            .legs[0]
            .steps;


    if (
        !steps.length
    ) {

        return;
    }


    const step =
        steps[
            Math.min(
                currentStepIndex,
                steps.length - 1
            )
        ];


    if (!step) {
        return;
    }


    const location =
        step.maneuver.location;


    const distance =
        distanceBetweenPoints(
            lat,
            lon,
            location[1],
            location[0]
        );


    turnIcon.textContent =
        getTurnIcon(
            step.maneuver.type,
            step.maneuver.modifier
        );


    turnText.textContent =
        getTurnText(
            step.maneuver.type,
            step.maneuver.modifier
        );


    turnDistance.textContent =
        formatDistance(
            distance
        );


    if (
        distance < 25 &&
        currentStepIndex <
            steps.length - 1
    ) {

        currentStepIndex++;


        const nextStep =
            steps[
                currentStepIndex
            ];


        if (
            currentStepIndex !==
            lastSpokenStep
        ) {

            speakTurn(
                nextStep
            );


            lastSpokenStep =
                currentStepIndex;
        }
    }


    if (
        step.maneuver.type ===
            "arrive"
    ) {

        speak(
            "You have arrived at your destination."
        );


        navigating =
            false;
    }
}


// ======================================================
// VOICE
// ======================================================

function loadVoices() {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    voices =
        window.speechSynthesis
            .getVoices();
}


loadVoices();


if (
    "onvoiceschanged" in
    window.speechSynthesis
) {

    window.speechSynthesis
        .onvoiceschanged =
        loadVoices;
}


function getBestVoice() {

    loadVoices();


    const ukVoices =
        voices.filter(
            voice =>
                /^en-GB/i.test(
                    voice.lang
                )
        );


    const preferred = [

        "Sonia",

        "Libby",

        "Ryan",

        "Google UK English"

    ];


    for (
        const name of preferred
    ) {

        const voice =
            ukVoices.find(
                item =>
                    item.name
                        .toLowerCase()
                        .includes(
                            name.toLowerCase()
                        )
            );


        if (voice) {

            return voice;
        }
    }


    return (
        ukVoices[0] ||
        voices[0] ||
        null
    );
}


function speak(
    text
) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    const voice =
        getBestVoice();


    if (voice) {

        speech.voice =
            voice;
    }


    speech.lang =
        "en-GB";


    speech.rate =
        0.88;


    speech.pitch =
        0.92;


    speech.volume =
        1;


    window.speechSynthesis.speak(
        speech
    );
}


// ======================================================
// VOICE TEST
// ======================================================

voiceTestBtn.addEventListener(
    "click",
    () => {

        speak(
            "This is the My Maps navigation voice. Your next turn will be announced clearly."
        );

    }
);


// ======================================================
// TURN VOICE
// ======================================================

function speakTurn(
    step
) {

    if (!step) {
        return;
    }


    const type =
        step.maneuver.type;

    const modifier =
        step.maneuver.modifier;


    if (
        type === "arrive"
    ) {

        speak(
            "You have arrived at your destination."
        );

        return;
    }


    let instruction =
        "Continue";


    if (
        modifier === "left"
    ) {

        instruction =
            "Turn left";

    } else if (
        modifier === "right"
    ) {

        instruction =
            "Turn right";

    } else if (
        modifier === "slight left"
    ) {

        instruction =
            "Bear left";

    } else if (
        modifier === "slight right"
    ) {

        instruction =
            "Bear right";

    } else if (
        modifier === "sharp left"
    ) {

        instruction =
            "Sharp left";

    } else if (
        modifier === "sharp right"
    ) {

        instruction =
            "Sharp right";

    } else if (
        type === "roundabout"
    ) {

        instruction =
            "Enter the roundabout";

    }


    speak(
        `${instruction}.`
    );
}


// ======================================================
// SPEED LIMIT
// ======================================================

function checkSpeedLimit(
    position
) {

    const lat =
        position.coords.latitude;

    const lon =
        position.coords.longitude;


    if (
        lastSpeedLimitPosition
    ) {

        const moved =
            distanceBetweenPoints(
                lat,
                lon,
                lastSpeedLimitPosition.lat,
                lastSpeedLimitPosition.lon
            );


        if (
            moved < 30
        ) {

            return;
        }
    }


    lastSpeedLimitPosition = {

        lat,
        lon

    };


    lookupSpeedLimit(
        lat,
        lon
    );
}


async function lookupSpeedLimit(
    lat,
    lon
) {

    const now =
        Date.now();


    if (
        now -
        lastSpeedLimitLookup <
        10000
    ) {

        return;
    }


    lastSpeedLimitLookup =
        now;


    const query = `
        [out:json][timeout:8];

        way(
            around:40,
            ${lat},
            ${lon}
        )
        ["highway"];

        out tags geom;
    `;


    try {

        const response =
            await fetch(
                "https://overpass-api.de/api/interpreter",
                {

                    method:
                        "POST",

                    body:
                        "data=" +
                        encodeURIComponent(
                            query
                        )
                }
            );


        if (
            !response.ok
        ) {

            return;
        }


        const data =
            await response.json();


        const roads =
            (
                data.elements ||
                []
            ).filter(
                road =>
                    road.tags &&
                    road.tags.maxspeed
            );


        if (
            !roads.length
        ) {

            setSpeedLimit(
                null
            );

            return;
        }


        let closestRoad =
            null;

        let closestDistance =
            Infinity;


        for (
            const road of roads
        ) {

            if (
                !road.geometry
            ) {
                continue;
            }


            for (
                const point
                of road.geometry
            ) {

                const distance =
                    distanceBetweenPoints(
                        lat,
                        lon,
                        point.lat,
                        point.lon
                    );


                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                    closestRoad =
                        road;
                }
            }
        }


        if (!closestRoad) {

            setSpeedLimit(
                null
            );

            return;
        }


        const limit =
            parseSpeedLimit(
                closestRoad
                    .tags
                    .maxspeed
            );


        setSpeedLimit(
            limit
        );


    } catch (error) {

        console.log(
            "Speed limit error:",
            error
        );
    }
}


// ======================================================
// PARSE SPEED LIMIT
// ======================================================

function parseSpeedLimit(
    value
) {

    if (!value) {

        return null;
    }


    const text =
        String(value)
            .toLowerCase()
            .trim();


    if (
        text.includes(
            "national"
        ) ||
        text.includes(
            "nsl"
        )
    ) {

        return null;
    }


    const match =
        text.match(
            /([0-9]+(?:\.[0-9]+)?)/
        );


    if (!match) {

        return null;
    }


    let number =
        Number(
            match[1]
        );


    if (
        text.includes("mph")
    ) {

        return Math.round(
            number
        );
    }


    return Math.round(
        number /
        1.609344
    );
}


function setSpeedLimit(
    limit
) {

    currentSpeedLimit =
        limit;


    if (
        limit === null
    ) {

        speedLimitElement.textContent =
            "LIMIT --";

    } else {

        speedLimitElement.textContent =
            `LIMIT ${limit} MPH`;
    }
}


// ======================================================
// DISTANCE
// ======================================================

function distanceBetweenPoints(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R =
        6371000;


    const radians =
        Math.PI /
        180;


    const dLat =
        (
            lat2 -
            lat1
        ) *
        radians;


    const dLon =
        (
            lon2 -
            lon1
        ) *
        radians;


    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            lat1 * radians
        ) *

        Math.cos(
            lat2 * radians
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;
}


// ======================================================
// FORMAT DISTANCE
// ======================================================

function formatDistance(
    metres
) {

    if (
        metres < 1000
    ) {

        return `${Math.round(
            metres
        )} m`;
    }


    return `${(
        metres / 1000
    ).toFixed(1)} km`;
}


// ======================================================
// CLEANUP
// ======================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(
                gpsWatchId
            );
        }


        if (
            "speechSynthesis" in
            window
        ) {

            window.speechSynthesis.cancel();
        }

    }
);