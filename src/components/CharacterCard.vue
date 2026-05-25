<template>
  <div
    class="character-card"
    :class="[char.type, { active: isHovered, selected: isSelected }]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="emit('select', char)"
  >
    <!-- Esquinas decorativas -->
    <span class="corner-tl"></span>
    <span class="corner-tr"></span>
    <span class="corner-bl"></span>
    <span class="corner-br"></span>

    <!-- Brillo de fondo al hover -->
    <div class="card-glow"></div>

    <!-- Imagen -->
    <div class="card-img-wrapper">
      <img :src="char.image" :alt="char.name" class="char-img" />
      <div class="img-gradient"></div>
    </div>

    <!-- Cuerpo -->
    <div class="card-body">
      <div class="char-name">{{ char.name }}</div>
      <div class="char-skill-tag" :class="char.type">{{ char.skill }}</div>

      <!-- Stats dinámicos según personaje -->
      <div class="stats-list" v-if="showStats">
        <template v-if="char.type === 'segua'">
          <StatBar label="Poder"      :value="char.power"     :max="5" />
          <StatBar label="Velocidad"  :value="char.speed"     :max="5" />
          <StatBar label="Misticismo" :value="char.mysticism"  :max="5" :accent="true" />
        </template>
        <template v-else-if="char.type === 'cadejos'">
          <StatBar label="Poder"     :value="char.power"   :max="5" :accent="true" />
          <StatBar label="Velocidad" :value="char.speed"   :max="5" />
          <StatBar label="Defensa"   :value="char.defense" :max="5" />
        </template>
        <template v-else>
          <StatBar label="Poder"     :value="char.power" :max="5" />
          <StatBar label="Velocidad" :value="char.speed"  :max="5" />
          <StatBar label="Alcance"   :value="char.range"  :max="5" :accent="true" />
        </template>
      </div>
    </div>

    <!-- Badge de seleccionado -->
    <transition name="select-flash">
      <div v-if="isSelected" class="selected-overlay">
        <div class="selected-text">SELECCIONADO</div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref } from 'vue'
import StatBar from './StatBar.vue'

export default {
  name: 'CharacterCard',
  components: { StatBar },
  props: {
    char:       { type: Object,  required: true },
    isSelected: { type: Boolean, default: false },
    showStats:  { type: Boolean, default: true  },
  },
  emits: ['select'],

  setup(props, { emit }) {
    const isHovered = ref(false)
    return { isHovered, emit }
  }
}
</script>

<style scoped>
.character-card {
  background: var(--bg-card);
  border: 1px solid rgba(200,168,75,0.2);
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.3s;
  animation: cardIn 0.5s ease-out both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(40px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0)    scale(1);   }
}

/* Esquinas */
.corner-tl, .corner-tr, .corner-bl, .corner-br {
  position: absolute;
  width: 16px; height: 16px;
  border-color: var(--gold);
  border-style: solid;
  z-index: 3;
  pointer-events: none;
  transition: width 0.3s, height 0.3s;
}
.corner-tl { top:-1px;    left:-1px;   border-width: 2px 0 0 2px; }
.corner-tr { top:-1px;    right:-1px;  border-width: 2px 2px 0 0; }
.corner-bl { bottom:-1px; left:-1px;   border-width: 0 0 2px 2px; }
.corner-br { bottom:-1px; right:-1px;  border-width: 0 2px 2px 0; }

.character-card.active .corner-tl,
.character-card.active .corner-tr,
.character-card.active .corner-bl,
.character-card.active .corner-br,
.character-card.selected .corner-tl,
.character-card.selected .corner-tr,
.character-card.selected .corner-bl,
.character-card.selected .corner-br { width: 28px; height: 28px; }

/* Glow */
.card-glow {
  position: absolute; inset: 0; z-index: 2;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
}
.segua  .card-glow { background: radial-gradient(ellipse at 50% 0%, rgba(160,216,239,0.15) 0%, transparent 70%); }
.cadejos .card-glow{ background: radial-gradient(ellipse at 50% 0%, rgba(192,57,43,0.2)  0%, transparent 70%); }
.padre  .card-glow  { background: radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.15)  0%, transparent 70%); }
.character-card.active .card-glow { opacity: 1; }

/* Hover / Selected */
.character-card.active   { transform: translateY(-8px) scale(1.02); border-color: rgba(200,168,75,0.6); }
.character-card.selected { transform: translateY(-6px) scale(1.01); border-color: var(--gold); box-shadow: 0 0 30px rgba(200,168,75,0.3); }
.cadejos.selected  { border-color: var(--blood-light); box-shadow: 0 0 30px rgba(192,57,43,0.3); }
.padre.selected    { border-color: var(--cyan-soul);   box-shadow: 0 0 30px rgba(0,212,255,0.3); }

/* Imagen */
.card-img-wrapper {
  position: relative; overflow: hidden;
  aspect-ratio: 3/3.5; background: #08080f;
}
.char-img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
  filter: brightness(0.85) contrast(1.1);
  transition: filter 0.4s, transform 0.5s;
}
.character-card.active .char-img,
.character-card.selected .char-img {
  filter: brightness(1) contrast(1.15) saturate(1.1);
  transform: scale(1.06);
}
.img-gradient {
  position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(0deg, var(--bg-card) 0%, transparent 100%);
}

/* Body */
.card-body { padding: 1rem 1.1rem 1.2rem; position: relative; z-index: 1; }
.char-name {
  font-family: var(--font-display);
  font-size: 1.05rem; font-weight: 700;
  color: #fff; letter-spacing: 0.06em; margin-bottom: 0.2rem;
}
.char-skill-tag {
  font-size: 0.68rem; letter-spacing: 0.18em;
  text-transform: uppercase; margin-bottom: 0.8rem;
}
.char-skill-tag.segua   { color: #a0d8ef; }
.char-skill-tag.cadejos { color: var(--blood-light); }
.char-skill-tag.padre   { color: var(--cyan-soul); }

/* Selected overlay */
.selected-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(200,168,75,0.08); pointer-events: none;
}
.selected-text {
  font-family: var(--font-title);
  font-size: 1rem; letter-spacing: 0.2em;
  color: var(--gold-bright);
  text-shadow: 0 0 20px rgba(240,208,96,0.9);
  animation: selectedPulse 1.5s ease-in-out infinite;
}
@keyframes selectedPulse { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }

.select-flash-enter-active { animation: flashIn 0.3s ease-out; }
.select-flash-leave-active { transition: opacity 0.2s; }
.select-flash-leave-to     { opacity: 0; }
@keyframes flashIn {
  0%  { opacity:0; transform:scale(1.1); }
  60% { opacity:1; transform:scale(1); }
}
</style>
