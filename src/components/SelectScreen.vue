<template>
  <div class="mk-select-screen">
    <!-- Fondo atmosférico -->
    <div class="select-bg"></div>
    <div class="select-fog"></div>
    <div class="select-vignette"></div>

    <!-- Botón volver -->
    <button class="btn-back" @click="emit('go-to', 'home')">
      ‹ Volver
    </button>

    <!-- Título -->
    <div class="select-title-block" :class="{ visible: ready }">
      <div class="eyebrow">Costa Rica Legends Battle</div>
      <h2>SELECCIONA TU LEYENDA</h2>
      <p>Elige tu luchador para entrar a la arena</p>
    </div>

    <!-- Preview principal -->
    <section class="versus-preview" :class="{ visible: ready }">
      <!-- Jugador -->
      <div class="fighter-preview player-preview" :class="previewChar?.type">
        <div class="fighter-glow"></div>

        <div class="fighter-label p1">P1</div>

        <img
          v-if="previewChar"
          :src="previewChar.portrait || previewChar.image"
          :alt="previewChar.name"
          class="fighter-big-img"
        />

        <div class="fighter-shadow"></div>

        <div class="fighter-info left-info">
          <h3>{{ previewChar?.name || 'Selecciona' }}</h3>
          <span>{{ previewChar?.skill || 'Habilidad' }}</span>
        </div>
      </div>

      <!-- VS -->
      <div class="vs-center">
        <div class="vs-text">VS</div>
        <div class="vs-subtitle">BATALLA</div>
      </div>

      <!-- CPU -->
      <div class="fighter-preview enemy-preview" :class="enemyPreview?.type">
        <div class="fighter-glow"></div>

        <div class="fighter-label cpu">CPU</div>

        <img
          v-if="enemyPreview"
          :src="enemyPreview.portrait || enemyPreview.image"
          :alt="enemyPreview.name"
          class="fighter-big-img enemy-img"
        />

        <div class="fighter-shadow"></div>

        <div class="fighter-info right-info">
          <h3>{{ enemyPreview?.name || 'Rival' }}</h3>
          <span>{{ enemyPreview?.skill || 'Habilidad' }}</span>
        </div>
      </div>
    </section>

    <!-- Panel inferior -->
    <section class="roster-panel" :class="{ visible: ready }">
      <div class="roster-header">
        <span>Roster</span>
        <small>
          {{ selectedCharObj ? 'Personaje seleccionado' : 'Pasa el cursor y selecciona' }}
        </small>
      </div>

      <!-- Grid estilo MK -->
      <div class="roster-grid">
        <button
          v-for="(char, i) in characters"
          :key="char.id"
          class="roster-card"
          :class="[
            char.type,
            {
              active: activeChar?.id === char.id,
              selected: selectedId === char.id
            }
          ]"
          :style="{ animationDelay: i * 0.08 + 's' }"
          @mouseenter="hoveredChar = char.id; playSound('hover')"
          @mouseleave="hoveredChar = null"
          @click="selectChar(char)"
        >
          <span class="corner-tl"></span>
          <span class="corner-tr"></span>
          <span class="corner-bl"></span>
          <span class="corner-br"></span>

          <img :src="char.portrait || char.image" :alt="char.name" />

          <div class="roster-name">
            {{ shortName(char.name) }}
          </div>
        </button>
      </div>

      <!-- Info y stats del personaje activo -->
      <div v-if="activeChar" class="active-details" :class="activeChar.type">
        <div class="active-name">
          {{ activeChar.name }}
        </div>

        <div class="active-skill">
          {{ activeChar.skill }}
        </div>

        <div class="active-description">
          {{ activeChar.description }}
        </div>

        <div class="stats-list">
          <template v-if="activeChar.type === 'segua'">
            <StatBar label="Poder" :value="activeChar.power" :max="5" />
            <StatBar label="Velocidad" :value="activeChar.speed" :max="5" />
            <StatBar label="Misticismo" :value="activeChar.mysticism" :max="5" :accent="true" />
          </template>

          <template v-else-if="activeChar.type === 'cadejos'">
            <StatBar label="Poder" :value="activeChar.power" :max="5" :accent="true" />
            <StatBar label="Velocidad" :value="activeChar.speed" :max="5" />
            <StatBar label="Defensa" :value="activeChar.defense" :max="5" />
          </template>

          <template v-else>
            <StatBar label="Poder" :value="activeChar.power" :max="5" />
            <StatBar label="Velocidad" :value="activeChar.speed" :max="5" />
            <StatBar label="Alcance" :value="activeChar.range" :max="5" :accent="true" />
          </template>
        </div>
      </div>
    </section>

    <!-- Confirmación -->
    <transition name="confirm-in">
      <div v-if="selectedCharObj" class="confirm-bar">
        <div class="confirm-left">
          <img :src="selectedCharObj.portrait || selectedCharObj.image" :alt="selectedCharObj.name" />

          <div>
            <span>Seleccionado</span>
            <strong>{{ selectedCharObj.name }}</strong>
          </div>
        </div>

        <button class="btn btn-primary confirm-btn" @mouseenter="playSound('hover')" @click="confirm">
          ⚔ IR A LA BATALLA
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import StatBar from './StatBar.vue'
import { playSound } from '../modules/soundManager'

export default {
  name: 'SelectScreen',
  components: { StatBar },
  props: {
    characters: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-character', 'go-to'],

  setup(props, { emit }) {
    const ready = ref(false)
    const hoveredChar = ref(null)
    const selectedId = ref(null)

    const fallbackChar = computed(() => props.characters?.[0] || null)

    const selectedCharObj = computed(() =>
      props.characters?.find(c => c.id === selectedId.value) || null
    )

    const hoveredCharObj = computed(() =>
      props.characters?.find(c => c.id === hoveredChar.value) || null
    )

    const activeChar = computed(() =>
      hoveredCharObj.value || selectedCharObj.value || fallbackChar.value
    )

    const previewChar = computed(() =>
      selectedCharObj.value || hoveredCharObj.value || fallbackChar.value
    )

    const enemyPreview = computed(() => {
      const chars = props.characters || []
      if (!chars.length) return null

      const currentId = previewChar.value?.id
      const options = chars.filter(c => c.id !== currentId)

      return options[0] || chars[0]
    })

    onMounted(() => {
      setTimeout(() => {
        ready.value = true
      }, 120)
    })

    function selectChar(char) {
      if (!char) return

      if (selectedId.value === char.id) {
        selectedId.value = null
        return
      }

      selectedId.value = char.id
      playSound('select')
      flashScreen()
    }

    function confirm() {
      if (!selectedCharObj.value) return
      emit('select-character', selectedCharObj.value)
    }

    function flashScreen() {
      const el = document.querySelector('.mk-select-screen')
      if (!el) return

      el.classList.add('screen-flash')
      setTimeout(() => {
        el.classList.remove('screen-flash')
      }, 180)
    }

    function shortName(name = '') {
      return name
        .replace('El ', '')
        .replace('La ', '')
        .replace('sin Cabeza', 'S/C')
    }

    return {
      ready,
      hoveredChar,
      selectedId,
      selectedCharObj,
      hoveredCharObj,
      activeChar,
      previewChar,
      enemyPreview,
      selectChar,
      confirm,
      shortName,
      emit,
      playSound
    }
  }
}
</script>

<style scoped>
.mk-select-screen {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 1.4rem 1.8rem 7rem;
  background: #030307;
  color: var(--text-primary);
  z-index: 1;
}

/* Fondo */
.select-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(139, 0, 0, 0.25), transparent 32%),
    radial-gradient(circle at 80% 28%, rgba(0, 212, 255, 0.15), transparent 34%),
    radial-gradient(circle at 50% 100%, rgba(200, 168, 75, 0.13), transparent 35%),
    linear-gradient(180deg, #06060c 0%, #020205 100%);
  z-index: 0;
}

.select-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(circle at center, black 0%, transparent 75%);
}

.select-fog {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 30% 85%, rgba(255,255,255,0.07), transparent 28%),
    radial-gradient(circle at 70% 82%, rgba(0,212,255,0.08), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(200,168,75,0.08), transparent 36%);
  filter: blur(18px);
  animation: fogMove 8s ease-in-out infinite alternate;
}

@keyframes fogMove {
  from { transform: translateX(-2%) translateY(1%); }
  to { transform: translateX(2%) translateY(-1%); }
}

.select-vignette {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 18%, transparent 75%, rgba(0,0,0,0.82)),
    radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.68) 100%);
}

/* Flash */
.mk-select-screen.screen-flash::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.18);
  z-index: 999;
  pointer-events: none;
  animation: flashOut 0.18s ease forwards;
}

@keyframes flashOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Volver */
.btn-back {
  position: relative;
  z-index: 30;
  background: rgba(5,5,8,0.65);
  border: 1px solid rgba(200,168,75,0.28);
  color: var(--gold);
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.65rem 1rem;
  cursor: pointer;
  transition: 0.25s ease;
}

.btn-back:hover {
  color: var(--gold-bright);
  border-color: var(--gold);
  background: rgba(200,168,75,0.08);
}

/* Título */
.select-title-block {
  position: relative;
  z-index: 5;
  text-align: center;
  margin-top: -1.9rem;
  opacity: 0;
  transform: translateY(-18px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.select-title-block.visible {
  opacity: 1;
  transform: translateY(0);
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.select-title-block h2 {
  font-family: var(--font-title);
  color: var(--gold-bright);
  font-size: clamp(1.4rem, 3.2vw, 2.8rem);
  letter-spacing: 0.22em;
  margin: 0.25rem 0;
  text-shadow: 0 0 28px rgba(240,208,96,0.55);
}

.select-title-block p {
  color: var(--text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* Preview grande */
.versus-preview {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 1.5rem;
  min-height: 49vh;
  margin-top: 0.8rem;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.65s ease 0.15s, transform 0.65s ease 0.15s;
}

.versus-preview.visible {
  opacity: 1;
  transform: translateY(0);
}

.fighter-preview {
  position: relative;
  height: 48vh;
  min-height: 320px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
}

.fighter-glow {
  position: absolute;
  bottom: 5%;
  width: 65%;
  height: 70%;
  border-radius: 50%;
  filter: blur(45px);
  opacity: 0.5;
}

.fighter-preview.segua .fighter-glow {
  background: rgba(160,216,239,0.24);
}

.fighter-preview.cadejos .fighter-glow {
  background: rgba(192,57,43,0.30);
}

.fighter-preview.padre .fighter-glow {
  background: rgba(0,212,255,0.28);
}

.fighter-big-img {
  position: relative;
  z-index: 2;
  max-height: 100%;
  max-width: 92%;
  object-fit: contain;
  object-position: bottom center;
  filter:
    drop-shadow(0 24px 26px rgba(0,0,0,0.9))
    drop-shadow(0 0 28px rgba(200,168,75,0.16))
    contrast(1.08)
    saturate(1.05);
  animation: idleFloat 3s ease-in-out infinite;
}

.enemy-img {
  transform: scaleX(-1);
  animation: idleFloatEnemy 3s ease-in-out infinite;
}

@keyframes idleFloat {
  0%,100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.01); }
}

@keyframes idleFloatEnemy {
  0%,100% { transform: scaleX(-1) translateY(0) scale(1); }
  50% { transform: scaleX(-1) translateY(-8px) scale(1.01); }
}

.fighter-shadow {
  position: absolute;
  bottom: -6px;
  width: 55%;
  height: 22px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.9), transparent 70%);
  filter: blur(5px);
  z-index: 1;
}

.fighter-label {
  position: absolute;
  top: 2rem;
  z-index: 4;
  font-family: var(--font-title);
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  padding: 0.35rem 0.75rem;
  background: rgba(0,0,0,0.55);
  border: 1px solid rgba(200,168,75,0.35);
}

.fighter-label.p1 {
  left: 10%;
  color: var(--gold-bright);
}

.fighter-label.cpu {
  right: 10%;
  color: var(--cyan-soul);
}

.fighter-info {
  position: absolute;
  bottom: 0.1rem;
  z-index: 6;
  min-width: 260px;
  padding: 0.8rem 1rem;
  background: linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.2));
  border-top: 1px solid rgba(200,168,75,0.3);
}

.left-info {
  left: 7%;
  text-align: left;
}

.right-info {
  right: 7%;
  text-align: right;
  background: linear-gradient(270deg, rgba(0,0,0,0.78), rgba(0,0,0,0.2));
}

.fighter-info h3 {
  color: #fff;
  font-family: var(--font-display);
  font-size: clamp(1rem, 2.3vw, 1.8rem);
  letter-spacing: 0.12em;
  margin-bottom: 0.1rem;
}

.fighter-info span {
  color: var(--gold);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* VS */
.vs-center {
  align-self: center;
  text-align: center;
  min-width: 120px;
  z-index: 10;
}

.vs-text {
  font-family: var(--font-title);
  font-size: clamp(2.8rem, 7vw, 6rem);
  color: var(--gold-bright);
  text-shadow:
    0 0 20px rgba(240,208,96,0.9),
    0 0 70px rgba(139,0,0,0.65);
  animation: vsPulse 2s ease-in-out infinite;
}

.vs-subtitle {
  margin-top: -0.8rem;
  font-family: var(--font-display);
  color: var(--text-muted);
  letter-spacing: 0.35em;
  font-size: 0.65rem;
}

@keyframes vsPulse {
  0%,100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.07); filter: brightness(1.25); }
}

/* Roster */
.roster-panel {
  position: relative;
  z-index: 25;
  width: min(980px, 100%);
  margin: -0.2rem auto 0;
  background: linear-gradient(180deg, rgba(10,10,16,0.88), rgba(3,3,7,0.96));
  border: 1px solid rgba(200,168,75,0.26);
  box-shadow:
    0 0 40px rgba(0,0,0,0.75),
    inset 0 0 35px rgba(200,168,75,0.035);
  backdrop-filter: blur(10px);
  padding: 0.9rem;
  opacity: 0;
  transform: translateY(25px);
  transition: opacity 0.65s ease 0.35s, transform 0.65s ease 0.35s;
}

.roster-panel.visible {
  opacity: 1;
  transform: translateY(0);
}

.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  border-bottom: 1px solid rgba(200,168,75,0.13);
  padding-bottom: 0.55rem;
}

.roster-header span {
  font-family: var(--font-display);
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.75rem;
}

.roster-header small {
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.62rem;
}

.roster-grid {
  display: grid;
  grid-template-columns: repeat(3, 92px);
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.8rem;
}

.roster-card {
  position: relative;
  height: 92px;
  background: #07070d;
  border: 1px solid rgba(200,168,75,0.22);
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  animation: rosterIn 0.45s ease both;
  transition: 0.25s ease;
}

@keyframes rosterIn {
  from { opacity: 0; transform: translateY(20px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.roster-card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: brightness(0.72) contrast(1.12);
  transition: 0.3s ease;
}

.roster-card:hover,
.roster-card.active,
.roster-card.selected {
  transform: translateY(-5px);
  border-color: var(--gold-bright);
  box-shadow: 0 0 18px rgba(240,208,96,0.35);
}

.roster-card.active img,
.roster-card.selected img {
  filter: brightness(1.08) contrast(1.18) saturate(1.12);
  transform: scale(1.08);
}

.roster-card.selected {
  border-color: var(--gold-bright);
  box-shadow:
    0 0 20px rgba(240,208,96,0.45),
    inset 0 0 20px rgba(240,208,96,0.08);
}

.roster-card.cadejos.selected {
  border-color: var(--blood-light);
  box-shadow: 0 0 20px rgba(192,57,43,0.45);
}

.roster-card.padre.selected {
  border-color: var(--cyan-soul);
  box-shadow: 0 0 20px rgba(0,212,255,0.45);
}

.roster-name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.25rem;
  background: linear-gradient(0deg, rgba(0,0,0,0.92), transparent);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
}

/* Esquinas */
.corner-tl,
.corner-tr,
.corner-bl,
.corner-br {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--gold);
  border-style: solid;
  z-index: 3;
  opacity: 0;
  transition: 0.25s ease;
}

.corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
.corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
.corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
.corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

.roster-card:hover .corner-tl,
.roster-card:hover .corner-tr,
.roster-card:hover .corner-bl,
.roster-card:hover .corner-br,
.roster-card.selected .corner-tl,
.roster-card.selected .corner-tr,
.roster-card.selected .corner-bl,
.roster-card.selected .corner-br {
  opacity: 1;
}

/* Detalles */
.active-details {
  display: grid;
  grid-template-columns: 180px 150px 1fr 210px;
  gap: 0.8rem;
  align-items: center;
  border-top: 1px solid rgba(200,168,75,0.12);
  padding-top: 0.75rem;
}

.active-name {
  font-family: var(--font-display);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.82rem;
}

.active-skill {
  color: var(--gold);
  font-size: 0.68rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.active-details.segua .active-skill {
  color: #a0d8ef;
}

.active-details.cadejos .active-skill {
  color: var(--blood-light);
}

.active-details.padre .active-skill {
  color: var(--cyan-soul);
}

.active-description {
  color: var(--text-muted);
  font-size: 0.68rem;
  line-height: 1.4;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* Confirm */
.confirm-bar {
  position: fixed;
  z-index: 60;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(0deg, rgba(0,0,0,0.96), rgba(8,8,14,0.92));
  border-top: 1px solid rgba(200,168,75,0.35);
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.confirm-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.confirm-left img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  object-position: center;
  border: 1px solid rgba(200,168,75,0.38);
}

.confirm-left span {
  display: block;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.62rem;
}

.confirm-left strong {
  display: block;
  color: var(--gold-bright);
  letter-spacing: 0.1em;
}

.confirm-btn {
  min-width: 230px;
  justify-content: center;
}

.confirm-in-enter-active {
  animation: confirmIn 0.35s ease-out;
}

.confirm-in-leave-active {
  transition: transform 0.25s, opacity 0.25s;
}

.confirm-in-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@keyframes confirmIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 900px) {
  .mk-select-screen {
    padding: 1rem 1rem 8rem;
    overflow-y: auto;
  }

  .select-title-block {
    margin-top: 1rem;
  }

  .versus-preview {
    grid-template-columns: 1fr;
    gap: 0.3rem;
    min-height: auto;
  }

  .fighter-preview {
    height: 32vh;
    min-height: 240px;
  }

  .vs-center {
    order: 2;
    margin: -0.5rem 0;
  }

  .enemy-preview {
    display: none;
  }

  .fighter-info {
    min-width: 200px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    text-align: center;
  }

  .roster-grid {
    grid-template-columns: repeat(3, 78px);
  }

  .roster-card {
    height: 78px;
  }

  .active-details {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .confirm-bar {
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
  }

  .confirm-btn {
    width: 100%;
  }
}
</style>