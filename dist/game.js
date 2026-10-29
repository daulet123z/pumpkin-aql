import { weighPumpkin } from "./pumpkin.js";
const $ = (id) => document.getElementById(id);
const items = [
  {
    name: "Helping hand",
    icon: "assets/helper-hand.png",
    desc: "Invite the neighbour.",
    cost: 15,
    tap: 0.1,
  },
  {
    name: "Connect the hose",
    icon: "assets/helper-hose.png",
    desc: "Water is the source of life.",
    cost: 45,
    rate: 0.1,
  },
  {
    name: "Sun exposure",
    icon: "assets/helper-sun.png",
    desc: "Get that photosynthesis going.",
    cost: 100,
    rate: 0.25,
  },
  {
    name: "Add fertilizer",
    icon: "assets/helper-fertilizer.png",
    desc: "A sprinkle of cheating.",
    cost: 280,
    rate: 0.5,
  },
  {
    name: "Ask grandpa",
    icon: "assets/helper-grandpa.png",
    desc: "We need his expertise.",
    cost: 500,
    rate: 1,
  },
];
let state = {
  weight: 0,
  taps: 0,
  earned: 0,
  owned: items.map(() => 0),
  saved: Date.now(),
};
let sound = false,
  audio;
try {
  const saved = JSON.parse(localStorage.getItem("pumpkin-patch-v1"));
  if (
    saved &&
    Number.isFinite(saved.weight) &&
    saved.weight >= 0 &&
    Array.isArray(saved.owned) &&
    saved.owned.length === 5 &&
    saved.owned.every((n) => Number.isInteger(n) && n >= 0) &&
    ["taps", "earned", "saved"].every(
      (k) => Number.isFinite(saved[k]) && saved[k] >= 0,
    )
  )
    state = {
      weight: saved.weight,
      taps: saved.taps,
      earned: saved.earned,
      owned: saved.owned,
      saved: saved.saved,
    };
} catch {}
const POUNDS_PER_SLICE = 1;
const slices = () => state.weight / POUNDS_PER_SLICE;

const totalMultiplier = (count) => (count * (count + 1)) / 2;
const tap = () => 0.1 + items[0].tap * totalMultiplier(state.owned[0]);
const helperYield = (item, count) => item.rate * totalMultiplier(count);
const rate = () =>
  items.reduce(
    (sum, item, i) => sum + (item.rate ? helperYield(item, state.owned[i]) : 0),
    0,
  );
const cost = (i) => Math.ceil(items[i].cost * 1.6 ** state.owned[i]);
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: n < 1 ? 3 : n < 100 ? 2 : 1,
  }).format(n);
function upgradeBenefit(item, i) {
  if (item.tap) return `+${fmt(item.tap * (state.owned[i] + 1))} lb / tap`;
  const gain = item.rate * (state.owned[i] + 1);
  return `+${fmt(gain)} lb / sec`;
}
function add(n) {
  state.weight += n;
  state.earned += n;
}
add(rate() * Math.min(28800, Math.max(0, (Date.now() - state.saved) / 1000)));
$("upgrades").innerHTML = items
  .map(
    (item, i) =>
      `<button class="upgrade" data-item="${i}" title="${item.desc}"><img class="upgrade-icon" src="${item.icon}" alt=""><span class="upgrade-copy"><span class="upgrade-name">${item.name}</span><span class="owned" id="owned-${i}"></span><span class="upgrade-desc" id="benefit-${i}">${upgradeBenefit(item, i)}</span></span><span class="price" id="price-${i}"></span></button>`,
  )
  .join("");
// Interpolate between category milestones; cap the size to keep it in the patch.
function pumpkinScale(weight) {
  const milestones = [
    [0, 0.45],
    [10, 0.6],
    [50, 0.85],
    [1000, 0.9],
    [2500, 1],
  ];
  const pounds = Math.max(0, weight);
  for (let i = 1; i < milestones.length; i++) {
    const [upperWeight, upperScale] = milestones[i];
    const [lowerWeight, lowerScale] = milestones[i - 1];
    if (pounds < upperWeight) {
      const progress = (pounds - lowerWeight) / (upperWeight - lowerWeight);
      return lowerScale + progress * (upperScale - lowerScale);
    }
  }
  return 1;
}

const categoryImages = {
  Mini: "assets/badge-mini.png",
  Carving: "assets/badge-carving.png",
  Giant: "assets/badge-giant.png",
  "Record Breaker!": "assets/badge-record.png",
};
const badges = [
  ["Mini", 0],
  ["Carving", 10],
  ["Giant", 50],
  ["Record Breaker!", 1000],
];

function render() {
  $("weight").textContent = fmt(state.weight);
  $("slices").textContent = fmt(slices());
  $("rate").textContent = fmt(rate());
  $("tap-value").textContent =
    `${fmt(tap())} lb / tap`;
  const category = weighPumpkin(state.weight);
  document.querySelectorAll("[data-category]").forEach((label) => {
    label.textContent = category;
  });
  document.querySelectorAll("[data-category-image]").forEach((image) => {
    if (image.getAttribute("src") !== categoryImages[category]) image.src = categoryImages[category];
  });
  $("grow").style.setProperty("--pumpkin-scale", pumpkinScale(state.weight));
  const next = [10, 50, 1000].find((n) => state.weight < n);
  const lower = state.weight < 10 ? 0 : state.weight < 50 ? 10 : 50;
  const nextLabel = next
    ? `Next: ${weighPumpkin(next)} at ${next.toLocaleString()} lbs`
    : "The pride of the pumpkin patch!";
  document.querySelectorAll("[data-next-label]").forEach((label) => {
    label.textContent = nextLabel;
  });
  const progress = next ? (100 * (state.weight - lower)) / (next - lower) : 100;
  document.querySelectorAll("[data-progress]").forEach((bar) => {
    bar.style.width = `${progress}%`;
    bar.parentElement.setAttribute("aria-valuenow", Math.round(progress));
    bar.parentElement.setAttribute("aria-valuetext", nextLabel);
  });
  items.forEach((_, i) => {
    document.querySelector(`[data-item="${i}"]`).disabled = slices() < cost(i);
    $("price-" + i).textContent = `${cost(i).toLocaleString("en-US")} slices`;
    $("price-" + i).title =
      `Removes ${fmt(cost(i) * POUNDS_PER_SLICE)} lb from your pumpkin`;
    $("benefit-" + i).textContent = upgradeBenefit(items[i], i);
    $("owned-" + i).textContent = `× ${state.owned[i]}`;
  });
  $("total-taps").textContent = fmt(state.taps);
  $("total-slices").textContent = Math.floor(
    (state.earned + 1e-9) / POUNDS_PER_SLICE,
  ).toLocaleString("en-US");
  const helperCount = state.owned.reduce((a, b) => a + b, 0);
  $("helpers").textContent = helperCount;
  $("helper-count").textContent = items.filter((_, i) => slices() >= cost(i)).length;
  $("badge-count").textContent = badges.filter(([, min]) => state.weight >= min).length;
  $("badges").innerHTML = badges
    .map(
      ([name, min]) =>
        `<li class="badge ${state.weight >= min ? "earned" : ""}"><img class="badge-icon" src="${categoryImages[name]}" alt=""><strong>${name}</strong><small>${min.toLocaleString()}+ lbs</small><span class="badge-status">${state.weight >= min ? "Earned" : "Locked"}</span></li>`,
    )
    .join("");
}
function save() {
  state.saved = Date.now();
  try {
    localStorage.setItem("pumpkin-patch-v1", JSON.stringify(state));
  } catch {
    const status = $("save-status");
    if (status) status.textContent = "SAVING UNAVAILABLE IN THIS BROWSER";
  }
}
function ping() {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(450 + Math.random() * 150, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(180, audio.currentTime + 0.12);
    g.gain.setValueAtTime(0.06, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.15);
  } catch {}
}
$("grow").addEventListener("click", (e) => {
  add(tap());
  state.taps++;
  ping();
  const float = document.createElement("span");
  float.className = "floater";
  float.textContent = `+${fmt(tap())}`;
  const box = $("stage").getBoundingClientRect();
  float.style.left = `${e.detail ? e.clientX - box.left : box.width / 2}px`;
  float.style.top = `${e.detail ? e.clientY - box.top : box.height / 2}px`;
  $("stage").append(float);
  setTimeout(() => float.remove(), 1000);
  render();
});
$("upgrades").addEventListener("click", (e) => {
  const button = e.target.closest("[data-item]");
  if (!button) return;
  const i = Number(button.dataset.item),
    price = cost(i);
  if (slices() < price) return;
  state.weight = Math.max(0, state.weight - price * POUNDS_PER_SLICE);
  state.owned[i]++;
  ping();
  render();
  save();
});
const mobileLayout = window.matchMedia("(max-width: 800px)");
const harvestSheet = document.querySelector("aside");
const patch = document.querySelector(".patch");
let selectedTab = "shop";
let sheetOpen = false;

function syncSheet() {
  const isOpen = mobileLayout.matches && sheetOpen;
  const showContent = !mobileLayout.matches || isOpen;
  harvestSheet.classList.toggle("sheet-open", isOpen);
  patch.inert = isOpen;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const selected = showContent && button.dataset.tab === selectedTab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  $("shop").hidden = !showContent || selectedTab !== "shop";
  $("stats").hidden = !showContent || selectedTab !== "stats";
}

function closeSheet() {
  sheetOpen = false;
  syncSheet();
  $(selectedTab + "-tab").focus({ preventScroll: true });
}

document.querySelectorAll("[data-tab]").forEach((button) =>
  button.addEventListener("click", () => {
    const wasOpen = sheetOpen;
    selectedTab = button.dataset.tab;
    sheetOpen = mobileLayout.matches;
    syncSheet();
    document.querySelector(".sheet-content").scrollTop = 0;
    if (sheetOpen && !wasOpen) {
      $("back-to-pumpkin").focus({ preventScroll: true });
    }
  }),
);
$("back-to-pumpkin").addEventListener("click", closeSheet);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileLayout.matches && sheetOpen) {
    closeSheet();
  }
});
mobileLayout.addEventListener("change", () => {
  sheetOpen = false;
  syncSheet();
  if (document.activeElement === $("back-to-pumpkin")) {
    $(selectedTab + "-tab").focus({ preventScroll: true });
  }
});
syncSheet();
$("sound").addEventListener("click", () => {
  sound = !sound;
  $("sound").textContent = sound ? "♫" : "♪";
  $("sound").setAttribute(
    "aria-label",
    sound ? "Disable sound" : "Enable sound",
  );
  $("sound").setAttribute("aria-pressed", String(sound));
  ping();
});
$("reset").addEventListener("click", () => {
  if (
    !confirm("Start a fresh patch? This resets your pumpkin and all upgrades.")
  )
    return;
  state = {
    weight: 0,
    taps: 0,
    earned: 0,
    owned: items.map(() => 0),
    saved: Date.now(),
  };
  render();
  save();
});
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  add(rate() * Math.min(28800, (now - last) / 1000));
  last = now;
  render();
}, 250);
setInterval(save, 5000);
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
});
render();
