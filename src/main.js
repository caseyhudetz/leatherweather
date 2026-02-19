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

async function init() {
  try {
    const position = await getPosition();
    const { latitude, longitude } = position.coords;

    // Add artificial delay for "sensing" effect
    await new Promise(r => setTimeout(r, 1500));

    const [weather, locationName] = await Promise.all([
      getWeather(latitude, longitude),
      getLocationName(latitude, longitude)
    ]);

    renderDecision(weather, locationName);
  } catch (error) {
    console.error(error);
    renderError(error.message || "The sensors are clogged with lint.");
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser is too old for this wisdom."));
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      if (err.code === 1) {
        reject(new Error("Permission denied. We can't sniff the air if you're holding your nose!"));
      } else {
        reject(new Error("Lost signal. Is there a giant magnet nearby?"));
      }
    });
  });
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&temperature_unit=fahrenheit`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("The weather gods are offline.");
  const data = await response.json();
  return data.current;
}

async function getLocationName(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const response = await fetch(url);
    const data = await response.json();
    return data.address.city || data.address.town || data.address.village || "Unknown Territory";
  } catch (e) {
    return "The Wilds";
  }
}

function getDecision(weather) {
  const temp = weather.temperature_2m;
  const rain = weather.precipitation;

  if (rain > 0) return { status: 'NO', type: 'RAIN' };
  if (temp > 78) return { status: 'NO', type: 'TOO_HOT' };
  if (temp < 45) return { status: 'NO', type: 'TOO_COLD' };

  return { status: 'YES', type: 'YES' };
}

function renderDecision(weather, locationName) {
  const decision = getDecision(weather);
  const message = getRandomMessage(decision.type);

  mainElement.classList.remove('loading');
  mainElement.innerHTML = `
    <div class="result-container">
      <div class="location-chip">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        Sensors active in ${locationName}
      </div>
      
      <div class="verdict-box">
        <h1 class="decision ${decision.status.toLowerCase()}">${decision.status}</h1>
        <p class="flavor-text">${message}</p>
      </div>
      
      <div class="details-grid">
        <div class="detail-card">
          <label>Atmosphere</label>
          <span>${Math.round(weather.temperature_2m)}°F</span>
        </div>
        <div class="detail-card">
          <label>Hydration</label>
          <span>${weather.precipitation > 0 ? 'High' : 'None'}</span>
        </div>
      </div>
      
      <div class="rationale">
        <strong>The Scientific Logic</strong>
        <p>Leather is essentially a highly aesthetic second skin. Our algorithms determined that at ${Math.round(weather.temperature_2m)}°F, your ${decision.status === 'YES' ? 'swagger will be optimal' : 'internal temperature will reach critical levels'}.</p>
      </div>
      
      <button class="action-btn" id="re-sense">Calibrate Again</button>
    </div>
  `;

  document.getElementById('re-sense')?.addEventListener('click', () => {
    showLoading("Re-calibrating hide sensors...");
    init();
  });
}

async function getCoordsFromZip(zip) {
  try {
    const url = `https://api.zippopotam.us/us/${zip}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("That ZIP code doesn't smell right.");
    const data = await response.json();
    return {
      latitude: parseFloat(data.places[0].latitude),
      longitude: parseFloat(data.places[0].longitude),
      locationName: `${data.places[0]['place name']}, ${data.places[0]['state abbreviation']}`
    };
  } catch (e) {
    throw new Error("Could not find that ZIP. Maybe it's not a real place?");
  }
}

async function handleZipSubmit(e) {
  e.preventDefault();
  const zipInput = document.getElementById('zip-input');
  const zip = zipInput.value.trim();

  if (!zip || !/^\d{5}$/.test(zip)) {
    alert("Please enter a valid 5-digit ZIP code.");
    return;
  }

  showLoading("Sensing via ZIP code...");

  try {
    const { latitude, longitude, locationName } = await getCoordsFromZip(zip);
    const weather = await getWeather(latitude, longitude);
    renderDecision(weather, locationName);
  } catch (error) {
    renderError(error.message);
  }
}

function showLoading(text) {
  mainElement.classList.add('loading');
  mainElement.innerHTML = `
    <div class="loader-container">
      <div class="leather-orb">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-accent); opacity: 0.8;">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <div class="sensing-text">${text}</div>
    </div>
  `;
}

function renderError(message) {
  const isPermissionError = message.includes("Permission denied");

  mainElement.classList.remove('loading');
  mainElement.innerHTML = `
    <div class="result-container error-state">
      <h1 class="decision no">HICCUP</h1>
      <p class="flavor-text">${message}</p>
      
      <div class="zip-form-container">
        <p class="sensing-text">Or just type your ZIP code below:</p>
        <form class="zip-form" id="manual-zip-form">
          <div class="zip-input-group">
            <input type="text" id="zip-input" class="zip-input" placeholder="Enter ZIP (e.g. 90210)" maxlength="5" pattern="[0-9]*" inputmode="numeric">
            <button type="submit" class="zip-submit">GO</button>
          </div>
        </form>
      </div>

      <div class="or-divider">OR</div>
      
      <button class="action-btn" id="retry">Try Auto-Sensing Again</button>

      ${isPermissionError ? `
        <div class="rationale" style="margin-top: 2rem;">
          <strong>Pro Tip</strong>
          <p>Click the 🔒 icon in your browser's address bar and set Location to "Allow" to enable automatic sensing.</p>
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById('manual-zip-form')?.addEventListener('submit', handleZipSubmit);

  document.getElementById('retry')?.addEventListener('click', () => {
    showLoading("Attempting re-sync...");
    init();
  });
}

// Start sensing automatically
init();
