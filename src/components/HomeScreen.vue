<template>
  <div class="home-screen">
    <!-- Fondo con relámpagos -->
    <canvas ref="lightningCanvas" class="lightning-canvas"></canvas>

    <!-- Contenido principal -->
    <div class="home-content">

      <!-- Logo / Título animado -->
      <div class="title-wrapper" :class="{ visible: titleVisible }">
        <div class="title-top">LEGENDS</div>
        <div class="title-bottom">BATTLE</div>
        <div class="title-line"></div>
        <p class="title-sub">Videojuego web inspirado en leyendas tradicionales de Costa Rica</p>
      </div>

      <!-- Personajes flotando en el fondo -->
      <div class="bg-characters" :class="{ visible: titleVisible }">
        <div
          v-for="(char, i) in characters"
          :key="char.id"
          class="bg-char"
          :class="[char.type, `pos-${i}`]"
        >
          <img :src="char.image" :alt="char.name" />
        </div>
      </div>

      <!-- Botones de menú -->
      <div class="menu-buttons" :class="{ visible: buttonsVisible }">
        <button class="btn btn-primary menu-btn" @click="emit('go-to', 'select')">
          <span class="btn-icon">⚔</span>
          <span>Seleccionar Personaje</span>
          <span class="btn-arrow">›</span>
        </button>
        <button class="btn btn-secondary menu-btn" @click="showLore = true">
          <span class="btn-icon">📜</span>
          <span>Las Leyendas</span>
          <span class="btn-arrow">›</span>
        </button>
      </div>

      <!-- Versión / decoración inferior -->
      <div class="home-footer" :class="{ visible: buttonsVisible }">
        <div class="footer-line"></div>
        <span class="footer-text">IF7102 · UCR · 2026</span>
        <div class="footer-line"></div>
      </div>
    </div>

    <!-- Modal de lore -->
    <transition name="fade">
      <div v-if="showLore" class="modal-overlay" @click.self="showLore = false">
        <div class="modal lore-modal">
          <div class="corner-tl"></div><div class="corner-tr"></div>
          <div class="corner-bl"></div><div class="corner-br"></div>
          <h2 class="modal-title">Las Leyendas de Costa Rica</h2>
          <div class="divider"></div>
          <div v-for="char in characters" :key="char.id" class="lore-entry">
            <h3 class="lore-name" :class="char.type">{{ char.name }}</h3>
            <p class="lore-desc">{{ char.description }}</p>
          </div>
          <button class="btn btn-secondary" style="margin-top:1.5rem;width:100%" @click="showLore = false">Cerrar</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'HomeScreen',
  props: { characters: Array },
  emits: ['go-to'],

  setup(props, { emit }) {
    const titleVisible   = ref(false)
    const buttonsVisible = ref(false)
    const showLore       = ref(false)
    const lightningCanvas = ref(null)
    let animFrame = null

    onMounted(() => {
      // Aparición escalonada
      setTimeout(() => { titleVisible.value   = true },  200)
      setTimeout(() => { buttonsVisible.value = true }, 1000)

      initLightning()
    })

    onUnmounted(() => cancelAnimationFrame(animFrame))

    // ── Relámpagos en canvas ────────────────────────────
    function initLightning() {
      const canvas = lightningCanvas.value
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight

      const bolts = []
      let nextBolt = 0

      function createBolt() {
        const x = Math.random() * canvas.width
        bolts.push({
          x, y: 0,
          segments: generateSegments(x, 0, canvas.height * 0.6),
          alpha: 0.8,
          width: Math.random() * 1.5 + 0.5,
          color: Math.random() > 0.5 ? '#c8a84b' : '#00d4ff',
          life: 1,
        })
      }

      function generateSegments(x, y, targetY) {
        const segs = []
        let cx = x, cy = y
        while (cy < targetY) {
          const nx = cx + (Math.random() - 0.5) * 80
          const ny = cy + Math.random() * 40 + 15
          segs.push({ x1: cx, y1: cy, x2: nx, y2: Math.min(ny, targetY) })
          cx = nx; cy = ny
        }
        return segs
      }

      function draw() {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const now = Date.now()
        if (now > nextBolt) {
          createBolt()
          nextBolt = now + Math.random() * 2500 + 800
        }

        for (let i = bolts.length - 1; i >= 0; i--) {
          const b = bolts[i]
          b.life -= 0.03
          if (b.life <= 0) { bolts.splice(i, 1); continue }

          ctx.globalAlpha = b.life * b.alpha
          ctx.strokeStyle = b.color
          ctx.lineWidth   = b.width
          ctx.shadowColor = b.color
          ctx.shadowBlur  = 12
          ctx.beginPath()
          b.segments.forEach((s, j) => {
            if (j === 0) ctx.moveTo(s.x1, s.y1)
            ctx.lineTo(s.x2, s.y2)
          })
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        }

        animFrame = requestAnimationFrame(draw)
      }
      draw()
    }

    return { titleVisible, buttonsVisible, showLore, lightningCanvas, emit }
  }
}
</script>

<style scoped>
.home-screen {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 1;
}

.lightning-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* Personajes de fondo */
.bg-characters {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1.5s ease;
  z-index: 2;
}
.bg-characters.visible { opacity: 1; }

.bg-char {
  position: absolute;
  bottom: 0;
  transition: transform 0.1s ease-out;
}
.bg-char img {
  height: 65vh;
  max-height: 600px;
  object-fit: contain;
  filter: brightness(0.35) saturate(0.5);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.9) 30%, transparent 100%);
  mask-image: linear-gradient(to top, rgba(0,0,0,0.9) 30%, transparent 100%);
}
.bg-char.pos-0 { left: -4%; }
.bg-char.pos-1 { left: 50%; transform: translateX(-50%); }
.bg-char.pos-2 { right: -4%; }

/* Título */
.home-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  width: 100%;
}

.title-wrapper {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.title-wrapper.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.title-top {
  font-family: var(--font-title);
  font-size: clamp(3rem, 10vw, 7rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.12em;
  line-height: 1;
  text-shadow:
    0 0 10px rgba(255,255,255,0.9),
    0 0 40px rgba(200,168,75,0.7),
    0 0 100px rgba(200,168,75,0.3),
    4px 4px 0 rgba(139,0,0,1),
    8px 8px 0 rgba(80,0,0,0.5);
  animation: titlePulse 4s ease-in-out infinite;
}

.title-bottom {
  font-family: var(--font-title);
  font-size: clamp(3rem, 10vw, 7rem);
  font-weight: 900;
  color: var(--gold-bright);
  letter-spacing: 0.22em;
  line-height: 1;
  text-shadow:
    0 0 15px rgba(240,208,96,0.8),
    0 0 50px rgba(200,168,75,0.5),
    4px 4px 0 rgba(100,60,0,1);
  animation: titlePulse 4s ease-in-out infinite 0.5s;
}

@keyframes titlePulse {
  0%,100% { filter: brightness(1); }
  50%     { filter: brightness(1.15); }
}

.title-line {
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  margin: 1rem auto;
  animation: expandLine 1s ease-out 0.8s both;
}
@keyframes expandLine {
  from { width: 0; opacity: 0; }
  to   { width: 200px; opacity: 1; }
}

.title-sub {
  font-family: var(--font-display);
  font-size: clamp(0.75rem, 2vw, 1rem);
  letter-spacing: 0.15em;
  color: var(--text-muted);
  max-width: 500px;
  margin: 0.5rem auto 0;
}

/* Botones del menú */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2.5rem;
  width: 100%;
  max-width: 420px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.menu-buttons.visible {
  opacity: 1;
  transform: translateY(0);
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  font-size: 0.72rem;
  line-height: 1.4;
  padding: 1rem 1.5rem;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.menu-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s;
}
.menu-btn:hover::after { transform: translateX(100%); }

.btn-icon  { font-size: 1.1rem; }
.btn-arrow { margin-left: auto; opacity: 0.5; transition: opacity 0.2s, transform 0.2s; }
.menu-btn:hover .btn-arrow { opacity: 1; transform: translateX(4px); }

/* Footer */
.home-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  opacity: 0;
  transition: opacity 0.6s ease 0.3s;
}
.home-footer.visible { opacity: 1; }

.footer-line {
  flex: 1;
  height: 1px;
  max-width: 80px;
  background: linear-gradient(90deg, transparent, var(--gold-dim));
}
.home-footer .footer-line:last-child {
  background: linear-gradient(90deg, var(--gold-dim), transparent);
}
.footer-text {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.25em;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Modal lore */
.lore-modal { max-width: 520px; }
.modal-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  color: var(--gold);
  margin-bottom: 0.5rem;
  text-align: center;
}
.lore-entry { margin: 1rem 0; }
.lore-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}
.lore-name.segua  { color: #a0d8ef; }
.lore-name.cadejos{ color: var(--blood-light); }
.lore-name.padre  { color: var(--cyan-soul); }
.lore-desc { font-family: var(--font-display); font-size: 0.82rem; color: var(--text-muted); line-height: 1.7; }

/* Transición fade para modal */
.fade-enter-active,.fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .bg-char img { height: 45vh; }
  .bg-char.pos-0 { left: -15%; }
  .bg-char.pos-2 { right: -15%; }
}
</style>
