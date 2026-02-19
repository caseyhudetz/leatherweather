import './style.css'

const mainElement = document.getElementById('main-content');

const MESSAGES = {
  YES: [
    "It's a beautiful day for hide.",
    "The cow provides. You wear.",
    "Peak leather conditions detected.",
    "Your jacket is basically singing.",
    "Maximum swagger achieved."
  ],
  TOO_HOT: [
    "You'll slow-cook in that thing.",
    "Leather + Heat = Human Sous Vide.",
    "Too spicy for the skin.",
    "Save the hide for the slide."
  ],
  RAIN: [
    "Wet leather smells like a wet wallet.",
    "Your jacket isn't a boat. Stay dry.",
    "Unless you want a heavy sponge jacket...",
    "Rain: 1, Leather: 0."
  ],
  TOO_COLD: [
    "It's parka time, tough guy.",
    "Leather won't stop the ice dragons.",
    "Too chilly for thin skin.",
    "Freeze your brass off elsewhere."
  ],
  UNKNOWN: [
    "The sky is feeling cryptic today.",
    "Flip a coin. The gods are silent."
  ]
};

function getRandomMessage(type) {
  const list = MESSAGES[type] || MESSAGES.UNKNOWN;
  return list[Math.floor(Math.random() * list.length)];
}

async function getCoordsFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error();
    const data = await response.json();
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: `${data.city}, ${data.region_code}`
    };
  } catch (e) {
    throw new Error("IP sensing failed");
  }
}

async function init() {
  // Start artificial sense delay
  const delay = new Promise(r => setTimeout(r, 1500));

  try {
    // Try to get location from IP first (more reliable, no scary prompt)
    const ipLocation = await getCoordsFromIP();
    await delay;

    const weather = await getWeather(ipLocation.latitude, ipLocation.longitude);
    renderDecision(weather, ipLocation.locationName);
  } catch (error) {
    console.log("IP sensing failed, falling back to manual entry");
    await delay;
    renderManualEntry();
  }
}

function renderManualEntry() {
  mainElement.classList.remove('loading');
  mainElement.innerHTML = `
    <div class="result-container manual-entry-view">
      <div class="verdict-box">
        <h1 class="decision" style="color: var(--color-accent); font-size: 3.5rem; letter-spacing: 0.1em;">LOCATION?</h1>
        <p class="flavor-text" style="opacity: 0.7; margin-bottom: 2rem;">The sensors can't see through the fog. Help us out.</p>
      </div>
      
      <div class="zip-form-container" style="max-width: 320px; margin: 0 auto;">
        <form class="zip-form" id="manual-zip-form">
          <div class="zip-input-group" style="padding: 0.25rem;">
            <input type="text" id="zip-input" class="zip-input" placeholder="Enter ZIP Code" maxlength="5" pattern="[0-9]*" inputmode="numeric" autofocus>
            <button type="submit" class="zip-submit" style="border-radius: 14px;">GO</button>
          </div>
        </form>
        <p style="font-size: 0.7rem; color: var(--color-text-dim); margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em;">Ad-blockers may be interfering with auto-sensing.</p>
      </div>
    </div>
  `;

  document.getElementById('manual-zip-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = document.getElementById('zip-input').value;
    handleZipSubmitManual(zip);
  });
}

function renderError(message) {
  mainElement.classList.remove('loading');
  mainElement.innerHTML = `
    <div class="result-container error-state">
      <h1 class="decision no" style="font-size: 4rem;">MISS</h1>
      <p class="flavor-text">${message}</p>
      
      <div class="zip-form-container" style="max-width: 320px; margin: 0 auto;">
        <form class="zip-form" id="manual-zip-form-retry">
          <div class="zip-input-group">
            <input type="text" id="zip-input-retry" class="zip-input" placeholder="Try another ZIP" maxlength="5" pattern="[0-9]*" inputmode="numeric">
            <button type="submit" class="zip-submit">GO</button>
          </div>
        </form>
      </div>

      <div class="or-divider">OR</div>
      
      <button class="action-btn" id="retry">Re-calibrate Sensors</button>
    </div>
  `;

  document.getElementById('manual-zip-form-retry')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = document.getElementById('zip-input-retry').value;
    handleZipSubmitManual(zip);
  });

  document.getElementById('retry')?.addEventListener('click', () => {
    showLoading("Re-syncing...");
    init();
  });
}

async function handleZipSubmitManual(zip) {
  if (!/^\d{5}$/.test(zip)) {
    alert("Invalid ZIP.");
    return;
  }
  showLoading("Sensing...");
  try {
    const { latitude, longitude, locationName } = await getCoordsFromZip(zip);
    const weather = await getWeather(latitude, longitude);
    renderDecision(weather, locationName);
  } catch (error) {
    renderError(error.message);
  }
}

async function handleZipSubmit(e) {
  e.preventDefault();
  const zip = document.getElementById('zip-input').value;
  handleZipSubmitManual(zip);
}

// Start sensing
init();
