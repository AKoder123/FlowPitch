// FlowPitch demo: clean, sophisticated motion + easy navigation
// Edit pitch content below in SLIDES (the UI updates automatically).

const SLIDES = [
  {
    kicker: "FLOWPITCH",
    layout: "hero",
    title: "FlowPitch turns a presentation into a trackable persuasive asset.",
    subtitle: "A simple shift: from a static file to a live link with clarity and signal.",
    before: [
      "A deck is a static file that dies after you press send.",
      "You spend hours polishing, then you guess what landed.",
      "Updates mean re-exporting, re-sending, and version confusion."
    ],
    after: [
      "Your deck becomes a live link with consistent design and navigation.",
      "Engagement signals reveal interest (views, time, clicks, completion).",
      "Update once and everyone always sees the latest version."
    ],
    valueChips: [
      "Faster creation",
      "Cleaner sharing",
      "Smarter follow-up"
    ],
    metric: { num: "Trackable", label: "link + signal" }
  },
  {
    kicker: "HOOK",
    title: "Pitches shouldn’t look like documents.",
    subtitle: "FlowPitch turns any PPT/PDF into a web-native pitch experience that reads fast, looks premium, and drives a decision.",
    bullets: [
      "One link. No attachments. No friction.",
      "Feels like a mini-site, not a file.",
      "Built for action: a clear CTA and flow."
    ],
    metric: { num: "2 min", label: "to understand + decide" }
  },
  {
    kicker: "PROBLEM",
    title: "PPT/PDF sharing kills momentum.",
    subtitle: "Recipients skim, bounce, and you get zero signal back.",
    bullets: [
      "The story breaks: zoom/scroll or slide fatigue.",
      "Presentation quality varies wildly across viewers.",
      "No insight: did they read it, and what mattered?"
    ]
  },
  {
    kicker: "SOLUTION",
    title: "Upload → Theme → Publish a pitch link.",
    subtitle: "Your deck becomes a modern web narrative: crisp sections, controlled pacing, and a premium look.",
    bullets: [
      "Brandable themes and typography.",
      "Fast navigation + present mode.",
      "CTA-ready (book a call / request access)."
    ]
  },
  {
    kicker: "WHY WE WIN",
    title: "We don’t replace decks — we upgrade them.",
    subtitle: "The wedge is conversion: the world already has decks. We make them web-native instantly.",
    bullets: [
      "Convert existing PPT/PDF into web-native pitch pages.",
      "Superior readability and pacing on any device.",
      "Next: analytics + templates + team workflows."
    ],
    metric: { num: "60s", label: "deck → pitch link" }
  },
  {
    kicker: "GO-TO-MARKET",
    title: "Start where polish pays.",
    subtitle: "Customers already pay for outcomes, not file formats.",
    bullets: [
      "Agencies + B2B sales: proposals, outbound links.",
      "Then startups: fundraising + investor updates.",
      "Then enterprise: governance + compliance sharing."
    ]
  },
  {
    kicker: "ASK",
    title: "Back the “pitch link” standard.",
    subtitle: "We’re raising a small round to ship conversion + templates + analytics — and we want your pattern recognition at scale.",
    bullets: [
      "Quick pilots → paid conversions.",
      "Build, ship, measure — fast.",
      "Next step: a 20-minute demo."
    ],
    metric: { num: "Next", label: "20-min demo" }
  }
];

// Elements
const stage   = document.getElementById("stage");
const track   = document.getElementById("track");
const dots    = document.getElementById("dots");
const barFill = document.getElementById("barFill");
const toast   = document.getElementById("toast");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const tapLeft = document.getElementById("tapLeft");
const tapRight= document.getElementById("tapRight");

// Navigation settings
const LOOP_AT_END = false; // demo default

// Motion model: critically damped-ish spring (time-based)
const SPRING = {
  stiffness: 160,   // higher = snappier
  damping: 26,      // higher = less bounce
  mass: 1
};

let idx = 0;

// Track position (px)
let x = 0;
let v = 0;
let targetX = 0;

// Drag state
let dragging = false;
let pointerId = null;
let dragStartClientX = 0;
let dragStartX = 0;

// Flick velocity estimation
let lastX = 0;
let lastT = 0;

// RAF loop
let raf = null;

function escapeHTML(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function slideHTML(s, i){
  // HERO slide with Before/After grouping
  if (s.layout === "hero"){
    return `
      <section class="slide ${i===0 ? "isActive" : ""}" data-i="${i}">
        <div class="slide__top reveal">
          <div class="card card--main">
            <div class="kicker">${escapeHTML(s.kicker || "")}</div>
            <h2 class="title">${escapeHTML(s.title || "")}</h2>
            <p class="subtitle">${escapeHTML(s.subtitle || "")}</p>

            <div class="heroGrid" style="margin-top:12px;">
              <div class="panel">
                <div class="panel__head">
                  <div class="badge">Before</div>
                  <div class="pillTag">Static file • No signal</div>
                </div>
                <ul>
                  ${(s.before || []).map(t => `
                    <li class="row"><span class="ic before" aria-hidden="true"></span><p>${escapeHTML(t)}</p></li>
                  `).join("")}
                </ul>
              </div>

              <div class="panel">
                <div class="panel__head">
                  <div class="badge">After</div>
                  <div class="pillTag">Live link • Trackable</div>
                </div>
                <ul>
                  ${(s.after || []).map(t => `
                    <li class="row"><span class="ic after" aria-hidden="true"></span><p>${escapeHTML(t)}</p></li>
                  `).join("")}
                </ul>
              </div>
            </div>

            <div class="chips" aria-label="Value">
              ${(s.valueChips || []).map(c => `<span class="chip">${escapeHTML(c)}</span>`).join("")}
            </div>

            ${s.metric ? `
              <div class="card" style="margin-top:12px;">
                <div class="metric">
                  <div class="metric__num">${escapeHTML(s.metric.num)}</div>
                  <div class="metric__label">${escapeHTML(s.metric.label)}</div>
                </div>
              </div>` : ""}
          </div>
        </div>

        <div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="font-size:12px; color:rgba(247,243,255,.72);">Slide ${i+1} / ${SLIDES.length}</div>
          <div style="font-size:12px; color:rgba(247,243,255,.72);">Tap right • drag • keys</div>
        </div>
      </section>
    `;
  }

  // Default slide
  const bullets = (s.bullets || []).map(b => `
    <li><div class="b" aria-hidden="true"></div><span>${escapeHTML(b)}</span></li>
  `).join("");

  const metric = s.metric ? `
    <div class="card">
      <div class="metric">
        <div class="metric__num">${escapeHTML(s.metric.num)}</div>
        <div class="metric__label">${escapeHTML(s.metric.label)}</div>
      </div>
    </div>` : "";

  return `
    <section class="slide ${i===0 ? "isActive" : ""}" data-i="${i}">
      <div class="slide__top reveal">
        <div class="card card--main">
          <div class="kicker">${escapeHTML(s.kicker || "")}</div>
          <h2 class="title">${escapeHTML(s.title || "")}</h2>
          <p class="subtitle">${escapeHTML(s.subtitle || "")}</p>
          ${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
          ${metric}
        </div>
      </div>

      <div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="font-size:12px; color:rgba(247,243,255,.72);">Slide ${i+1} / ${SLIDES.length}</div>
        <div style="font-size:12px; color:rgba(247,243,255,.72);">Tap right • drag • keys</div>
      </div>
    </section>
  `;
}

function render(){
  track.innerHTML = SLIDES.map(slideHTML).join("");
  dots.innerHTML = SLIDES.map((_, i)=> `<div class="p ${i===0?"active":""}" data-dot="${i}" aria-label="Go to slide ${i+1}" role="button"></div>`).join("");
  idx = 0;
  v = 0;
  x = 0;
  setTarget(idx);
  applyTransform();
  setActive(idx);
  updateUI();
}

function stageWidth(){
  return stage.getBoundingClientRect().width;
}

function clampIndex(n){
  if (LOOP_AT_END){
    if (n < 0) return SLIDES.length - 1;
    if (n >= SLIDES.length) return 0;
    return n;
  }
  return Math.max(0, Math.min(SLIDES.length - 1, n));
}

function setTarget(n){
  targetX = -n * stageWidth();
}

function setActive(n){
  const slides = track.querySelectorAll(".slide");
  slides.forEach(el => el.classList.remove("isActive"));
  const active = track.querySelector(`.slide[data-i="${n}"]`);
  if (active) active.classList.add("isActive");
}

function applyTransform(){
  track.style.transform = `translate3d(${x}px,0,0)`;
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove("show"), 900);
}

function updateUI(){
  prevBtn.disabled = !LOOP_AT_END && idx === 0;
  nextBtn.disabled = !LOOP_AT_END && idx === SLIDES.length - 1;
  [...dots.children].forEach((d,i)=> d.classList.toggle("active", i===idx));
  barFill.style.width = `${((idx+1)/SLIDES.length)*100}%`;
  stage.setAttribute("aria-label", `Slide ${idx+1} of ${SLIDES.length}`);
}

function go(to){
  const nextIdx = clampIndex(to);
  if (nextIdx === idx) return;

  idx = nextIdx;
  setTarget(idx);
  setActive(idx);
  updateUI();
  showToast(`Slide ${idx+1}/${SLIDES.length}`);
}

function next(){
  if (!LOOP_AT_END && idx === SLIDES.length - 1) return;
  go(idx + 1);
}
function prev(){
  if (!LOOP_AT_END && idx === 0) return;
  go(idx - 1);
}

// Buttons / dots / tap zones
nextBtn.addEventListener("click", next);
prevBtn.addEventListener("click", prev);

dots.addEventListener("click", (e)=>{
  const t = e.target.closest("[data-dot]");
  if (!t) return;
  go(parseInt(t.getAttribute("data-dot"), 10));
});

tapLeft.addEventListener("click", (e)=>{ e.stopPropagation(); prev(); });
tapRight.addEventListener("click", (e)=>{ e.stopPropagation(); next(); });

// Keyboard
window.addEventListener("keydown", (e)=>{
  if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter"){ e.preventDefault(); next(); }
  if (e.key === "ArrowLeft"){ e.preventDefault(); prev(); }
}, { passive:false });

// Drag + flick (smooth)
stage.addEventListener("pointerdown", (e)=>{
  // ignore controls
  if (e.target.closest("button") || e.target.closest("[data-dot]")) return;

  dragging = true;
  pointerId = e.pointerId;
  stage.setPointerCapture(pointerId);

  dragStartClientX = e.clientX;
  dragStartX = x;

  lastX = e.clientX;
  lastT = performance.now();
});

stage.addEventListener("pointermove", (e)=>{
  if (!dragging || e.pointerId !== pointerId) return;

  const dx = e.clientX - dragStartClientX;
  x = dragStartX + dx;

  // resistance at edges (if not looping)
  if (!LOOP_AT_END){
    const w = stageWidth();
    const minX = -(SLIDES.length - 1) * w;
    const maxX = 0;

    if (x > maxX) x = maxX + (x - maxX) * 0.28;
    if (x < minX) x = minX + (x - minX) * 0.28;
  }

  const now = performance.now();
  const dt = Math.max(1, now - lastT);
  // v in px/s
  v = ((e.clientX - lastX) / dt) * 1000;

  lastX = e.clientX;
  lastT = now;

  applyTransform();
});

stage.addEventListener("pointerup", (e)=>{
  if (!dragging || e.pointerId !== pointerId) return;
  dragging = false;

  const w = stageWidth();

  // decide slide based on position + velocity (flick)
  const velocitySlides = (v / 1400); // tune
  const projected = x + velocitySlides * w * 0.35;

  const raw = Math.round(-projected / w);
  go(raw);

  pointerId = null;
});

// Resize: keep slide aligned
window.addEventListener("resize", ()=>{
  setTarget(idx);
  x = targetX;
  v = 0;
  applyTransform();
});

// High-quality spring integration (time-based)
let lastFrame = performance.now();
function step(now){
  const dt = Math.min(0.033, (now - lastFrame) / 1000); // cap to avoid jumps
  lastFrame = now;

  if (!dragging){
    // spring: F = -k(x - target) - c*v
    const displacement = x - targetX;
    const F = -SPRING.stiffness * displacement - SPRING.damping * v;
    const a = F / SPRING.mass;

    v += a * dt;
    x += v * dt;

    // snap when close
    if (Math.abs(displacement) < 0.6 && Math.abs(v) < 18){
      x = targetX;
      v = 0;
    }

    applyTransform();
  }

  raf = requestAnimationFrame(step);
}

function start(){
  render();
  setTarget(0);
  x = targetX;
  applyTransform();
  lastFrame = performance.now();
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(step);
}

start();
