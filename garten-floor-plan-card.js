/**
 * Garten Floor Plan Card
 * Moderne, interaktive Gartenkarte (Draufsicht) für Home Assistant.
 * Ebenen: Licht · Bewässerung · Mähen · Strom · Kameras
 */

const VERSION = "1.2.0";

// Koordinatensystem der Karte (Grundstück 490 x 855).
const W = 490;
const H = 855;

const DEFAULT_ENTITIES = {
  light_carport: "light.carport_2",
  light_kitchen: "light.outdoor_kuche",
  light_string: "light.led_bulb_string_lights",
  light_hut: "switch.shelly_licht",
  socket_hut: "switch.shelly_hutte_ausensteckdosen_switch_0",
  valve_haus: "switch.ventil_haus",
  valve_volleyball: "switch.ventil_volleyball",
  valve_bananen: "switch.ventil_bananen",
  progress_haus: "sensor.bewasserung_haus_fortschritt",
  progress_volleyball: "sensor.bewasserung_volleyball_fortschritt",
  progress_bananen: "sensor.bewasserung_bananen_fortschritt",
  flow_haus: "sensor.ventil_haus_flow",
  flow_volleyball: "sensor.ventil_volleyball_flow",
  flow_bananen: "sensor.ventil_bananen_flow",
  mower: "lawn_mower.aussen_leopard_2",
  mower_map: "sensor.leopard_2_live_map",
  mower_areas: "sensor.aussen_leopard_2_aktuelle_bereiche",
  mower_progress: "sensor.aussen_leopard_2_fortschritt",
  solar_power: "sensor.solarbank_3_e2700_pro_solarleistung",
  battery_soc: "sensor.solarbank_3_e2700_pro_ladestand",
  battery_charge: "sensor.solarbank_3_e2700_pro_aufladeleistung",
  battery_discharge: "sensor.solarbank_3_e2700_pro_entladeleistung",
  home_power: "sensor.system_solix_garten_hausbedarf",
  grid_import: "sensor.smart_meter_netzbezug",
  grid_export: "sensor.smart_meter_netzeinspeisung",
  pump: "switch.stecker_pumpe_switch_0",
  pump_power: "sensor.stecker_pumpe_switch_0_power",
  pool_pump: "switch.stecker_pool_neu",
  pool_power: "sensor.stecker_pool_neu_power",
  pool_runtime: "sensor.pool_laufzeit_formatiert",
};

// Verbraucher an der Hütte (Leitung vom Hausnetz-Knoten + Watt-Anzeige).
const DEFAULT_CONSUMERS = [
  { name: "Kühlschrank", entity: "sensor.shelly_kuhlschrank_power", icon: "mdi:fridge", x: 424, y: 246, path: "M334 256 H424 V252" },
  { name: "Starlink", entity: "sensor.starlink_leistung", icon: "mdi:satellite-variant", x: 407, y: 186, path: "M342 256 V200 H396" },
  { name: "Außensteckdose", entity: "sensor.shelly_hutte_ausensteckdosen_switch_0_power", icon: "mdi:power-socket-de", x: 306, y: 238, path: "M330 256 H306 V246" },
];

// Mähzonen nach der Skizze. Volleyball = großes Feld + Streifen + Ecke (wie in der Mäher-App),
// Parken = kleiner Bereich an der Ladestation.
const DEFAULT_MOW_ZONES = [
  { name: "Haus", select: "select.aussen_leopard_2_haus_vermeidungsmodus", label: [150, 190],
    points: [[5, 5], [291, 5], [291, 386], [5, 386]] },
  { name: "Zeltplatz", select: "select.aussen_leopard_2_zeltplatz_vermeidungsmodus", label: [425, 58],
    points: [[361, 5], [489, 5], [489, 108], [361, 108]] },
  { name: "Volleyball", select: "select.aussen_leopard_2_volleyball_vermeidungsmodus", label: [397, 540],
    points: [[304, 290], [489, 290], [489, 795], [158, 795], [158, 677], [223, 677], [223, 409], [304, 409]] },
  { name: "Parken", select: "select.aussen_leopard_2_parken_vermeidungsmodus", label: [262, 178],
    points: [[268, 192], [297, 192], [297, 224], [268, 224]] },
  { name: "Parkplatz hinten", select: "select.aussen_leopard_2_parkplatz_hinten_vermeidungsmodus", label: [75, 822],
    points: [[0, 785], [150, 785], [150, 855], [0, 855]] },
  { name: "Parkplatz", select: "select.aussen_leopard_2_parkplatz_vermeidungsmodus", label: [322, 832],
    points: [[155, 805], [489, 805], [489, 855], [155, 855]] },
];

// Abbildung Mäherkarte (mm) -> Plan (stückweise linear, an den Zonengrenzen der Skizze ausgerichtet).
const DEFAULT_MAP_POINTS = {
  x: [[-13800, 0], [-1350, 283], [0, 296], [5450, 490]],
  y: [[8700, 0], [3400, 108], [-2850, 290], [-22550, 795], [-25750, 855]],
};

const DEFAULT_CAMERAS = [
  { entity: "camera.haus", x: 312, y: 180 },
  { entity: "camera.schuppen", x: 421, y: 150 },
  { entity: "camera.pool", x: 56, y: 226 },
  { entity: "camera.outdoor_kuche", x: 206, y: 394 },
  { entity: "camera.carport", x: 26, y: 506 },
  { entity: "camera.parkplatz", x: 205, y: 830 },
  { entity: "camera.tor", x: 470, y: 812 },
  { entity: "camera.nussbaum", x: 250, y: 58 },
  { entity: "camera.baum_oben", x: 100, y: 22 },
];

const LAYERS = [
  { id: "lights", label: "Licht", icon: "mdi:lightbulb-group" },
  { id: "irrigation", label: "Bewässerung", icon: "mdi:sprinkler-variant" },
  { id: "mowing", label: "Mähen", icon: "mdi:robot-mower" },
  { id: "solar", label: "Strom", icon: "mdi:flash" },
  { id: "cameras", label: "Kameras", icon: "mdi:cctv" },
];

// Rohre: `feed` = Pumpe -> Ventil, `out` = Ventil -> Sprinkler.
const IRRIGATION_ZONES = [
  { key: "haus", name: "Haus", label: [200, 322], valve: [200, 360],
    points: [[112, 25], [288, 25], [288, 274], [484, 274], [484, 374], [112, 374]],
    feed: "M150 405 V380 H200 V372", out: ["M200 348 V200", "M212 360 H390 V334"], heads: [[200, 196], [390, 330]] },
  { key: "volleyball", name: "Volleyball", label: [355, 604], valve: [355, 640],
    points: [[226, 424], [484, 424], [484, 799], [226, 799]],
    feed: "M218 433 H355 V628", out: ["M355 652 V744", "M367 640 H440 V520"], heads: [[355, 748], [440, 516]] },
  { key: "bananen", name: "Bananen", label: [40, 452], valve: [96, 474],
    points: [[0, 388], [78, 388], [78, 472], [0, 472]],
    extra: [[[151, 464], [210, 464], [210, 654], [151, 654]]],
    feed: "M118 440 H96 V462", out: ["M84 474 H40 V432", "M108 474 H180 V540"], heads: [[40, 428], [180, 544]] },
];

// Objekte, die (wenn in `popups` konfiguriert) als Ganzes antippbar sind.
const HIT_AREAS = [
  { key: "hut", label: "Hütte", x: 299, y: 168, w: 146, h: 97 },
  { key: "pool", label: "Pool", x: 20, y: 234, w: 73, h: 126 },
  { key: "kitchen", label: "Outdoor-Küche", x: 118, y: 391, w: 100, h: 57 },
  { key: "carport", label: "Carport", x: 19, y: 500, w: 98, h: 148 },
  { key: "shed", label: "Schuppen", x: 397, y: 126, w: 48, h: 42 },
  { key: "raised_bed", label: "Hochbeet", x: 10, y: 687, w: 145, h: 95 },
];

const MOWER_STATES = {
  docked: "Geparkt", mowing: "Mäht", paused: "Pausiert",
  returning: "Fährt heim", error: "Fehler", unavailable: "Offline",
};
const AVOID_STATES = { normal: "Normal", tall_grass: "Hohes Gras", disabled: "Aus", off: "Aus" };

const pct = (v, total) => `${(v / total) * 100}%`;
const pts = (p) => p.map(([x, y]) => `${x},${y}`).join(" ");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class GartenFloorPlanCard extends HTMLElement {
  static getStubConfig() {
    return { title: "Garten" };
  }

  setConfig(config) {
    if (!config) throw new Error("Ungültige Konfiguration");
    this._config = {
      title: "Garten",
      layers: LAYERS.map((l) => l.id),
      show_labels: true,
      mower_position: { x: 296, y: 208 },
      map_points: DEFAULT_MAP_POINTS,
      ...config,
      entities: { ...DEFAULT_ENTITIES, ...(config.entities || {}) },
      popups: config.popups || {},
      consumers: config.consumers || DEFAULT_CONSUMERS,
      mow_zones: config.mow_zones || DEFAULT_MOW_ZONES,
      cameras: config.cameras || DEFAULT_CAMERAS,
    };
    this._active = new Set(this._config.active_layers || ["lights", "irrigation"]);
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._renderShell();
    if (this._hass) this._update(true);
  }

  set hass(hass) {
    this._hass = hass;
    if (this._popCard) this._popCard.hass = hass;
    this._update(false);
  }

  getCardSize() {
    return 14;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  // ---------- Helpers ----------
  _e(key) {
    return this._config.entities[key];
  }

  _st(id) {
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  _isOn(id) {
    const s = this._st(id);
    return !!s && ["on", "open", "opening", "mowing"].includes(s.state);
  }

  _num(id) {
    const s = this._st(id);
    const n = s ? parseFloat(s.state) : NaN;
    return Number.isFinite(n) ? n : null;
  }

  _name(id, fallback) {
    const s = this._st(id);
    return (s && s.attributes.friendly_name) || fallback || id;
  }

  _watched() {
    const ids = Object.values(this._config.entities);
    this._config.mow_zones.forEach((z) => z.select && ids.push(z.select));
    this._config.cameras.forEach((c) => ids.push(c.entity));
    this._config.consumers.forEach((c) => ids.push(c.entity));
    return ids;
  }

  // ---------- Rendering ----------
  _renderShell() {
    const layerChips = LAYERS.filter((l) => this._config.layers.includes(l.id))
      .map((l) => `<button class="chip layer" data-layer="${l.id}"><ha-icon icon="${l.icon}"></ha-icon><span>${l.label}</span></button>`)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <ha-card>
        <div class="head">
          <div class="title">
            <ha-icon icon="mdi:flower-tulip-outline"></ha-icon>
            <span>${esc(this._config.title)}</span>
          </div>
          <div class="stats" id="stats"></div>
        </div>
        <div class="layers">${layerChips}</div>
        <div class="map" id="map">
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${this._staticSvg()}
            <g id="dyn"></g>
            <g id="live"></g>
          </svg>
          <div class="markers" id="markers"></div>
        </div>
      </ha-card>
      <div class="pop" id="pop" hidden>
        <div class="pop-sheet" role="dialog" aria-modal="true">
          <div class="pop-head">
            <span class="pop-title" id="pop-title"></span>
            <button class="pop-x" id="pop-x" aria-label="Schließen"><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="pop-body" id="pop-body"></div>
        </div>
      </div>`;

    this.shadowRoot.querySelectorAll(".chip.layer").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.layer;
        this._active.has(id) ? this._active.delete(id) : this._active.add(id);
        this._update(true);
      })
    );
    this._bindMarkers(this.shadowRoot.getElementById("markers"));
    const pop = this.shadowRoot.getElementById("pop");
    pop.addEventListener("click", (ev) => {
      if (ev.target === pop) this._closePopup();
    });
    this.shadowRoot.getElementById("pop-x").addEventListener("click", () => this._closePopup());
  }

  _staticSvg() {
    const palm = (x, y, s = 1) => `
      <g transform="translate(${x} ${y}) scale(${s})" class="palm">
        ${[0, 45, 90, 135, 180, 225, 270, 315].map((r) => `<path transform="rotate(${r})" d="M0 0 C6 -6 14 -8 24 -4 C14 -3 7 -1 0 0Z"/>`).join("")}
        <circle r="3.5" class="palm-core"/>
      </g>`;
    const planks = (x, y, w, h, step = 9, vertical = true) => {
      let d = "";
      if (vertical) for (let i = x + step; i < x + w; i += step) d += `M${i} ${y + 2}V${y + h - 2}`;
      else for (let i = y + step; i < y + h; i += step) d += `M${x + 2} ${i}H${x + w - 2}`;
      return `<path class="plank" d="${d}"/>`;
    };
    const fire = (x, y, r) => `
      <g class="fire" transform="translate(${x} ${y})">
        <rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" rx="5" class="fire-ring"/>
        <circle r="${r * 0.55}" class="ember"/>
        <circle r="${r * 0.3}" class="ember-core"/>
      </g>`;

    return `
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1f3d2a"/>
          <stop offset="0.55" stop-color="#18321f"/>
          <stop offset="1" stop-color="#14291b"/>
        </linearGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
        </radialGradient>
        <pattern id="grassdots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="0.9" fill="#3c6b47" opacity=".45"/>
          <circle cx="12" cy="11" r="0.7" fill="#4a7d53" opacity=".35"/>
          <circle cx="7" cy="15" r="0.6" fill="#335c3d" opacity=".4"/>
        </pattern>
        <pattern id="pavers" width="16" height="10" patternUnits="userSpaceOnUse">
          <rect width="16" height="10" fill="#262b33"/>
          <rect x=".7" y=".7" width="6.6" height="3.6" rx="1" fill="#30363f"/>
          <rect x="8.7" y=".7" width="6.6" height="3.6" rx="1" fill="#2d333c"/>
          <rect x="-3.3" y="5.7" width="6.6" height="3.6" rx="1" fill="#2e343d"/>
          <rect x="4.7" y="5.7" width="6.6" height="3.6" rx="1" fill="#323842"/>
          <rect x="12.7" y="5.7" width="6.6" height="3.6" rx="1" fill="#2e343d"/>
        </pattern>
        <pattern id="mow" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <rect width="8" height="16" fill="#a3e635" opacity=".07"/>
        </pattern>
        <pattern id="soil" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#3d2b1f"/>
          <circle cx="3" cy="3" r="1" fill="#5a4030"/>
          <circle cx="9" cy="8" r="1.2" fill="#4c3626"/>
        </pattern>
        <pattern id="solarcells" width="12" height="18" patternUnits="userSpaceOnUse">
          <rect width="12" height="18" fill="#0b1f3a"/>
          <rect x=".8" y=".8" width="10.4" height="16.4" rx="1" fill="#14345f"/>
          <path d="M6 1V17M1 9H11" stroke="#1f4b85" stroke-width=".6"/>
        </pattern>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5ee1ff"/>
          <stop offset="1" stop-color="#1477d6"/>
        </linearGradient>
        <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4b5563"/>
          <stop offset="0.5" stop-color="#3a414c"/>
          <stop offset="0.5" stop-color="#2c323b"/>
          <stop offset="1" stop-color="#252a31"/>
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7a5a3c"/>
          <stop offset="1" stop-color="#6a4d33"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".45"/>
        </filter>
        <clipPath id="poolclip"><rect x="27" y="241" width="59" height="112" rx="4"/></clipPath>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
      </defs>

      <!-- Grundstück -->
      <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="url(#grass)"/>
      <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="url(#grassdots)"/>

      <!-- Parkplatz -->
      <path d="M0 805H${W}V${H - 18}Q${W} ${H} ${W - 18} ${H}H18Q0 ${H} 0 ${H - 18}Z" fill="url(#pavers)"/>
      <path d="M0 805H${W}" class="edge"/>

      <!-- Strohballen -->
      <g filter="url(#shadow)">
        <ellipse cx="41" cy="25" rx="36" ry="19" fill="#b08a3e"/>
        <path d="M14 20q14 -8 30 2t28 -2M12 28q16 -6 30 2t30 -2" stroke="#d9b45b" stroke-width="1.4" fill="none" opacity=".7"/>
      </g>

      <!-- Feuerstellen -->
      ${fire(199, 106, 22)}
      ${fire(144, 572, 14)}

      <!-- Hütte -->
      <g filter="url(#shadow)">
        <rect x="299" y="168" width="146" height="97" rx="6" fill="url(#roof)"/>
        <path d="M299 216.5H445" stroke="#5b6573" stroke-width="1.2"/>
        <rect x="402" y="188" width="10" height="10" rx="2" fill="#1b1f25" stroke="#6b7380"/>
        <rect x="338" y="232" width="14" height="14" rx="2" fill="#7dd3fc" opacity=".9"/>
      </g>
      <!-- Schuppen & Toilette -->
      <g filter="url(#shadow)">
        <rect x="397" y="126" width="48" height="42" rx="4" fill="url(#wood)"/>${planks(397, 126, 48, 42, 8, false)}
        <rect x="445" y="168" width="42" height="42" rx="4" fill="url(#wood)"/>${planks(445, 168, 42, 42, 8, false)}
      </g>

      <!-- Pool -->
      <g filter="url(#shadow)">
        <rect x="20" y="234" width="73" height="126" rx="6" fill="#59616d"/>
        <rect x="27" y="241" width="59" height="112" rx="4" fill="url(#water)"/>
        <path class="caustic" d="M32 262q10 -6 20 0t20 0t12 0M32 292q10 -6 20 0t20 0t12 0M32 322q10 -6 20 0t20 0t12 0" />
        <path d="M70 347v7M76 347v7" stroke="#d1d5db" stroke-width="1.4"/>
      </g>
      <!-- Poolfilter -->
      <g filter="url(#shadow)">
        <circle cx="104" cy="335" r="7" fill="#3b4250" stroke="#6b7380"/>
        <circle cx="104" cy="335" r="3" fill="#1f2937"/>
      </g>

      <!-- Outdoor-Küche -->
      <g filter="url(#shadow)">
        <rect x="118" y="391" width="100" height="57" rx="5" fill="url(#wood)" opacity=".9"/>${planks(118, 391, 100, 57, 9)}
        <rect x="131" y="405" width="26" height="24" rx="3" fill="#8a929c"/>
        <rect x="165" y="400" width="12" height="40" rx="3" fill="#20242a"/>
      </g>

      <!-- Anker Solix -->
      <g filter="url(#shadow)">
        <rect x="226" y="455" width="20" height="16" rx="3" fill="#1f2530" stroke="#4b5563"/>
        <rect x="229" y="458" width="14" height="3" rx="1.5" fill="#22c55e" opacity=".8"/>
      </g>

      <!-- Carport / Lounge -->
      <g filter="url(#shadow)">
        <rect x="19" y="500" width="98" height="148" rx="5" fill="url(#wood)" opacity=".85"/>${planks(19, 500, 98, 148, 10)}
        <path d="M33 530h16v95h28v14H33Z" fill="#e5e7eb" opacity=".9"/>
        <rect x="60" y="547" width="16" height="44" rx="3" fill="#4b5563"/>
      </g>

      <!-- Zaun -->
      <path d="M2 658H211V451" class="fence"/>
      <circle cx="211" cy="451" r="3.5" class="post"/><circle cx="211" cy="658" r="3.5" class="post"/><circle cx="2" cy="658" r="3.5" class="post"/>

      <!-- Palmen / Bananen -->
      ${palm(187, 498, 1.25)}${palm(193, 568, 1.3)}${palm(186, 632, 1.25)}${palm(40, 414, 1.2)}

      <!-- Hochbeet -->
      <g filter="url(#shadow)">
        <rect x="10" y="687" width="145" height="95" rx="5" fill="#c9a46a"/>
        <rect x="16" y="693" width="133" height="83" rx="3" fill="url(#soil)"/>
      </g>

      <!-- Auto -->
      <g transform="translate(8 811)" filter="url(#shadow)">
        <rect width="108" height="38" rx="12" fill="#cbd5e1"/>
        <rect x="26" y="5" width="56" height="28" rx="6" fill="#94a3b8"/>
        <rect x="30" y="8" width="16" height="22" rx="3" fill="#475569"/>
        <rect x="66" y="8" width="12" height="22" rx="3" fill="#475569"/>
      </g>

      <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="url(#vignette)" pointer-events="none"/>
      <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" class="border"/>

      ${this._config.show_labels ? `
      <g class="obj-label">
        <text x="372" y="160">Hütte</text>
        <text x="421" y="120">Schuppen</text>
        <text x="466" y="222">WC</text>
        <text x="56" y="228">Pool</text>
        <text x="168" y="462">Outdoor-Küche</text>
        <text x="68" y="664">Carport</text>
        <text x="82" y="798">Hochbeet</text>
      </g>` : ""}
    `;
  }

  // ---------- Fluss-Helfer ----------
  // Leitung mit wandernden Punkten; `speed` steuert die Geschwindigkeit (z. B. Watt).
  _flow(d, speed, kind, { reverse = false, min = 2 } = {}) {
    const on = speed !== null && speed > min;
    let out = `<path d="${d}" class="line ${kind} ${on ? "on" : ""}"/>`;
    if (!on) return out;
    const bucket = Math.min(10, Math.max(1, Math.round(Math.log2(speed + 1))));
    const dur = Math.max(0.6, 5.2 - bucket * 0.45);
    const n = bucket > 7 ? 4 : 3;
    const rev = reverse ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : "";
    for (let i = 0; i < n; i++) {
      out += `<circle r="2.4" class="dot ${kind}"><animateMotion dur="${dur.toFixed(2)}s" begin="${(-i * dur / n).toFixed(2)}s" repeatCount="indefinite" path="${d}"${rev}/></circle>`;
    }
    return out;
  }

  _bucket(v, min = 2) {
    return v === null || v <= min ? 0 : Math.min(10, Math.max(1, Math.round(Math.log2(v + 1))));
  }

  _poolOn() {
    const e = this._config.entities;
    const w = this._num(e.pool_power);
    return this._isOn(e.pool_pump) || (w !== null && w > 5);
  }

  _lpm(key) {
    const v = this._num(this._e(`flow_${key}`));
    return v === null ? null : (v * 1000) / 60;
  }

  // Werte, die die animierten Teile bestimmen (nur bei Änderung neu zeichnen, sonst ruckeln die Animationen).
  _dynSig() {
    const e = this._config.entities;
    const parts = [[...this._active].join(","), this._poolOn(), this._isOn(e.pump), this._st(e.mower) && this._st(e.mower).state];
    for (const z of IRRIGATION_ZONES) parts.push(this._isOn(e[`valve_${z.key}`]), this._bucket((this._lpm(z.key) || 0) * 15));
    for (const k of ["solar_power", "battery_charge", "battery_discharge", "home_power", "grid_import", "grid_export", "pump_power", "pool_power"]) parts.push(this._bucket(this._num(e[k])));
    for (const c of this._config.consumers) parts.push(this._bucket(this._num(c.entity)));
    for (const m of this._lightMarkers()) parts.push(this._isOn(m.entity), this._lightColor(m.entity));
    for (const z of this._config.mow_zones) parts.push(z.select && this._st(z.select) && this._st(z.select).state);
    parts.push(this._activeAreas().join("|"));
    return parts.join(";");
  }

  _dynSvg() {
    const a = this._active;
    const e = this._config.entities;
    let out = "";

    // Pool: Wasser zirkuliert, solange die Pumpe läuft
    if (this._poolOn()) {
      const pw = this._num(e.pool_power) || 60;
      out += `<g class="pool-run" clip-path="url(#poolclip)">
        <ellipse cx="56.5" cy="297" rx="21" ry="44" class="swirl"/>
        <ellipse cx="56.5" cy="297" rx="11" ry="26" class="swirl s2"/>
        ${[0, 1, 2, 3].map((i) => `<circle cx="${80 - i * 3}" cy="${336 - i * 2}" r="2" class="bubble" style="animation-delay:${i * 0.45}s"/>`).join("")}
      </g>`;
      out += this._flow("M86 320 H104 V328", pw, "water", { min: 0 });
      out += this._flow("M104 342 V350 H86", pw, "water", { min: 0 });
    }

    if (a.has("mowing")) {
      const mowing = this._isOn(e.mower);
      const activeAreas = this._activeAreas();
      out += `<g class="mow ${mowing ? "active" : ""}">`;
      for (const z of this._config.mow_zones) {
        const sel = this._st(z.select);
        const cur = activeAreas.includes(z.name);
        out += `<polygon points="${pts(z.points)}" class="mow-zone ${sel && sel.state !== "normal" ? "warn" : ""} ${cur ? "current" : ""}"/>`;
      }
      out += `</g>`;
    }

    if (a.has("irrigation")) {
      const pumpOn = this._isOn(e.pump);
      for (const z of IRRIGATION_ZONES) {
        const on = this._isOn(e[`valve_${z.key}`]);
        const lpm = this._lpm(z.key);
        const speed = on ? Math.max(lpm || 0, 12) * 15 : 0;
        const polys = [z.points, ...(z.extra || [])];
        out += `<g class="irr ${on ? "on" : ""}">`;
        polys.forEach((p) => (out += `<polygon points="${pts(p)}" class="irr-zone"/>`));
        out += this._flow(z.feed, on || pumpOn ? Math.max(speed, pumpOn ? 60 : 0) : 0, "water", { min: 0 });
        z.out.forEach((d) => (out += this._flow(d, speed, "water", { min: 0 })));
        z.heads.forEach(([x, y]) => {
          out += `<circle cx="${x}" cy="${y}" r="3" class="head"/>`;
          if (on) [0, 1, 2].forEach((i) => (out += `<circle cx="${x}" cy="${y}" r="6" class="ripple" style="animation-delay:${i * 0.8}s"/>`));
        });
        out += `</g>`;
      }
    }

    if (a.has("solar")) {
      const solar = this._num(e.solar_power) || 0;
      const lvl = Math.min(1, solar / 400);
      out += `<g class="solar" style="--sun:${0.25 + lvl * 0.75}">
        <rect x="23" y="504" width="90" height="140" rx="4" fill="url(#solarcells)" class="panel"/>
        <rect x="122" y="395" width="92" height="49" rx="4" fill="url(#solarcells)" class="panel"/>
        <rect x="23" y="504" width="90" height="140" rx="4" class="panel-shine"/>
        <rect x="122" y="395" width="92" height="49" rx="4" class="panel-shine"/>
      </g>`;
      // Solar -> Solix (Erzeugung auf beide Dächer aufgeteilt)
      out += this._flow("M100 504 V490 H236 V471", solar * 0.6, "power");
      out += this._flow("M206 444 V463 H226", solar * 0.4, "power");
      // Solix -> Hausnetz (Hütte)
      out += this._flow("M246 463 H268 V272 H334 V262", this._num(e.home_power), "power");
      // Netz <-> Hütte
      const imp = this._num(e.grid_import), exp = this._num(e.grid_export);
      if (imp !== null && imp > 2) out += this._flow("M489 252 H445", imp, "grid-in");
      else out += this._flow("M489 252 H445", exp, "grid-out", { reverse: true });
      // Verbraucher
      out += this._flow("M226 460 H150 V430", this._num(e.pump_power), "power");
      out += this._flow("M226 467 H104 V342", this._num(e.pool_power), "power");
      for (const c of this._config.consumers) if (c.path) out += this._flow(c.path, this._num(c.entity), "power");
    }

    // Lichtschein unter den Licht-Markern
    if (a.has("lights")) {
      for (const m of this._lightMarkers()) {
        if (m.r === 0 || !this._isOn(m.entity)) continue;
        out += `<circle cx="${m.x}" cy="${m.y}" r="${m.r || 34}" fill="${this._lightColor(m.entity)}" class="light-glow" filter="url(#glow)"/>`;
      }
    }

    return out;
  }

  // Beschriftungen und Mäherspur: ändern sich oft, enthalten keine Animationen.
  _liveSvg() {
    const a = this._active;
    const e = this._config.entities;
    let out = "";
    const tag = (x, y, name, sub, cls = "") =>
      `<g class="zone-tag ${cls}" transform="translate(${x} ${y})"><text class="zt-name" y="-2">${esc(name)}</text>${sub ? `<text class="zt-sub" y="11">${esc(sub)}</text>` : ""}</g>`;
    const val = (x, y, text, cls) => `<g class="val ${cls}" transform="translate(${x} ${y})"><text>${esc(text)}</text></g>`;
    const fmtW = (w) => (w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${Math.round(w)} W`);

    if (a.has("mowing")) {
      const map = this._st(e.mower_map);
      const areas = (map && map.attributes.areas) || [];
      const activeAreas = this._activeAreas();
      for (const z of this._config.mow_zones) {
        const p = z.points;
        const [x, y] = z.label || [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
        const sel = this._st(z.select);
        const area = areas.find((ar) => ar.name === z.name);
        const sub = [sel ? AVOID_STATES[sel.state] || sel.state : "", area && area.area_m2 ? `${Math.round(area.area_m2)} m²` : ""].filter(Boolean).join(" · ");
        out += tag(x, y, z.name, sub, activeAreas.includes(z.name) ? "cur" : "");
      }
      // Spur des aktuellen Mähvorgangs
      const trace = map && map.attributes.trace && map.attributes.trace.path;
      if (Array.isArray(trace) && trace.length > 1) {
        const tp = trace.map((q) => this._mapPoint(Array.isArray(q) ? q[0] : q.x, Array.isArray(q) ? q[1] : q.y));
        out += `<polyline points="${pts(tp)}" class="trace"/>`;
      }
      const dock = this._dockPos();
      out += `<g class="dock" transform="translate(${dock[0]} ${dock[1]})"><rect x="-6" y="-6" width="12" height="12" rx="3"/><path d="M-2 -3 L2 0 L-2 3" /></g>`;
    }

    if (a.has("irrigation")) {
      for (const z of IRRIGATION_ZONES) {
        const on = this._isOn(e[`valve_${z.key}`]);
        const prog = this._num(e[`progress_${z.key}`]);
        const lpm = this._lpm(z.key);
        const sub = on ? ["läuft", lpm ? `${lpm.toFixed(1)} l/min` : "", prog !== null ? `${Math.round(prog)} %` : ""].filter(Boolean).join(" · ") : "aus";
        out += tag(z.label[0], z.label[1], `💧 ${z.name}`, sub, `irr-tag ${on ? "on" : ""}`);
      }
    }

    if (a.has("solar")) {
      const n = (k) => this._num(e[k]);
      const home = n("home_power"), imp = n("grid_import"), exp = n("grid_export");
      if (home !== null && home > 2) out += val(268, 360, `⌂ ${fmtW(home)}`, "power");
      if (imp !== null && imp > 2) out += val(467, 245, `⚡ ${fmtW(imp)}`, "grid-in");
      else if (exp !== null && exp > 2) out += val(467, 245, `↗ ${fmtW(exp)}`, "grid-out");
      out += `<text x="486" y="266" class="edge-label">Netz</text>`;
    }
    return out;
  }

  // ---------- Mäherkarte ----------
  _activeAreas() {
    const e = this._config.entities;
    const cur = this._st(e.mower_areas);
    const map = this._st(e.mower_map);
    const ids = (cur && cur.attributes.area_ids) || [];
    const areas = (map && map.attributes.areas) || [];
    return ids.map((id) => {
      const ar = areas.find((x) => String(x.id) === String(id));
      return ar ? ar.name : String(id);
    });
  }

  _interp(v, table) {
    const t = [...table].sort((p, q) => p[0] - q[0]);
    if (v <= t[0][0]) return t[0][1];
    for (let i = 1; i < t.length; i++) {
      if (v <= t[i][0]) {
        const [a0, b0] = t[i - 1], [a1, b1] = t[i];
        return b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
      }
    }
    return t[t.length - 1][1];
  }

  _mapPoint(x, y) {
    const mp = this._config.map_points;
    return [Math.round(this._interp(x, mp.x) * 10) / 10, Math.round(this._interp(y, mp.y) * 10) / 10];
  }

  _dockPos() {
    const map = this._st(this._config.entities.mower_map);
    const cp = map && map.attributes.charge_positions && map.attributes.charge_positions[0];
    if (cp) return this._mapPoint(cp.x, cp.y);
    const p = this._config.mower_position;
    return [p.x, p.y];
  }

  _mowerPos() {
    const map = this._st(this._config.entities.mower_map);
    const cp = map && map.attributes.current_position;
    if (cp && !cp.invalid) return this._mapPoint(cp.x, cp.y);
    return this._dockPos();
  }

  _lightColor(id) {
    const s = this._st(id);
    const c = s && s.attributes.rgb_color;
    return c ? `rgb(${c.join(",")})` : "#ffcf6e";
  }

  _lightMarkers() {
    const e = this._config.entities;
    return [
      { entity: e.light_string, x: 299, y: 216, icon: "mdi:string-lights", key: "light_string", label: "Lichterkette", r: 44 },
      { entity: e.light_hut, x: 384, y: 206, icon: "mdi:ceiling-light", key: "light_hut", label: "Licht innen" },
      { entity: e.socket_hut, x: 312, y: 254, icon: "mdi:power-socket-de", key: "socket_hut", label: "Außensteckdose", r: 0 },
      { entity: e.light_kitchen, x: 192, y: 420, icon: "mdi:led-strip-variant", key: "light_kitchen", label: "Küche", r: 46 },
      { entity: e.light_carport, x: 68, y: 572, icon: "mdi:led-strip-variant", key: "light_carport", label: "Carport", r: 58 },
    ].filter((m) => m.entity);
  }

  _markersHtml() {
    const a = this._active;
    const e = this._config.entities;
    const mk = (m, cls, inner) =>
      `<button class="m ${cls}" style="left:${pct(m.x, W)};top:${pct(m.y, H)}" data-entity="${esc(m.entity)}" data-key="${esc(m.key || "")}" data-action="${m.action || "more-info"}" title="${esc(this._name(m.entity, m.label))}">${inner}</button>`;
    let out = "";

    // Unsichtbare Klickflächen für Objekte mit eigenem Pop-up
    for (const h of HIT_AREAS) {
      if (!this._config.popups[h.key]) continue;
      out += `<button class="m hit" style="left:${pct(h.x, W)};top:${pct(h.y, H)};width:${pct(h.w, W)};height:${pct(h.h, H)}" data-entity="" data-key="${h.key}" data-action="more-info" title="${esc(h.label)}"></button>`;
    }

    if (a.has("lights")) {
      for (const m of this._lightMarkers()) {
        const on = this._isOn(m.entity);
        const st = this._st(m.entity);
        out += mk({ ...m, action: "toggle" }, `light ${on ? "on" : ""} ${!st || st.state === "unavailable" ? "na" : ""}`,
          `<ha-icon icon="${m.icon}" style="${on ? `color:${this._lightColor(m.entity)}` : ""}"></ha-icon>`);
      }
    }

    if (a.has("irrigation") && e.pump) {
      const on = this._isOn(e.pump);
      out += mk({ entity: e.pump, key: "pump", x: 144, y: 417, label: "Hauswasserwerk", action: "more-info" },
        `pump ${on ? "on" : ""}`, `<ha-icon icon="mdi:water-pump"></ha-icon>`);
      for (const z of IRRIGATION_ZONES) {
        const id = e[`valve_${z.key}`];
        if (!id) continue;
        const on = this._isOn(id);
        out += mk({ entity: id, key: `valve_${z.key}`, x: z.valve[0], y: z.valve[1], label: `Ventil ${z.name}` },
          `valve ${on ? "on" : ""}`, `<ha-icon icon="${on ? "mdi:water" : "mdi:water-off-outline"}"></ha-icon>`);
      }
    }

    if (a.has("mowing") && e.mower) {
      const s = this._st(e.mower);
      const state = s ? s.state : "unavailable";
      let [mx, my] = this._mowerPos();
      mx = Math.min(W - 52, Math.max(52, mx));
      my = Math.min(H - 16, Math.max(16, my));
      const prog = this._num(e.mower_progress);
      const txt = `${MOWER_STATES[state] || state}${state === "mowing" && prog !== null ? ` · ${Math.round(prog)} %` : ""}`;
      out += mk({ entity: e.mower, key: "mower", x: mx, y: my, label: "Mäher" }, `mower ${state}`,
        `<ha-icon icon="mdi:robot-mower"></ha-icon><span class="bubble">${esc(txt)}</span>`);
    }

    if (a.has("solar")) {
      const w = this._num(e.solar_power);
      const soc = this._num(e.battery_soc);
      out += mk({ entity: e.solar_power, key: "solar", x: 68, y: 530, label: "Solar" }, "solar-badge",
        `<ha-icon icon="mdi:solar-power-variant"></ha-icon><span>${w !== null ? `${Math.round(w)} W` : "–"}</span>`);
      if (e.battery_soc) {
        const ch = this._num(e.battery_charge), dis = this._num(e.battery_discharge);
        const dir = ch !== null && ch > 2 ? `<span class="bdir in">▲ ${Math.round(ch)} W</span>` : dis !== null && dis > 2 ? `<span class="bdir out">▼ ${Math.round(dis)} W</span>` : "";
        out += mk({ entity: e.battery_soc, key: "battery", x: 262, y: 486, label: "Anker Solix" }, `solix ${soc !== null && soc < 20 ? "low" : ""}`,
          `<ha-icon icon="${ch > 2 ? "mdi:battery-charging" : this._batteryIcon(soc)}"></ha-icon><span>${soc !== null ? `${Math.round(soc)} %` : "–"}</span>${dir}`);
      }
      const extra = [
        { name: "Hauswasserwerk", entity: e.pump_power, icon: "mdi:water-pump", x: 192, y: 420 },
      ];
      for (const c of [...this._config.consumers, ...extra]) {
        if (!c.entity) continue;
        const cw = this._num(c.entity);
        if (cw === null) continue;
        out += mk({ entity: c.entity, key: `consumer:${c.entity}`, x: c.x, y: c.y, label: c.name }, `consumer ${cw > 2 ? "on" : ""}`,
          `<ha-icon icon="${c.icon || "mdi:flash"}"></ha-icon>${cw > 2 ? `<span>${Math.round(cw)} W</span>` : ""}`);
      }
    }

    if (a.has("cameras")) {
      for (const c of this._config.cameras) {
        if (!this._st(c.entity) && this._hass) continue;
        out += mk({ entity: c.entity, key: `camera:${c.entity}`, x: c.x, y: c.y, label: c.name }, "cam", `<ha-icon icon="mdi:cctv"></ha-icon>`);
      }
    }

    // Pool-Badge immer sichtbar
    if (e.pool_runtime && this._st(e.pool_runtime)) {
      const on = this._poolOn();
      const pw = this._num(e.pool_power);
      out += mk({ entity: e.pool_pump || e.pool_runtime, key: "pool", x: 74, y: 382, label: "Pool" }, `pool ${on ? "on" : ""}`,
        `<ha-icon icon="${on ? "mdi:pump" : "mdi:pool"}"></ha-icon><span>${on && pw ? `${Math.round(pw)} W · ` : ""}${esc(this._st(e.pool_runtime).state)}</span>`);
    }
    return out;
  }

  _batteryIcon(soc) {
    if (soc === null) return "mdi:battery-unknown";
    if (soc >= 95) return "mdi:battery";
    if (soc < 10) return "mdi:battery-outline";
    return `mdi:battery-${Math.floor(soc / 10) * 10}`;
  }

  _statsHtml() {
    const e = this._config.entities;
    const lights = this._lightMarkers().filter((m) => m.entity.startsWith("light.") || m.entity === e.light_hut);
    const lightsOn = lights.filter((m) => this._isOn(m.entity)).length;
    const valvesOn = IRRIGATION_ZONES.filter((z) => this._isOn(e[`valve_${z.key}`])).length;
    const mower = this._st(e.mower);
    const w = this._num(e.solar_power);
    const soc = this._num(e.battery_soc);
    const stat = (icon, val, cls = "") => `<div class="stat ${cls}"><ha-icon icon="${icon}"></ha-icon><span>${val}</span></div>`;
    return [
      stat("mdi:lightbulb-on-outline", `${lightsOn}/${lights.length}`, lightsOn ? "on-yellow" : ""),
      stat("mdi:sprinkler-variant", valvesOn ? `${valvesOn} aktiv` : "aus", valvesOn ? "on-blue" : ""),
      mower ? stat("mdi:robot-mower", MOWER_STATES[mower.state] || mower.state, mower.state === "mowing" ? "on-green" : mower.state === "error" ? "on-red" : "") : "",
      w !== null ? stat("mdi:solar-power-variant", `${Math.round(w)} W${soc !== null ? ` · ${Math.round(soc)} %` : ""}`, w > 20 ? "on-yellow" : "") : "",
    ].join("");
  }

  _update(force) {
    if (!this._config || !this.shadowRoot || !this._hass) return;
    const sig = this._watched().map((id) => {
      const s = this._hass.states[id];
      return s ? `${s.state}|${s.attributes.rgb_color || ""}|${s.last_updated || ""}` : "-";
    }).join(";") + [...this._active].join(",");
    if (!force && sig === this._sig) return;
    this._sig = sig;

    const root = this.shadowRoot;
    const dynSig = this._dynSig();
    if (force || dynSig !== this._dynSigLast) {
      this._dynSigLast = dynSig;
      root.getElementById("dyn").innerHTML = this._dynSvg();
    }
    root.getElementById("live").innerHTML = this._liveSvg();
    root.getElementById("markers").innerHTML = this._markersHtml();
    root.getElementById("stats").innerHTML = this._statsHtml();
    root.getElementById("map").className = `map ${[...this._active].map((l) => `l-${l}`).join(" ")} ${this._poolOn() ? "pool-on" : ""}`;
    root.querySelectorAll(".chip.layer").forEach((b) => b.classList.toggle("active", this._active.has(b.dataset.layer)));
  }

  // ---------- Interaktion ----------
  _bindMarkers(container) {
    let timer = null;
    let held = false;
    const target = (ev) => ev.composedPath().find((n) => n.classList && n.classList.contains("m"));

    container.addEventListener("pointerdown", (ev) => {
      const t = target(ev);
      if (!t) return;
      held = false;
      timer = setTimeout(() => {
        held = true;
        if (t.dataset.entity) this._moreInfo(t.dataset.entity);
      }, 500);
    });
    const cancel = () => clearTimeout(timer);
    container.addEventListener("pointerup", cancel);
    container.addEventListener("pointerleave", cancel);
    container.addEventListener("contextmenu", (ev) => {
      const t = target(ev);
      if (t) ev.preventDefault();
    });
    container.addEventListener("click", (ev) => {
      const t = target(ev);
      if (!t || held) return;
      const { entity, key, action } = t.dataset;
      const popup = this._config.tap_action !== "toggle" ? this._popupConfig(key, entity) : null;
      if (popup) this._openPopup(popup, entity, t.title);
      else if (action === "toggle") this._toggle(entity);
      else if (entity) this._moreInfo(entity);
    });
  }

  // ---------- Pop-ups ----------
  _popupConfig(key, entity) {
    const custom = key ? this._config.popups[key] : undefined;
    if (custom === false) return null;
    if (custom) return custom.card ? custom : { card: custom };
    if (!entity) return null;
    const domain = entity.split(".")[0];
    const has = (tag) => !!customElements.get(tag);
    if (domain === "light") {
      return { card: has("ha-light-card")
        ? { type: "custom:ha-light-card", entity }
        : { type: "tile", entity, features: [{ type: "light-brightness" }] } };
    }
    if (domain === "lawn_mower") {
      return { card: has("ha-mower-card")
        ? { type: "custom:ha-mower-card", entity }
        : { type: "tile", entity, features: [{ type: "lawn-mower-commands", commands: ["start_pause", "dock"] }] } };
    }
    if (domain === "camera") return { card: { type: "picture-entity", entity, camera_view: "live", show_state: false } };
    if (domain === "switch") return { card: { type: "tile", entity, features: [{ type: "toggle" }] } };
    return null;
  }

  async _openPopup(popup, entity, fallbackTitle) {
    const root = this.shadowRoot;
    const body = root.getElementById("pop-body");
    let card;
    try {
      const helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null;
      if (!helpers) throw new Error("no card helpers");
      card = await helpers.createCardElement(popup.card);
    } catch (err) {
      if (entity) this._moreInfo(entity);
      return;
    }
    card.hass = this._hass;
    body.replaceChildren(card);
    this._popCard = card;
    root.getElementById("pop-title").textContent = popup.title || (entity ? this._name(entity, fallbackTitle) : fallbackTitle) || "";
    const pop = root.getElementById("pop");
    pop.hidden = false;
    requestAnimationFrame(() => pop.classList.add("open"));
    this._escHandler = (ev) => ev.key === "Escape" && this._closePopup();
    window.addEventListener("keydown", this._escHandler);
    if (navigator.vibrate) navigator.vibrate(10);
  }

  _closePopup() {
    const pop = this.shadowRoot && this.shadowRoot.getElementById("pop");
    if (!pop || pop.hidden) return;
    pop.classList.remove("open");
    window.removeEventListener("keydown", this._escHandler);
    setTimeout(() => {
      pop.hidden = true;
      this.shadowRoot.getElementById("pop-body").replaceChildren();
      this._popCard = null;
    }, 220);
  }

  disconnectedCallback() {
    if (this._escHandler) window.removeEventListener("keydown", this._escHandler);
  }

  _toggle(entityId) {
    if (!this._hass || !entityId) return;
    this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
    if (navigator.vibrate) navigator.vibrate(20);
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}

const STYLE = `
  :host {
    display: block;
    --g-bg: #0d1511;
    --g-glass: rgba(22, 32, 27, 0.62);
    --g-border: rgba(255, 255, 255, 0.09);
    --g-text: #e8f0ea;
    --g-muted: rgba(232, 240, 234, 0.6);
    --g-yellow: #ffcf6e;
    --g-blue: #38bdf8;
    --g-green: #a3e635;
    --g-red: #f87171;
  }
  ha-icon { width: var(--mdc-icon-size, 24px); height: var(--mdc-icon-size, 24px); flex: 0 0 auto; }
  ha-card {
    display: block;
    background: radial-gradient(120% 80% at 0% 0%, #17261d 0%, var(--g-bg) 60%);
    color: var(--g-text);
    border-radius: var(--ha-card-border-radius, 22px);
    border: 1px solid var(--g-border);
    padding: 14px;
    overflow: hidden;
    font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, system-ui, sans-serif));
  }
  .head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .title { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; font-weight: 600; letter-spacing: .2px; }
  .title ha-icon { color: var(--g-green); --mdc-icon-size: 24px; }
  .stats { display: flex; flex-wrap: wrap; gap: 6px; }
  .stat {
    display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px;
    background: rgba(255,255,255,.05); border: 1px solid var(--g-border); font-size: .78rem; color: var(--g-muted);
  }
  .stat ha-icon { --mdc-icon-size: 16px; }
  .stat.on-yellow { color: var(--g-yellow); border-color: rgba(255,207,110,.3); background: rgba(255,207,110,.08); }
  .stat.on-blue { color: var(--g-blue); border-color: rgba(56,189,248,.3); background: rgba(56,189,248,.08); }
  .stat.on-green { color: var(--g-green); border-color: rgba(163,230,53,.3); background: rgba(163,230,53,.08); }
  .stat.on-red { color: var(--g-red); border-color: rgba(248,113,113,.35); background: rgba(248,113,113,.1); }

  .layers { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
  .layers::-webkit-scrollbar { display: none; }
  .chip {
    flex: 0 0 auto; display: flex; align-items: center; gap: 6px; cursor: pointer;
    padding: 7px 12px; border-radius: 12px; font: inherit; font-size: .8rem; color: var(--g-muted);
    background: rgba(255,255,255,.04); border: 1px solid var(--g-border); transition: all .2s ease;
  }
  .chip ha-icon { --mdc-icon-size: 17px; }
  .chip:hover { background: rgba(255,255,255,.08); }
  .chip.active { color: #0d1511; background: var(--g-green); border-color: transparent; font-weight: 600; }
  .chip.active[data-layer="lights"] { background: var(--g-yellow); }
  .chip.active[data-layer="irrigation"] { background: var(--g-blue); }
  .chip.active[data-layer="solar"] { background: #fbbf24; }
  .chip.active[data-layer="cameras"] { background: #c4b5fd; }

  .map { position: relative; width: 100%; aspect-ratio: ${W} / ${H}; }
  .map svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .markers { position: absolute; inset: 0; }

  /* Statische Objekte */
  .edge { stroke: rgba(255,255,255,.08); stroke-width: 1; }
  .border { fill: none; stroke: rgba(255,255,255,.1); }
  .plank { stroke: rgba(0,0,0,.22); stroke-width: 1; fill: none; }
  .fence { fill: none; stroke: #8b6b4e; stroke-width: 3; stroke-linecap: round; }
  .post { fill: #a0805f; }
  .palm path { fill: #3f8f3a; stroke: #2d6b2a; stroke-width: .6; }
  .palm .palm-core { fill: #5a3e25; }
  .fire-ring { fill: #3b2a20; stroke: #b4472b; stroke-width: 2.5; }
  .ember { fill: #ff7a2f; opacity: .55; animation: flicker 2.4s infinite ease-in-out; }
  .ember-core { fill: #ffd27a; opacity: .7; animation: flicker 1.7s infinite ease-in-out reverse; }
  .caustic { fill: none; stroke: rgba(255,255,255,.35); stroke-width: 1.4; stroke-linecap: round; animation: shimmer 4s infinite ease-in-out; }
  .obj-label text { fill: rgba(232,240,234,.55); font-size: 10px; font-weight: 600; letter-spacing: .6px; text-anchor: middle; text-transform: uppercase; }

  /* Mähzonen */
  .mow-zone { fill: url(#mow); stroke: rgba(163,230,53,.55); stroke-width: 1.5; stroke-dasharray: 6 5; }
  .mow-zone.warn { stroke: rgba(251,191,36,.7); }
  .mow.active .mow-zone { animation: dash 1.2s linear infinite; stroke: rgba(163,230,53,.9); }
  .zone-tag text { text-anchor: middle; paint-order: stroke; stroke: rgba(10,18,13,.85); stroke-width: 3px; stroke-linejoin: round; }
  .zt-name { fill: var(--g-text); font-size: 11px; font-weight: 700; }
  .zt-sub { fill: var(--g-muted); font-size: 9px; }

  /* Bewässerung */
  .irr-zone { fill: rgba(56,189,248,.06); stroke: rgba(56,189,248,.45); stroke-width: 1.5; stroke-dasharray: 3 4; }
  .irr.on .irr-zone { fill: rgba(56,189,248,.18); stroke: rgba(56,189,248,.95); stroke-dasharray: none; }
  .irr.on .zt-sub { fill: var(--g-blue); }
  .ripple { fill: none; stroke: rgba(125,211,252,.8); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: ripple 2.4s infinite ease-out; opacity: 0; }

  /* Solar */
  .panel { opacity: .92; }
  .panel-shine { fill: rgba(255, 214, 102, var(--sun)); mix-blend-mode: soft-light; animation: sun 5s infinite ease-in-out; pointer-events: none; }

  /* Leitungen & Fluss */
  .line { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; opacity: .16; stroke: #e5e7eb; }
  .line.power { stroke: #fbbf24; }
  .line.water { stroke: #38bdf8; }
  .line.grid-in { stroke: #f87171; }
  .line.grid-out { stroke: #4ade80; }
  .line.on { opacity: .85; stroke-width: 2.6; }
  .line.power.on { filter: drop-shadow(0 0 3px rgba(251,191,36,.8)); }
  .line.water.on { filter: drop-shadow(0 0 3px rgba(56,189,248,.8)); }
  .line.grid-in.on { filter: drop-shadow(0 0 3px rgba(248,113,113,.8)); }
  .line.grid-out.on { filter: drop-shadow(0 0 3px rgba(74,222,128,.8)); }
  .dot.power { fill: #fff3c4; }
  .dot.water { fill: #e0f7ff; }
  .dot.grid-in { fill: #fecaca; }
  .dot.grid-out { fill: #bbf7d0; }
  .head { fill: #0c4a6e; stroke: #38bdf8; stroke-width: 1.2; }
  .val text { font-size: 10px; font-weight: 700; text-anchor: middle; paint-order: stroke; stroke: rgba(10,18,13,.9); stroke-width: 3px; }
  .val.power text { fill: #fde68a; }
  .val.grid-in text { fill: #fca5a5; }
  .val.grid-out text { fill: #86efac; }
  .edge-label { fill: rgba(232,240,234,.55); font-size: 9px; font-weight: 700; text-anchor: end; letter-spacing: .6px; text-transform: uppercase; }

  /* Pool läuft */
  .swirl { fill: none; stroke: rgba(255,255,255,.55); stroke-width: 1.6; stroke-dasharray: 12 16; animation: dash 1.4s linear infinite; }
  .swirl.s2 { stroke-dasharray: 8 12; animation-duration: 1s; animation-direction: reverse; opacity: .7; }
  .bubble { fill: rgba(255,255,255,.85); animation: bubble 1.8s infinite ease-out; opacity: 0; }
  .map.pool-on .caustic { animation-duration: 1.1s; stroke: rgba(255,255,255,.6); }

  /* Mäher */
  .mow-zone.current { fill: rgba(163,230,53,.16); stroke: rgba(163,230,53,1); stroke-width: 2.2; }
  .zone-tag.cur .zt-name { fill: var(--g-green); }
  .trace { fill: none; stroke: rgba(163,230,53,.75); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 2px rgba(163,230,53,.7)); }
  .dock rect { fill: #1f2937; stroke: var(--g-green); stroke-width: 1.2; }
  .dock path { fill: none; stroke: var(--g-green); stroke-width: 1.4; }

  .light-glow { opacity: .55; animation: breathe 3.5s infinite ease-in-out; pointer-events: none; }

  /* Marker */
  .m {
    position: absolute; transform: translate(-50%, -50%);
    display: flex; align-items: center; gap: 4px;
    min-width: 34px; height: 34px; padding: 0 8px; border-radius: 999px; cursor: pointer;
    color: var(--g-text); font: inherit; font-size: .72rem; font-weight: 600; white-space: nowrap;
    background: var(--g-glass); border: 1px solid var(--g-border);
    backdrop-filter: blur(10px) saturate(140%); -webkit-backdrop-filter: blur(10px) saturate(140%);
    box-shadow: 0 6px 18px rgba(0,0,0,.35);
    transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
    justify-content: center; -webkit-tap-highlight-color: transparent; user-select: none;
  }
  .m:hover { transform: translate(-50%, -50%) scale(1.08); }
  .m:active { transform: translate(-50%, -50%) scale(.95); }
  .m ha-icon { --mdc-icon-size: 18px; display: flex; flex: 0 0 auto; }
  .m.light { padding: 0; width: 34px; }
  .m.light ha-icon { color: var(--g-muted); }
  .m.light.on { background: rgba(255,207,110,.18); border-color: rgba(255,207,110,.55); box-shadow: 0 0 18px rgba(255,207,110,.45); }
  .m.na { opacity: .45; }
  .m.valve { width: 30px; height: 30px; min-width: 30px; padding: 0; color: var(--g-muted); }
  .m.valve.on { color: #fff; background: rgba(56,189,248,.55); border-color: rgba(125,211,252,.9); box-shadow: 0 0 16px rgba(56,189,248,.6); }
  .m.pump { width: 30px; height: 30px; min-width: 30px; padding: 0; color: var(--g-muted); }
  .m.pump.on { color: var(--g-blue); border-color: rgba(56,189,248,.7); animation: pulse 1.6s infinite; }
  .m.mower { color: var(--g-muted); }
  .m.mower.mowing { color: #0d1511; background: var(--g-green); border-color: transparent; animation: pulse-g 1.8s infinite; }
  .m.mower.error { color: #fff; background: rgba(248,113,113,.7); }
  .m.mower.returning, .m.mower.paused { color: #fbbf24; }
  .m .bubble { font-weight: 600; }
  .m.solar-badge, .m.solix { color: #fde68a; }
  .m.solix.low { color: var(--g-red); }
  .m.cam { width: 28px; height: 28px; min-width: 28px; padding: 0; color: #c4b5fd; }
  .m.cam ha-icon { --mdc-icon-size: 15px; }
  .m.pool { color: #7dd3fc; font-size: .66rem; height: 28px; }
  .m.pool.on { background: rgba(56,189,248,.35); border-color: rgba(125,211,252,.8); color: #fff; animation: pulse 1.8s infinite; }
  .m.mower { transition: left 1.2s linear, top 1.2s linear, transform .15s ease; }
  .m.consumer { height: 26px; min-width: 26px; padding: 0 6px; font-size: .64rem; color: var(--g-muted); }
  .m.consumer ha-icon { --mdc-icon-size: 14px; }
  .m.consumer.on { color: #fde68a; border-color: rgba(251,191,36,.5); }
  .m .bdir { font-size: .62rem; font-weight: 700; }
  .m .bdir.in { color: #4ade80; }
  .m .bdir.out { color: #fbbf24; }
  .m.pool ha-icon { --mdc-icon-size: 15px; }

  .m.hit { transform: none; background: transparent; border: 0; box-shadow: none; border-radius: 8px; padding: 0; min-width: 0; backdrop-filter: none; -webkit-backdrop-filter: none; }
  .m.hit:hover { transform: none; background: rgba(255,255,255,.06); }
  .m.hit:active { transform: none; background: rgba(255,255,255,.1); }

  /* Pop-up */
  .pop {
    position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;
    background: rgba(4, 8, 6, 0); backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0);
    transition: background .22s ease, backdrop-filter .22s ease;
  }
  .pop[hidden] { display: none; }
  .pop.open { background: rgba(4, 8, 6, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
  .pop-sheet {
    width: min(520px, calc(100vw - 24px)); max-height: calc(100vh - 48px); overflow: auto;
    background: rgba(16, 24, 20, .92); color: var(--g-text);
    border: 1px solid var(--g-border); border-radius: 24px; padding: 14px;
    box-shadow: 0 24px 60px rgba(0,0,0,.55);
    transform: translateY(24px) scale(.97); opacity: 0; transition: transform .22s ease, opacity .22s ease;
    overscroll-behavior: contain;
  }
  .pop.open .pop-sheet { transform: none; opacity: 1; }
  .pop-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 2px 4px 12px; }
  .pop-title { font-size: 1.05rem; font-weight: 600; }
  .pop-x {
    display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%;
    border: 1px solid var(--g-border); background: rgba(255,255,255,.06); color: var(--g-text); cursor: pointer;
  }
  .pop-x ha-icon { --mdc-icon-size: 18px; }
  @media (max-width: 600px) {
    .pop { align-items: flex-end; }
    .pop-sheet { width: 100vw; max-height: 88vh; border-radius: 24px 24px 0 0; padding-bottom: calc(14px + env(safe-area-inset-bottom)); transform: translateY(100%); opacity: 1; }
    .pop-sheet::before { content: ""; display: block; width: 40px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.25); margin: 0 auto 10px; }
  }

  @keyframes flicker { 0%,100% { opacity: .45; } 50% { opacity: .85; } }
  @keyframes shimmer { 0%,100% { transform: translateX(0); opacity: .5; } 50% { transform: translateX(3px); opacity: .9; } }
  @keyframes dash { to { stroke-dashoffset: -22; } }
  @keyframes ripple { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(5); opacity: 0; } }
  @keyframes bubble { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: .9; } 100% { transform: translateY(-26px); opacity: 0; } }
  @keyframes breathe { 0%,100% { opacity: .4; } 50% { opacity: .65; } }
  @keyframes sun { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(56,189,248,.55); } 100% { box-shadow: 0 0 0 14px rgba(56,189,248,0); } }
  @keyframes pulse-g { 0% { box-shadow: 0 0 0 0 rgba(163,230,53,.6); } 100% { box-shadow: 0 0 0 16px rgba(163,230,53,0); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  @media (max-width: 420px) { .m { height: 28px; min-width: 28px; font-size: .64rem; } .m.light { width: 28px; } .m ha-icon { --mdc-icon-size: 15px; } }
`;

if (!customElements.get("garten-floor-plan-card")) {
  customElements.define("garten-floor-plan-card", GartenFloorPlanCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "garten-floor-plan-card")) {
  window.customCards.push({
    type: "garten-floor-plan-card",
    name: "Garten Floor Plan Card",
    description: "Interaktive Gartenkarte mit Licht, Bewässerung, Mähzonen, Solar und Kameras.",
    preview: true,
  });
}

console.info(`%c GARTEN-FLOOR-PLAN-CARD %c v${VERSION} `, "background:#a3e635;color:#0d1511;font-weight:700", "background:#18321f;color:#e8f0ea");
