<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const modules = ref([
      {
        title: 'Booking Management',
        description: 'Manages room bookings, check-ins, and check-outs.',
        image: '/img/building/nbte-4.jpeg',
        features: ['Booking Overview', 'Check-Ins', 'Check-Outs'],
        route: '/admin/booking/dashboard'
    },
     {
        title: 'Housekeeping',
        description: 'Manages room status, cleaning schedules, and staff assignments.',
        image: '/img/bed-1.jpeg',
        features: ['Room Status', 'Cleaning Schedules', 'Staff Assignments'],
        route: '/admin/housekeeping/dashboard'
    },
    {
        title: 'Inventory',
        description: 'Tracks information about . . .',
        image: '/img/control-inventario-clami.png',
        features: ['Inventory Reports', 'Suppliers', 'Orders'],
        route: '/inventory/dashboard'
    },
    // {
    //     title: 'POS',
    //     description: 'Point of Sale system for managing transactions.',
    //     image: '/img/pos.png',
    //     features: ['POS Transactions', 'Charges', 'Payment Processing'],
    //     route: '/pos/dashboard'
    // },
    {
        title: 'Settings',
        description: 'Configuration of Booking & Inventory Parameters for the system',
        image: '/img/settings.png',
        features: ['Booking Management Settings', 'Inventory Management Settings', 'User and Permissions Management'],
        route: '/settings/dashboard'
    },
    {
        title: 'Revenue',
        description: 'Analytics, KPIs & financial performance insights.',
        image: '/img/nbte-bg.jpeg',
        features: ['Revenue Dashboard', 'KPIs & Trends', 'Room Type Performance'],
        route: '/revenue/dashboard'
    },
]);

// Carousel state
const current = ref(0);
const total = computed(() => modules.value.length);

const modIndex = (i) => {
    const m = total.value;
    return ((i % m) + m) % m;
};

const visibleModules = computed(()=> modules.value.map((m,idx)=>({ m, idx, d: signedDistance(idx) })));

// Interaction / animation state
const isDragging = ref(false);
let dragStartX = 0;
let dragStartAnimated = 0;
const dragSamples = []; // velocity samples
const dragTarget = ref(0); // smoothed drag target index
let dragRaf; // raf id for drag smoothing loop

// Pointer parallax state
const pointerX = ref(0); // -1 to 1
const pointerY = ref(0); // -1 to 1

// Base horizontal spacing (bigger cards)
const baseSpacing = 260; // compact spacing for stacked 3D deck feel

function shortestPath(from, to){
  const len = total.value;
  let diff = to - from;
  if (diff > len/2) diff -= len; else if (diff < -len/2) diff += len;
  return from + diff; // target position in continuous space
}

function cardStyle(d){
  const abs = Math.abs(d);
  const depth = Math.pow(abs, 1.15);
  const translateX = +(d * baseSpacing).toFixed(3);
  const rotateYBase = -22 * d;
  const translateZ = +(-140 * depth).toFixed(3);
  const scale = +(1 - 0.08 * depth).toFixed(4);
  const opacity = +(1 - 0.25 * depth).toFixed(4);
  const blur = depth > 2 ? 0.5 : 0;
  const alpha = Math.max(0.15, 0.95 - 0.45 * depth);
  let rotateX = 0;
  let rotateY = rotateYBase;
  let extraScale = 1;
  let translateY = 0;
  if (abs < 0.01){
    // parallax for center card only
    rotateX = pointerY.value * 5; // tilt up/down
    rotateY += pointerX.value * 6; // subtle left/right turn
    extraScale = 1.04;
    translateY = pointerY.value * -6; // lift on upward movement
  }
  const transform = `translate3d(${translateX}px,${translateY}px,${translateZ}px) rotateY(${rotateY.toFixed(3)}deg) rotateX(${rotateX.toFixed(3)}deg) scale(${(scale*extraScale).toFixed(4)})`;
  return {
    transform,
    zIndex: 400 - Math.round(depth * 60),
    opacity,
    '--bg-alpha': alpha.toFixed(3), // provide alpha via CSS var for gradient layering
    filter: `blur(${blur}px)`
  };
}

// Deterministic eased animation (replaces spring) -----------------
const animatedCurrent = ref(0);
let rafId;
let animState = null; // { from, to, start, duration }
const DURATION = 620; // ms
function easeOutQuint(t){ return 1 - Math.pow(1 - t, 5); }
function animateTo(targetIdx){
  if(isDragging.value) return; // don't animate while dragging
  cancelAnimationFrame(rafId);
  const from = animatedCurrent.value;
  const to = shortestPath(from, targetIdx);
  const diffAbs = Math.abs(to - from);
  const duration = 300 + 260 * Math.min(1, diffAbs); // dynamic duration based on distance
  animState = { from, to, start: performance.now(), duration };
  function step(now){
    if(!animState) return;
    const { from, to, start, duration } = animState;
    const t = Math.min(1, (now - start)/duration);
    const k = easeOutQuint(t);
    animatedCurrent.value = from + (to - from) * k;
    if (t < 1) rafId = requestAnimationFrame(step); else animatedCurrent.value = targetIdx;
  }
  rafId = requestAnimationFrame(step);
}
watch(current, (val)=> animateTo(val));

function onPointerDown(e){
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  isDragging.value = true;
  dragStartX = clientX;
  dragStartAnimated = animatedCurrent.value;
  dragTarget.value = dragStartAnimated;
  dragSamples.length = 0;
  cancelAnimationFrame(rafId); animState = null;
  // kick off smoothing loop
  cancelAnimationFrame(dragRaf);
  const dragLoop = () => {
    if(!isDragging.value) return;
    // exponential smoothing toward dragTarget
    const diff = dragTarget.value - animatedCurrent.value;
    animatedCurrent.value += diff * 0.33; // smoothing factor (adjust for feel)
    // snap if very close to reduce micro jitter
    if (Math.abs(diff) < 0.002) animatedCurrent.value = dragTarget.value;
    dragRaf = requestAnimationFrame(dragLoop);
  };
  dragLoop();
}
function onPointerMove(e){
  // parallax when not dragging
  if(!isDragging.value){
    const wrap = document.getElementById('module-carousel-area');
    if(wrap){
      const rect = wrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left)/rect.width; // 0..1
      const y = (clientY - rect.top)/rect.height; // 0..1
      pointerX.value = (x - 0.5) * 2; // -1..1
      pointerY.value = (y - 0.5) * 2; // -1..1
    }
    return;
  }
  // dragging logic
  if(e.cancelable) e.preventDefault();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const dx = clientX - dragStartX;
  const deltaIndex = dx / baseSpacing;
  dragTarget.value = dragStartAnimated - deltaIndex;
  const now = performance.now();
  dragSamples.push({ t: now, x: clientX });
  while(dragSamples.length > 8) dragSamples.shift();
}
function onPointerUp(){
  if(!isDragging.value) return;
  isDragging.value = false;
  cancelAnimationFrame(dragRaf);
  // compute velocity using wider sample window for stability
  if(dragSamples.length >= 2){
    const a = dragSamples[0];
    const b = dragSamples[dragSamples.length-1];
    const vPxPerMs = (b.x - a.x) / (b.t - a.t || 1);
    const vIndex = -(vPxPerMs * 1000) / baseSpacing; // index units per second (approx)
    const projected = dragTarget.value + vIndex * 0.22; // inertia factor
    const nearest = Math.round(projected);
    current.value = modIndex(nearest);
  } else {
    current.value = modIndex(Math.round(dragTarget.value));
  }
}

onMounted(()=>{
  const wrap = document.getElementById('module-carousel-area');
  wrap?.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointerleave', onPointerUp, { passive: true });
});
onUnmounted(()=>{
  const wrap = document.getElementById('module-carousel-area');
  wrap?.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointerleave', onPointerUp);
  pointerX.value = 0; pointerY.value = 0;
});


// Signed circular distance
function signedDistance(i){
  let d = i - animatedCurrent.value;
  const len = total.value;
  if (d > len/2) d -= len; else if (d < -len/2) d += len;
  return d;
}

const next = () => { current.value = modIndex(current.value + 1); };
const prev = () => { current.value = modIndex(current.value - 1); };
const goTo = (idx) => { current.value = modIndex(idx); };

const navigateTo = (route) => { if (route) router.push(route); };

const handleKey = (e) => {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Enter') navigateTo(modules.value[current.value].route);
};

onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));

const animationTick = ref(0);
watch(current, () => { animationTick.value++; });
</script>

<template>
    <div class="landing-wrapper min-h-screen flex flex-column">
        <div class="landing-inner flex flex-column flex-grow-1 justify-content-center px-4 md:px-6 lg:px-8">
            <div class="text-700 font-bold text-3xl md:text-4xl mb-6 text-center tracking-wide">CHOOSE A SPACE</div>
            <div id="module-carousel-area" class="module-carousel relative mx-auto" role="listbox" aria-label="Modules" tabindex="0">
                <button class="nav-btn left" aria-label="Previous" @click="prev"><i class="pi pi-chevron-left" /></button>
                <button class="nav-btn right" aria-label="Next" @click="next"><i class="pi pi-chevron-right" /></button>
                <div :class="['cards-wrapper','physics', { dragging: isDragging }]" @pointerdown="onPointerDown" @touchstart.passive="onPointerDown">
                    <div v-for="o in visibleModules" :key="o.m.title" class="module-card surface-card"
                         :class="{'is-center': Math.abs(o.d) < 0.01}" :style="cardStyle(o.d)"
                         role="option" :aria-selected="Math.abs(o.d) < 0.01" :tabindex="Math.abs(o.d) < 0.01 ? 0 : -1"
                         @click="goTo(o.idx)">
                        <div class="image" :style="{ backgroundImage: `url('${o.m.image}')` }" />
                        <div class="content px-4 pb-4 flex flex-column h-full">
                            <div class="text-900 font-medium text-xl mb-2 font-bold text-center">{{ o.m.title }}</div>
                            <div class="text-600 text-center mb-3 line-clamp-3">{{ o.m.description }}</div>
                            <hr class="my-3 mx-0 border-top-1 border-none surface-border" />
                            <Transition name="fade-slide">
                                <ul v-if="Math.abs(o.d) < 0.01" class="list-none p-0 m-0 flex-grow-1">
                                    <li v-for="feature in o.m.features" :key="feature" class="flex align-items-center mb-3 feature-item">
                                        <i class="pi pi-check-circle text-green-500 mr-2" /><span class="text-sm">{{ feature }}</span>
                                    </li>
                                </ul>
                            </Transition>
                            <Transition name="fade-zoom">
                                <Button v-if="Math.abs(o.d) < 0.01" @click.stop="navigateTo(o.m.route)" label="Enter" class="w-full mt-auto mb-2 p-button-rounded" />
                            </Transition>
                        </div>
                    </div>
                </div>
                <div class="helper-text text-center mt-4 text-500 text-sm">Scroll / swipe or use arrows. Enter to open.</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Centering helpers */
.landing-wrapper { background: transparent; }
.landing-inner { max-width: 1920px; margin: 0 auto; width: 100%; }

.module-carousel { max-width: 100%; width:100%; }
.cards-wrapper {
  position: relative;
  height: 560px; /* adjusted height for new compact cards */
  perspective: 1600px; /* refined perspective */
  perspective-origin: 50% 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 2000px;
  margin: 0 auto;
  transform-style: preserve-3d;
  user-select: none;
  cursor: grab;
  --glow: 0 0 0 rgba(16,185,129,0); /* dynamic placeholder */
  touch-action: none; /* disable native scroll/pinch during drag for smoother pointer events */
}
.cards-wrapper.dragging { cursor: grabbing; }
/* Removed white edge gradients */
/* .cards-wrapper::before, .cards-wrapper::after { */
/*   content:''; position:absolute; top:0; bottom:0; width:160px; pointer-events:none; z-index:4; */
/*   background:linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0)); */
/* } */
/* .cards-wrapper::after { right:0; left:auto; background:linear-gradient(to left, rgba(255,255,255,0.95), rgba(255,255,255,0)); } */
.module-card {
  position: absolute;
  width: 360px; /* compact width for deck */
  height: 520px; /* adjusted height */
  border-radius: 40px;
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px) saturate(150%);
  transition: opacity .45s ease, box-shadow .45s ease, filter .5s, border-color .4s;
  cursor: pointer;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.25);
  box-shadow: 0 25px 55px -22px rgba(0,0,0,.40), 0 8px 24px -8px rgba(0,0,0,.25);
  will-change: transform, opacity;
  backface-visibility: hidden;
  isolation: isolate;
  background:
    linear-gradient(140deg, rgba(255,255,255,0.75), rgba(255,255,255,0.35) 35%, rgba(255,255,255,0.15) 70%),
    radial-gradient(circle at 28% 20%, rgba(255,255,255,0.85), rgba(255,255,255,0) 60%),
    linear-gradient(to bottom right, rgba(16,185,129,0.08), rgba(16,185,129,0) 55%),
    rgba(255,255,255,var(--bg-alpha,0.6));
}
.module-card .image {
  height: 260px; /* default height for large screens */
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 28px 28px 18px 18px;
  margin: 0 1.1rem 1rem;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25), 0 6px 18px -6px rgba(0,0,0,.25);
  transition: transform .65s cubic-bezier(.22,.9,.3,1), filter .6s;
  position: relative;
  overflow: hidden;
}
.module-card .image::after { /* subtle vignette */
  content:'';
  position:absolute; inset:0;
  background:linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0));
  pointer-events:none;
}
.module-card::after { /* edge thickness illusion */
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%), linear-gradient(to right, rgba(0,0,0,0.12), transparent 30%, transparent 70%, rgba(0,0,0,0.12));
  mix-blend-mode:overlay;
  pointer-events:none;
}
.module-card.is-center {
  background:
    linear-gradient(165deg, rgba(16,185,129,0.28), rgba(16,185,129,0.10) 45%, rgba(16,185,129,0.32) 95%),
    radial-gradient(circle at 30% 18%, rgba(255,255,255,0.9), rgba(255,255,255,0) 65%),
    linear-gradient(145deg, rgba(255,255,255,0.7), rgba(255,255,255,0.15)),
    rgba(255,255,255,var(--bg-alpha,0.6));
}
.module-card::before {
  content:'';
  position:absolute; inset:0;
  background:
    radial-gradient(ellipse at 70% 120%, rgba(0,0,0,0.18), transparent 60%),
    linear-gradient(115deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 55%);
  mix-blend-mode: overlay;
  pointer-events:none;
  opacity:.85;
  transition: opacity .6s ease;
}
.module-card.is-center::before { opacity:1; }
.module-card.is-center { border-color: var(--primary-color, #10b981); box-shadow: 0 40px 90px -30px rgba(0,0,0,.45), 0 0 0 1px rgba(16,185,129,0.15), 0 0 0 6px rgba(16,185,129,0.06); }
.module-card.is-center::after { background: linear-gradient(160deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%), linear-gradient(to right, rgba(16,185,129,0.25), rgba(16,185,129,0.05) 40%, rgba(16,185,129,0.05) 60%, rgba(16,185,129,0.25)); }
.module-card:not(.is-center):hover { border-color: rgba(0,0,0,.08); }
.module-card.is-center:hover .image { transform: scale(1.055); }

@media (max-width: 1600px){
  .module-card { width: 340px; height: 500px; }
  .module-card .image { height: 240px; }
  .cards-wrapper { height: 540px; }
}
@media (max-width: 1280px){
  .module-card { width: 320px; height: 480px; }
  .module-card .image { height: 230px; }
  .cards-wrapper { height: 520px; }
}
@media (max-width: 960px){
  .module-card { width: 300px; height: 460px; }
  .module-card .image { height: 210px; }
  .cards-wrapper { height: 500px; }
}
@media (max-width: 640px){
  .module-card { width: 260px; height: 430px; }
  .module_card .image { height: 190px; }
  .cards-wrapper { height: 480px; }
}
/* Pulse animation for center card each change */
[class*='pulse-'].is-center { animation: centerPop .7s cubic-bezier(.22,.9,.3,1.2); }
@keyframes centerPop { 0% { transform: translateX(0) scale(.9) translateZ(0); } 45% { transform: translateX(0) scale(1.03) translateZ(0); } 70% { transform: translateX(0) scale(.995); } 100% { transform: translateX(0) scale(1); } }
/* Positions relative to center */
.module-card.pos-0 { transform: translate3d(0,0,0) scale(1); }
.module-card.pos--1 { transform: translate3d(-300px,0,-40px) rotateY(18deg) scale(.9); }
.module-card.pos-1 { transform: translate3d(300px,0,-40px) rotateY(-18deg) scale(.9); }
.module-card.pos--2 { transform: translate3d(-560px,0,-120px) rotateY(28deg) scale(.72); }
.module-card.pos-2 { transform: translate3d(560px,0,-120px) rotateY(-28deg) scale(.72); }

/* Center entering animations */
.module-card.entering-from-right { animation: centerFromRight .85s cubic-bezier(.22,.84,.3,1) both; }
.module-card.entering-from-left { animation: centerFromLeft .85s cubic-bezier(.22,.84,.3,1) both; }
@keyframes centerFromRight {
  0% { transform: translate3d(300px,0,-40px) rotateY(-18deg) scale(.9); filter:brightness(.85); }
  55% { transform: translate3d(40px,0,20px) rotateY(-6deg) scale(1.03); }
  80% { transform: translate3d(-6px,0,0) rotateY(2deg) scale(1); }
  100% { transform: translate3d(0,0,0) rotateY(0deg) scale(1); filter:brightness(1); }
}
@keyframes centerFromLeft {
  0% { transform: translate3d(-300px,0,-40px) rotateY(18deg) scale(.9); filter:brightness(.85); }
  55% { transform: translate3d(-40px,0,20px) rotateY(6deg) scale(1.03); }
  80% { transform: translate3d(6px,0,0) rotateY(-2deg) scale(1); }
  100% { transform: translate3d(0,0,0) rotateY(0deg) scale(1); filter:brightness(1); }
}

/* Removed legacy prev/next animation tracking for cleaner motion
const prevIndex = ref(-1);
const direction = ref(null);
function resetPrevAfter(){ setTimeout(()=>{ prevIndex.value = -1; direction.value = null; }, 900); }
*/

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,.9);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  color: var(--primary-color, #10b981);
  cursor: pointer;
  box-shadow: 0 4px 16px -4px rgba(0,0,0,.2);
  transition: background .3s, transform .3s;
  z-index: 10;
}
.nav-btn:hover { background: var(--primary-color); color: #fff; }
.nav-btn.left { left: 0; transform: translate(-60%, -50%); }
.nav-btn.right { right: 0; transform: translate(60%, -50%); }
@media (max-width: 960px){ .nav-btn.left { transform: translate(-30%, -50%); } .nav-btn.right { transform: translate(30%, -50%); } }
@media (max-width: 640px){ .nav-btn.left, .nav-btn.right { transform: translate(0,-50%); } }
.helper-text { user-select: none; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-clamp: 3; }

/* Feature list & content stagger */
.fade-stagger { opacity: 0; animation: fadeUp .6s forwards; }
.fade-stagger.delay-1 { animation-delay: .08s; }
.fade-stagger.delay-2 { animation-delay: .14s; }
@keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
.feature-item { opacity:0; animation: featureFade .55s forwards; animation-delay: calc(.18s + (.05s * var(--d))); }
@keyframes featureFade { from { opacity:0; transform: translateX(-6px); } to { opacity:1; transform:none; } }

/* Transition for v-if sections */
.fade-slide-enter-active { transition: all .55s cubic-bezier(.25,.8,.25,1); }
.fade-slide-leave-active { transition: all .35s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity:0; transform: translateY(10px); }
.fade-zoom-enter-active { animation: zoomIn .5s cubic-bezier(.26,.86,.34,1); }
.fade-zoom-leave-active { animation: zoomOut .35s ease; }
@keyframes zoomIn { from { opacity:0; transform: scale(.85); } 60% { transform: scale(1.05); } to { opacity:1; transform: scale(1); } }
@keyframes zoomOut { from { opacity:1; transform: scale(1); } to { opacity:0; transform: scale(.9); } }

.cards-wrapper.physics { overflow: hidden; }
.module-card.is-center { border-color: var(--primary-color,#10b981); box-shadow:0 15px 40px -10px rgba(0,0,0,.22); }
.module-card:not(.is-center):hover { border-color: rgba(0,0,0,.08); }
/* Remove old positional classes influence */
/* (legacy positional classes removed) */
/* Reduced previous animations */
[class*='pulse-'] { animation:none !important; }

@media (prefers-reduced-motion: reduce) {
  .module-card, .fade-slide-enter-active, .fade-zoom-enter-active { transition:none !important; animation:none !important; }
  .module-card { filter:none !important; }
}
</style>

