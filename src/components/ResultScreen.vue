<template>
  <transition name="result-appear">
    <div v-if="visible" class="result-screen">

      <!-- Fondo de brillo -->
      <div class="result-glow" :class="winner === 'player' ? 'win' : 'lose'"></div>

      <!-- Partículas de victoria -->
      <canvas v-if="winner === 'player'" ref="confettiCanvas" class="confetti-canvas"></canvas>

      <!-- Texto principal -->
      <div class="result-main" :class="{ visible: textVisible }">
        <div class="result-title" :class="winner === 'player' ? 'win' : 'lose'">
          {{ winner === 'player' ? '¡VICTORIA!' : 'DERROTA' }}
        </div>
        <div class="result-subtitle">
          {{ winner === 'player'
            ? playerChar.name + ' ha triunfado en la batalla'
            : enemyChar.name + ' ha vencido esta ronda'
          }}
        </div>

        <!-- Stats de la pelea -->
        <div class="result-stats" :class="{ visible: statsVisible }">
          <div class="stat-item">
            <div class="stat-val">{{ roundsPlayed }}</div>
            <div class="stat-lbl">Rondas</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-val">{{ totalDamageDealt }}%</div>
            <div class="stat-lbl">Daño causado</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-val">{{ timeUsed }}s</div>
            <div class="stat-lbl">Tiempo usado</div>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="result-buttons" :class="{ visible: btnsVisible }">
        <button class="btn btn-primary" @click="emit('restart')">
          ⚔ REVANCHA
        </button>
        <button class="btn btn-secondary" @click="emit('go-to', 'select')">
          ◈ CAMBIAR PERSONAJE
        </button>
        <button class="btn btn-secondary" @click="emit('go-to', 'home')">
          ⌂ MENÚ PRINCIPAL
        </button>
      </div>

    </div>
  </transition>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue'

export default {
  name: 'ResultScreen',
  props: {
    visible:          { type: Boolean, default: false },
    winner:           { type: String,  default: 'player' },
    playerChar:       { type: Object,  required: true },
    enemyChar:        { type: Object,  required: true },
    roundsPlayed:     { type: Number,  default: 1 },
    totalDamageDealt: { type: Number,  default: 0 },
    timeUsed:         { type: Number,  default: 0 },
  },
  emits: ['restart', 'go-to'],

  setup(props, { emit }) {
    const textVisible  = ref(false)
    const statsVisible = ref(false)
    const btnsVisible  = ref(false)
    const confettiCanvas = ref(null)
    let confettiFrame = null

    watch(() => props.visible, (val) => {
      if (!val) return
      setTimeout(() => { textVisible.value  = true  }, 300)
      setTimeout(() => { statsVisible.value = true  }, 700)
      setTimeout(() => { btnsVisible.value  = true  }, 1000)
      if (props.winner === 'player') {
        setTimeout(() => startConfetti(), 400)
      }
    })

    function startConfetti() {
      const canvas = confettiCanvas.value
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      const pieces  = []
      const colors  = ['#c8a84b','#f0d060','#e74c3c','#00d4ff','#fff']

      for (let i = 0; i < 80; i++) {
        pieces.push({
          x:  Math.random() * canvas.width,
          y: -Math.random() * canvas.height,
          w: Math.random() * 8 + 4,
          h: Math.random() * 4 + 2,
          r: Math.random() * Math.PI * 2,
          vx:(Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 1,
          vr:(Math.random() - 0.5) * 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
        })
      }

      function draw() {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        pieces.forEach(p => {
          p.x  += p.vx
          p.y  += p.vy
          p.r  += p.vr
          if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width }
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.r)
          ctx.globalAlpha = p.alpha
          ctx.fillStyle   = p.color
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h)
          ctx.restore()
        })
        confettiFrame = requestAnimationFrame(draw)
      }
      draw()
    }

    onUnmounted(() => cancelAnimationFrame(confettiFrame))

    return { textVisible, statsVisible, btnsVisible, confettiCanvas, emit }
  }
}
</script>

<style scoped>
.result-screen {
  position: fixed; inset: 0; z-index: 100;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 2rem;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
}

.confetti-canvas {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
}

.result-glow {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
}
.result-glow.win  { background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(200,168,75,0.2) 0%, transparent 70%); }
.result-glow.lose { background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(139,0,0,0.3)  0%, transparent 70%); }

/* Texto principal */
.result-main {
  position: relative; z-index: 2;
  opacity: 0; transform: scale(1.3);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275);
}
.result-main.visible { opacity: 1; transform: scale(1); }

.result-title {
  font-family: var(--font-title);
  font-size: clamp(2.5rem, 8vw, 6rem);
  letter-spacing: 0.12em; line-height: 1;
}
.result-title.win {
  color: var(--gold-bright);
  text-shadow: 0 0 30px rgba(240,208,96,0.9), 0 0 80px rgba(200,168,75,0.4), 4px 4px 0 rgba(100,60,0,1);
}
.result-title.lose {
  color: var(--blood-light);
  text-shadow: 0 0 30px rgba(192,57,43,1), 0 0 80px rgba(139,0,0,0.5), 4px 4px 0 #000;
}

.result-subtitle {
  font-family: var(--font-display);
  font-size: clamp(0.8rem, 2.5vw, 1.2rem);
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--gold); margin: 0.6rem 0 1.5rem;
}

/* Stats */
.result-stats {
  display: flex; align-items: center; gap: 2rem;
  justify-content: center; margin-bottom: 2rem;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.result-stats.visible { opacity: 1; transform: translateY(0); }

.stat-item { text-align: center; }
.stat-val {
  font-family: var(--font-title);
  font-size: 1.8rem; color: var(--gold-bright);
  text-shadow: 0 0 15px rgba(240,208,96,0.5);
}
.stat-lbl {
  font-family: var(--font-display);
  font-size: 0.62rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--text-muted);
}

.stat-divider {
  width: 1px; height: 40px;
  background: linear-gradient(180deg, transparent, var(--gold-dim), transparent);
}

/* Botones */
.result-buttons {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; gap: 0.8rem;
  width: 100%; max-width: 320px;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.result-buttons.visible { opacity: 1; transform: translateY(0); }
.result-buttons .btn { width: 100%; padding: 0.9rem; justify-content: center; }

/* Transición */
.result-appear-enter-active { animation: resultFadeIn 0.4s ease; }
.result-appear-leave-active { transition: opacity 0.3s; }
.result-appear-leave-to     { opacity: 0; }
@keyframes resultFadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
