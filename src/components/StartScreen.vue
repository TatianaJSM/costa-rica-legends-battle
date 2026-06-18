<template>
  <div class="start-screen">
    <!-- Fondo tenebroso -->
    <div class="background-casona"></div>
    <div class="background-vignette"></div>
    <div class="mist mist-1"></div>
    <div class="mist mist-2"></div>

    <!-- Rayos -->
    <canvas ref="lightningCanvas" class="lightning-canvas"></canvas>

    <div class="start-content">
      <!-- Título animado -->
      <div class="title-wrapper" :class="{ visible: titleVisible }">
        <div class="title-top">LEGENDS</div>
        <div class="title-bottom">BATTLE</div>
        <div class="title-line"></div>
        <p class="title-sub">
          Videojuego inspirado en leyendas tradicionales de Costa Rica
        </p>
      </div>

      <!-- Botones -->
      <div class="menu-buttons" :class="{ visible: buttonsVisible }">
        <button class="btn btn-primary menu-btn" @mouseenter="playSound('hover')" @click="emit('go-to', 'select')">
          <span class="btn-icon">⚔</span>
          <span>Seleccionar Personaje</span>
          <span class="btn-arrow">›</span>
        </button>

        <button class="btn btn-secondary menu-btn" @mouseenter="playSound('hover')" @click="showLore = true; playSound('click')">
          <span class="btn-icon">📜</span>
          <span>Las Leyendas</span>
          <span class="btn-arrow">›</span>
        </button>
      </div>

      <div class="home-footer" :class="{ visible: buttonsVisible }">
        <div class="footer-line"></div>
        <span class="footer-text">IF7102 · UCR · 2026</span>
        <div class="footer-line"></div>
      </div>
    </div>

    <!-- Modal lore -->
    <transition name="fade">
      <div v-if="showLore" class="modal-overlay" @click.self="showLore = false">
        <div class="modal lore-modal">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>

          <h2 class="modal-title">Las Leyendas de Costa Rica</h2>
          <div class="divider"></div>

          <div v-for="char in characters" :key="char.id" class="lore-entry" :class="char.type">
            <img :src="char.portrait || char.image" :alt="char.name" class="lore-portrait" />
            <div class="lore-text">
              <h3 class="lore-name" :class="char.type">{{ char.name }}</h3>
              <p class="lore-desc">{{ char.description }}</p>
            </div>
          </div>

          <button
            class="btn btn-secondary"
            style="margin-top: 1.5rem; width: 100%"
            @mouseenter="playSound('hover')"
            @click="showLore = false; playSound('click')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { playSound } from '../modules/soundManager'

export default {
  name: 'StartScreen',
  props: { characters: Array },
  emits: ['go-to'],

  setup(props, { emit }) {
    const titleVisible = ref(false)
    const buttonsVisible = ref(false)
    const showLore = ref(false)
    const lightningCanvas = ref(null)

    let animFrame = null
    let handleResize = null

    onMounted(() => {
      setTimeout(() => { titleVisible.value = true }, 200)
      setTimeout(() => { buttonsVisible.value = true }, 900)
      initLightning()
    })

    onUnmounted(() => {
      cancelAnimationFrame(animFrame)
      if (handleResize) {
        window.removeEventListener('resize', handleResize)
      }
    })

    function initLightning() {
      const canvas = lightningCanvas.value
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const bolts = []
      let nextBolt = 0
      let ambientFlash = 0

      const resizeCanvas = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      handleResize = resizeCanvas
      resizeCanvas()
      window.addEventListener('resize', handleResize)

      function createBranchSegments(startX, startY, maxLen = 140) {
        const segs = []
        let cx = startX
        let cy = startY
        let traveled = 0

        while (traveled < maxLen) {
          const nx = cx + (Math.random() - 0.5) * 70
          const ny = cy + Math.random() * 28 + 12
          segs.push({ x1: cx, y1: cy, x2: nx, y2: ny })
          traveled += (ny - cy)
          cx = nx
          cy = ny
        }

        return segs
      }

      function generateSegments(x, y, targetY) {
        const segs = []
        const branches = []

        let cx = x
        let cy = y

        while (cy < targetY) {
          const nx = cx + (Math.random() - 0.5) * 90
          const ny = cy + Math.random() * 35 + 18
          segs.push({ x1: cx, y1: cy, x2: nx, y2: Math.min(ny, targetY) })

          if (Math.random() > 0.72) {
            branches.push(createBranchSegments(nx, ny, Math.random() * 100 + 70))
          }

          cx = nx
          cy = ny
        }

        return { segs, branches }
      }

      function createBolt() {
        const x = Math.random() * canvas.width
        const targetY = canvas.height * (Math.random() * 0.2 + 0.55)
        const generated = generateSegments(x, 0, targetY)

        bolts.push({
          x,
          segments: generated.segs,
          branches: generated.branches,
          alpha: Math.random() * 0.35 + 0.65,
          width: Math.random() * 2 + 1.2,
          color: Math.random() > 0.45 ? '#c8a84b' : '#00d4ff',
          life: 1
        })

        ambientFlash = 0.22 + Math.random() * 0.12
      }

      function drawBoltSegments(segments, color, width, alpha) {
        ctx.globalAlpha = alpha
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.shadowColor = color
        ctx.shadowBlur = 16

        ctx.beginPath()
        segments.forEach((s, j) => {
          if (j === 0) ctx.moveTo(s.x1, s.y1)
          ctx.lineTo(s.x2, s.y2)
        })
        ctx.stroke()

        // línea central más intensa
        ctx.lineWidth = Math.max(0.8, width * 0.45)
        ctx.shadowBlur = 24
        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (ambientFlash > 0.01) {
          ctx.fillStyle = `rgba(255,255,255,${ambientFlash * 0.10})`
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ambientFlash *= 0.88
        }

        const now = Date.now()

        // MÁS FRECUENTES
        if (now > nextBolt) {
          const burst = Math.random() > 0.65 ? 2 : 1
          for (let i = 0; i < burst; i++) createBolt()

          nextBolt = now + Math.random() * 700 + 220
        }

        for (let i = bolts.length - 1; i >= 0; i--) {
          const b = bolts[i]
          b.life -= 0.045

          if (b.life <= 0) {
            bolts.splice(i, 1)
            continue
          }

          drawBoltSegments(b.segments, b.color, b.width, b.life * b.alpha)

          b.branches.forEach(branch => {
            drawBoltSegments(branch, b.color, b.width * 0.45, b.life * b.alpha * 0.7)
          })
        }

        animFrame = requestAnimationFrame(draw)
      }

      draw()
    }

    return {
      titleVisible,
      buttonsVisible,
      showLore,
      lightningCanvas,
      emit,
      playSound
    }
  }
}
</script>

<style scoped>
.start-screen {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 1;
  background: #050508;
}

/* Fondo de la casona, oscuro y poco visible */
.background-casona {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(5, 5, 8, 0.25), rgba(5, 5, 8, 0.55)),
    url('../assets/images/backgrounds/casona-santa-rosa.png') center center / cover no-repeat;
  opacity: 0.80;
  filter: saturate(1.45) contrast(1.08) brightness(0.78) blur(0.5px);
  transform: scale(1.03);
  z-index: 0;
}

.background-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(139, 0, 0, 0.18) 0%, transparent 38%),
    radial-gradient(circle at bottom, rgba(0, 120, 160, 0.10) 0%, transparent 35%),
    linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.55));
  z-index: 1;
  pointer-events: none;
}

/* Niebla */
.mist {
  position: absolute;
  inset: -10%;
  pointer-events: none;
  z-index: 2;
  opacity: 0.12;
  filter: blur(45px);
}

.mist-1 {
  background: radial-gradient(circle at 20% 70%, rgba(255,255,255,0.12), transparent 40%);
  animation: driftMist1 14s ease-in-out infinite alternate;
}

.mist-2 {
  background: radial-gradient(circle at 80% 35%, rgba(0,212,255,0.10), transparent 35%);
  animation: driftMist2 18s ease-in-out infinite alternate;
}

@keyframes driftMist1 {
  from { transform: translateX(-3%) translateY(0); }
  to   { transform: translateX(3%) translateY(-2%); }
}

@keyframes driftMist2 {
  from { transform: translateX(2%) translateY(1%); }
  to   { transform: translateX(-4%) translateY(-1%); }
}

/* Canvas rayos */
.lightning-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

/* Contenido */
.start-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  width: 100%;
}

/* Título */
.title-wrapper {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.175,0.885,0.32,1.275);
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
  50%     { filter: brightness(1.2); }
}

.title-line {
  width: 0;
  height: 2px;
  margin: 1rem auto;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  animation: expandLine 1s ease-out 0.8s forwards;
}
@keyframes expandLine {
  to { width: 200px; }
}

.title-sub {
  font-family: var(--font-display);
  font-size: clamp(0.75rem, 2vw, 1rem);
  letter-spacing: 0.15em;
  color: var(--text-muted);
  max-width: 500px;
  margin: 0.5rem auto 0;
}

/* Botones */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2.5rem;
  width: 100%;
  max-width: 380px;
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
  gap: 0.8rem;
  font-size: 0.9rem;
  padding: 1rem 2rem;
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
.menu-btn:hover::after {
  transform: translateX(100%);
}

.btn-icon {
  font-size: 1.1rem;
}
.btn-arrow {
  margin-left: auto;
  opacity: 0.5;
  transition: opacity 0.2s, transform 0.2s;
}
.menu-btn:hover .btn-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Footer */
.home-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  opacity: 0;
  transition: opacity 0.6s ease 0.3s;
}
.home-footer.visible {
  opacity: 1;
}
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

/* Modal */
.lore-modal {
  max-width: 640px;
}
.modal-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  color: var(--gold);
  margin-bottom: 0.5rem;
  text-align: center;
}
.lore-entry {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin: 1.2rem 0;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: border-color 0.25s, box-shadow 0.25s;
}
.lore-portrait {
  width: 80px;
  height: 106px;
  object-fit: contain;
  object-position: center;
  background: #08080f;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.lore-entry.segua .lore-portrait { border-color: rgba(160, 216, 239, 0.35); }
.lore-entry.segua:hover { border-color: rgba(160, 216, 239, 0.25); box-shadow: 0 0 14px rgba(160, 216, 239, 0.08); }

.lore-entry.cadejos .lore-portrait { border-color: rgba(192, 57, 43, 0.35); }
.lore-entry.cadejos:hover { border-color: rgba(192, 57, 43, 0.25); box-shadow: 0 0 14px rgba(192, 57, 43, 0.08); }

.lore-entry.padre .lore-portrait { border-color: rgba(0, 212, 255, 0.35); }
.lore-entry.padre:hover { border-color: rgba(0, 212, 255, 0.25); box-shadow: 0 0 14px rgba(0, 212, 255, 0.08); }

.lore-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}
.lore-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}
.lore-name.segua   { color: #a0d8ef; }
.lore-name.cadejos { color: var(--blood-light); }
.lore-name.padre   { color: var(--cyan-soul); }

.lore-desc {
  font-family: var(--font-display);
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.6;
}

@media (max-width: 520px) {
  .lore-entry {
    flex-direction: column;
    text-align: center;
    gap: 0.8rem;
    padding: 1rem;
  }
  .lore-portrait {
    width: 90px;
    height: 120px;
  }
}

.divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  margin: 0.8rem 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .background-casona {
    opacity: 0.16;
  }

  .title-top,
  .title-bottom {
    letter-spacing: 0.10em;
  }
}
</style>