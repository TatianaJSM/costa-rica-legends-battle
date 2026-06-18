<template>
  <div class="healthbar-root" :class="{ reversed }">
    <div class="hb-name">{{ name }}</div>
    <div class="hb-wrap">
      <span class="hb-pct">{{ Math.round(hp) }}%</span>
      <div class="hb-track" :class="hpClass">
        <!-- Barra amarilla de daño retrasado -->
        <div class="hb-damage" :style="{ width: damagePct + '%' }"></div>
        <!-- Barra de vida real -->
        <div class="hb-fill" :style="{ width: hp + '%' }"></div>
        <!-- Brillo animado -->
        <div class="hb-shine"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'

export default {
  name: 'HealthBar',
  props: {
    name:     { type: String,  required: true },
    hp:       { type: Number,  default: 100 },
    reversed: { type: Boolean, default: false },
  },

  setup(props) {
    const damagePct = ref(props.hp)

    // La barra de daño sigue con retraso
    watch(() => props.hp, (newVal) => {
      setTimeout(() => { damagePct.value = newVal }, 500)
    })

    const hpClass = computed(() => {
      if (props.hp > 60) return 'hp-high'
      if (props.hp > 25) return 'hp-mid'
      return 'hp-low'
    })

    return { damagePct, hpClass }
  }
}
</script>

<style scoped>
.healthbar-root {
  display: flex; flex-direction: column; gap: 0.4rem;
}
.healthbar-root.reversed { align-items: flex-end; }

.hb-name {
  font-family: var(--font-display);
  font-size: 1rem; font-weight: 700;
  letter-spacing: 0.1em; color: var(--gold-bright);
  text-shadow: 2px 2px 0px #000;
}

.hb-wrap {
  display: flex; align-items: center; gap: 0.75rem;
}
.healthbar-root.reversed .hb-wrap { flex-direction: row-reverse; }

.hb-pct {
  font-family: var(--font-display);
  font-size: 0.95rem; letter-spacing: 0.05em;
  color: #fff; min-width: 3.5rem;
  text-shadow: 1.5px 1.5px 0px #000;
}

.hb-track {
  width: 330px; height: 26px;
  background: #0a0a0f;
  border: 2px solid var(--gold);
  position: relative; overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.6);
}

/* Barra de daño retrasada (amarilla/naranja) */
.hb-damage {
  position: absolute; top: 2px; bottom: 2px; left: 2px;
  background: rgba(255,180,0,0.35);
  transition: width 1.2s ease 0.5s;
}

/* Barra de vida */
.hb-fill {
  position: absolute; top: 2px; bottom: 2px; left: 2px;
  background: linear-gradient(90deg, #8b0000, #c0392b, #e74c3c);
  transition: width 0.4s ease;
  z-index: 1;
}

/* Brillo deslizante */
.hb-shine {
  position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  animation: shineSweep 3s ease-in-out infinite;
  z-index: 2;
}
@keyframes shineSweep {
  0%   { left: -60%; }
  100% { left: 120%; }
}

/* Colores según HP */
.hp-high .hb-fill { background: linear-gradient(90deg, #8b0000, #c0392b, #e74c3c); }
.hp-mid  .hb-fill { background: linear-gradient(90deg, #7a4800, #c07800, #e09000); }
.hp-low  .hb-fill {
  background: linear-gradient(90deg, #3a0000, #8b0000);
  animation: lowPulse 0.4s ease-in-out infinite;
}
@keyframes lowPulse {
  0%,100% { filter: brightness(1); }
  50%     { filter: brightness(1.5); }
}

@media (max-width: 768px) {
  .hb-track { width: 180px; height: 18px; border-width: 1.5px; }
  .hb-pct { font-size: 0.75rem; min-width: 2.5rem; }
  .hb-name { font-size: 0.8rem; }
}
</style>
