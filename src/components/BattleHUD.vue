<template>
  <div class="battle-hud" :class="{ visible }">

    <!-- HP Jugador -->
    <div class="hud-side left">
      <HealthBar
        :name="playerChar.name"
        :hp="playerHp"
        :reversed="false"
      />
    </div>

    <!-- Centro: VS + Timer + Ronda -->
    <div class="hud-center">
      <div class="hud-vs">VS</div>
      <div class="hud-timer" :class="{ warning: timeLeft <= 10 }">
        {{ String(timeLeft).padStart(2, '0') }}
      </div>
      <div class="hud-round">RONDA {{ round }}</div>
    </div>

    <!-- HP Enemigo -->
    <div class="hud-side right">
      <HealthBar
        :name="enemyChar.name"
        :hp="enemyHp"
        :reversed="true"
      />
    </div>

    <!-- Línea inferior decorativa -->
    <div class="hud-bottom-line"></div>
  </div>
</template>

<script>
import HealthBar from './HealthBar.vue'

export default {
  name: 'BattleHUD',
  components: { HealthBar },
  props: {
    playerChar: { type: Object,  required: true },
    enemyChar:  { type: Object,  required: true },
    playerHp:   { type: Number,  default: 100 },
    enemyHp:    { type: Number,  default: 100 },
    timeLeft:   { type: Number,  default: 60  },
    round:      { type: Number,  default: 1   },
    visible:    { type: Boolean, default: false },
  }
}
</script>

<style scoped>
.battle-hud {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1rem 2rem 0.8rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.92) 0%, transparent 100%);
  position: relative; z-index: 10;
  opacity: 0; transform: translateY(-20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.battle-hud.visible { opacity: 1; transform: translateY(0); }

.battle-hud::after {
  content: '';
  position: absolute; bottom: 0; left: 3%; right: 3%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--blood), var(--gold), var(--blood), transparent);
}

/* Lados */
.hud-side { display: flex; flex-direction: column; gap: 0.3rem; }
.hud-side.right { align-items: flex-end; }

/* Centro */
.hud-center { text-align: center; padding: 0 1.5rem; }

.hud-vs {
  font-family: var(--font-title);
  font-size: 1.3rem; color: var(--gold-bright);
  text-shadow: 0 0 15px rgba(240,208,96,0.8), 2px 2px 0 rgba(139,0,0,1);
  animation: vsPulse 2s ease-in-out infinite;
}
@keyframes vsPulse {
  0%,100% { filter: brightness(1); }
  50%     { filter: brightness(1.3); }
}

.hud-timer {
  font-family: var(--font-title);
  font-size: 2.4rem; line-height: 1;
  color: var(--gold-bright);
  text-shadow: 0 0 20px rgba(240,208,96,0.6);
  transition: color 0.3s;
}
.hud-timer.warning {
  color: var(--blood-light);
  text-shadow: 0 0 20px rgba(192,57,43,0.9);
  animation: timerWarn 0.3s ease-in-out infinite;
}
@keyframes timerWarn {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.1); }
}

.hud-round {
  font-family: var(--font-display);
  font-size: 0.6rem; letter-spacing: 0.25em;
  color: var(--text-muted); text-transform: uppercase;
}

.hud-bottom-line {
  grid-column: 1 / -1; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,168,75,0.2), transparent);
}

@media (max-width: 768px) {
  .battle-hud { padding: 0.7rem 1rem 0.5rem; }
  .hud-center { padding: 0 0.8rem; }
  .hud-timer  { font-size: 1.8rem; }
}
</style>
