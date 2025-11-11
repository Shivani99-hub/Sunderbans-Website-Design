/* script.js
   Shared timing utilities: greeting, countdown, live clock, per-event timers.
   This file should be included on every page (outside the <main>) with:
   <script src="script.js" defer></script>
   It is independent of the PJAX file (app.js) so it keeps working after page swaps.
*/

// ---------- Config ----------
const DEADLINE_STRING = "Nov 11, 2025 22:00:00"; // local time; edit if needed

// Helper: safe getter
function $(selector, base = document) { return base.querySelector(selector); }
function $all(selector, base = document) { return Array.from(base.querySelectorAll(selector)); }

// ---------- Dynamic Greeting ----------
function initGreeting() {
  try {
    // do not duplicate greeting if already present
    if (document.getElementById('timeGreeting')) return;
    const nowHour = new Date().getHours();
    let message = "Welcome to Sundarbans House!";
    if (nowHour >= 5 && nowHour < 12) message = "🌅 Good Morning, Sundarbans!";
    else if (nowHour >= 12 && nowHour < 17) message = "🌞 Good Afternoon, Sundarbans!";
    else if (nowHour >= 17 && nowHour < 21) message = "🌇 Good Evening, Sundarbans!";
    else message = "🌙 Working late? Keep creating, Sundarbans!";

    const greetEl = document.createElement("p");
    greetEl.id = "timeGreeting";
    greetEl.textContent = message;
    greetEl.style.fontSize = "1.05rem";
    greetEl.style.marginTop = "8px";
    greetEl.style.fontWeight = "600";
    greetEl.style.color = "var(--accent, #0B5C8A)"; // uses CSS var if present
    greetEl.className = "small";

    const heroLeft = document.querySelector(".hero-left, .hero div:first-child, .hero");
    const lead = heroLeft ? heroLeft.querySelector("p.lead") : null;
    if (lead) heroLeft.insertBefore(greetEl, lead);
    else if (heroLeft) heroLeft.appendChild(greetEl);
  } catch (e) {
    console.warn("Greeting error", e);
  }
}

// ---------- Countdown to deadline ----------
let _countdownInterval = null;
function startCountdown() {
  const display = document.getElementById("countdown");
  if (!display) return;

  if (_countdownInterval) clearInterval(_countdownInterval);

  const deadline = new Date(DEADLINE_STRING).getTime();

  function update() {
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) {
      display.textContent = "✅ Challenge Closed!";
      clearInterval(_countdownInterval);
      _countdownInterval = null;
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    display.textContent = `⏳ Time left: ${days}d ${hours}h ${mins}m ${secs}s`;
  }

  update();
  _countdownInterval = setInterval(update, 1000);
}

// ---------- Live clock in footer ----------
let _liveClockInterval = null;
function startLiveClock() {
  const el = document.getElementById("liveClock");
  if (!el) return;
  if (_liveClockInterval) clearInterval(_liveClockInterval);

  function tick(){
    const now = new Date();
    const timeString = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = "🕒 Local Time: " + timeString;
  }
  tick();
  _liveClockInterval = setInterval(tick, 1000);
}

// ---------- Per-event start timers ----------
let _eventTimerInterval = null;
function startEventTimers() {
  const nodes = document.querySelectorAll(".event-time");
  if (!nodes || nodes.length === 0) return;
  if (_eventTimerInterval) clearInterval(_eventTimerInterval);

  function updateEventTimes(){
    const now = Date.now();
    nodes.forEach(el => {
      const ds = el.dataset.event;
      if (!ds) return;
      const t = new Date(ds).getTime();
      const diff = t - now;
      if (diff <= 0) {
        el.textContent = "✅ Started / Finished";
      } else {
        const days = Math.floor(diff / (1000*60*60*24));
        const hrs = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
        if (days > 0) el.textContent = `Starts in ${days}d ${hrs}h`;
        else if (hrs > 0) el.textContent = `Starts in ${hrs}h ${mins}m`;
        else el.textContent = `Starts in ${mins}m`;
      }
    });
  }

  updateEventTimes();
  _eventTimerInterval = setInterval(updateEventTimes, 60000); // update every minute
}

// ---------- Public init (run on load and after PJAX swaps) ----------
function initTimingFeatures() {
  initGreeting();
  startCountdown();
  startLiveClock();
  startEventTimers();
}

// auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initTimingFeatures();
});

// Expose initializer in case you want to call it manually after PJAX injection
window.__SUNDARBANS_initTiming = initTimingFeatures;
