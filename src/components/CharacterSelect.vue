<template>
  <div class="character-select">

    <div class="select-header" :class="{ visible: ready }">
      <button class="btn-back" @click="emit('go-to', 'home')">‹ Volver</button>
      <h2 class="select-title">SELECCIONA TU LEYENDA</h2>
      <div class="select-hint">Elige tu personaje para la batalla</div>
    </div>

    <div class="characters-grid" :class="{ visible: ready }">
      <CharacterCard
        v-for="(char, i) in characters"
        :key="char.id"
        :char="char"
        :isSelected="selectedId === char.id"
        :showStats="true"
        :style="{ animationDelay: i * 0.15 + 's' }"
        @select="onSelect"
      />
    </div>

    <!-- Barra de confirmación -->
    <transition name="slide-up-btn">
      <div v-if="selectedId" class="confirm-row">
        <div class="confirm-char-preview">
          <img :src="selectedChar.portrait || selectedChar.image" :alt="selectedChar.name" />
          <div class="confirm-info">
            <div class="confirm-name">{{ selectedChar.name }}</div>
            <div class="confirm-skill">{{ selectedChar.skill }}</div>
          </div>
        </div>
        <button class="btn btn-primary confirm-btn" @click="confirm">
          <span>⚔ IR A LA BATALLA</span>
          <span class="btn-arrow">›</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import CharacterCard from './CharacterCard.vue'

export default {
  name: 'CharacterSelect',
  components: { CharacterCard },
  props: { characters: Array },
  emits: ['select-character', 'go-to'],

  setup(props, { emit }) {
    const ready      = ref(false)
    const selectedId = ref(null)

    const selectedChar = computed(() =>
      props.characters?.find(c => c.id === selectedId.value)
    )

    onMounted(() => setTimeout(() => { ready.value = true }, 100))

    function onSelect(char) {
      selectedId.value = selectedId.value === char.id ? null : char.id
      // Flash de pantalla
      const el = document.querySelector('.character-select')
      if (el) {
        el.style.transition = 'none'
        el.style.filter = 'brightness(1.8)'
        setTimeout(() => {
          el.style.transition = 'filter 0.4s ease'
          el.style.filter = 'brightness(1)'
        }, 80)
      }
    }

    function confirm() {
      if (selectedChar.value) emit('select-character', selectedChar.value)
    }

    return { ready, selectedId, selectedChar, onSelect, confirm, emit }
  }
}
</script>

<style scoped>
.character-select {
  position: relative; min-height: 100vh;
  display: flex; flex-direction: column; align-items: center;
  padding: 2rem 1.5rem 7rem; z-index: 1;
  background: radial-gradient(ellipse 100% 60% at 50% 0%, rgba(139,0,0,0.18) 0%, transparent 55%);
}

/* Header */
.select-header {
  width: 100%; max-width: 960px; text-align: center;
  margin-bottom: 2.5rem;
  opacity: 0; transform: translateY(-20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  position: relative;
}
.select-header.visible { opacity: 1; transform: translateY(0); }

.btn-back {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--gold-dim);
  font-family: var(--font-display); font-size: 0.8rem;
  letter-spacing: 0.1em; cursor: pointer; transition: color 0.2s;
}
.btn-back:hover { color: var(--gold); }

.select-title {
  font-family: var(--font-title);
  font-size: clamp(1.2rem, 4vw, 2.2rem);
  color: var(--gold-bright); letter-spacing: 0.2em;
  text-shadow: 0 0 20px rgba(240,208,96,0.5); margin-bottom: 0.3rem;
}
.select-hint {
  font-family: var(--font-display);
  font-size: 0.75rem; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--text-muted);
}

/* Grid */
.characters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem; width: 100%; max-width: 960px;
  opacity: 0; transform: translateY(30px);
  transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
}
.characters-grid.visible { opacity: 1; transform: translateY(0); }

/* Confirm */
.confirm-row {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: linear-gradient(0deg, rgba(5,5,8,0.98) 0%, rgba(13,13,20,0.9) 100%);
  border-top: 1px solid rgba(200,168,75,0.3);
  padding: 1rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
  gap: 1.5rem; z-index: 50;
}
.slide-up-btn-enter-active { animation: slideUpBtn 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
.slide-up-btn-leave-active { transition: transform 0.2s, opacity 0.2s; }
.slide-up-btn-leave-to     { transform: translateY(100%); opacity: 0; }
@keyframes slideUpBtn {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.confirm-char-preview { display: flex; align-items: center; gap: 1rem; }
.confirm-char-preview img {
  height: 60px; width: 60px;
  object-fit: contain; object-position: center;
  border: 1px solid rgba(200,168,75,0.4);
}
.confirm-name { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--gold-bright); }
.confirm-skill { font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); }

.confirm-btn {
  min-width: 220px;
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  padding: 0.9rem 1.8rem; font-size: 0.85rem;
}
.btn-arrow { opacity: 0.6; transition: transform 0.2s; }
.confirm-btn:hover .btn-arrow { transform: translateX(5px); opacity: 1; }

@media (max-width: 768px) {
  .characters-grid { grid-template-columns: 1fr; max-width: 350px; }
  .confirm-row { flex-direction: column; padding: 0.8rem 1rem; }
  .btn-back { position: static; margin-bottom: 0.5rem; }
  .select-header { text-align: center; }
}
</style>
