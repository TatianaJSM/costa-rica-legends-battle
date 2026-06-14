<template>
  <div class="cinematic-intro" :class="{ 'video-mode': phase === 0 }">
    <!-- REPRODUCTOR DE VIDEO SEQUENCIAL -->
    <div v-if="phase === 0 && currentVideoSrc" class="video-container">
      <div class="video-header">
        <span class="video-subtitle">Presentando a...</span>
        <h2 class="video-title">{{ currentVideoTitle }}</h2>
      </div>

      <video
        ref="videoPlayer"
        :key="currentVideoSrc"
        :src="currentVideoSrc"
        autoplay
        playsinline
        class="intro-video-element"
        @ended="handleVideoEnded"
      ></video>

      <button class="btn-skip-intro" @click="skipVideos">
        Saltar Intro <span class="skip-arrow">≫</span>
      </button>
    </div>

    <!-- CARTA DE PERSONAJES / VS (ANIMACIÓN NORMAL) -->
    <template v-else>
      <div class="intro-fog"></div>
      <div class="intro-stage">{{ selectedStage?.name }}</div>

      <div class="intro-fighter intro-player" :class="[player?.type, { active: phase >= 1 }]">
        <img :src="getCharacterSprite(player, 'idle')" :alt="player?.name" loading="eager" decoding="async" />
        <div class="intro-copy">
          <span>Tu leyenda</span>
          <strong>{{ player?.name }}</strong>
          <small>{{ player?.skill }}</small>
          <p>{{ player?.description }}</p>
        </div>
      </div>

      <div class="intro-vs" :class="{ active: phase >= 3 }">VS</div>

      <div class="intro-fighter intro-enemy" :class="[enemy?.type, { active: phase >= 2 }]">
        <img :src="getCharacterSprite(enemy, 'idle')" :alt="enemy?.name" loading="eager" decoding="async" />
        <div class="intro-copy">
          <span>Rival</span>
          <strong>{{ enemy?.name }}</strong>
          <small>{{ enemy?.skill }}</small>
          <p>{{ enemy?.description }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'

import seguaIntro from '../assets/videos/segua_intro.mp4'
import cadejosIntro from '../assets/videos/cadejos_intro.mp4'
import padreIntro from '../assets/videos/padre_intro.mp4'

const videoMap = {
  segua: seguaIntro,
  cadejos: cadejosIntro,
  padre: padreIntro
}

export default {
  name: 'CinematicIntro',
  props: {
    player: { type: Object, default: null },
    enemy: { type: Object, default: null },
    phase: { type: Number, default: 0 }, // Empezamos en la fase 0 para reproducir los videos
    selectedStage: { type: Object, default: null }
  },
  emits: ['videos-done', 'skip'],
  setup(props, { emit }) {
    const videoPlayer = ref(null)
    const currentStep = ref('player-video')
    const currentVideoSrc = ref('')
    const currentVideoTitle = ref('')

    const playerVideo = computed(() => videoMap[props.player?.type])
    const enemyVideo = computed(() => videoMap[props.enemy?.type])

    function startVideoSequence() {
      if (playerVideo.value) {
        currentStep.value = 'player-video'
        currentVideoSrc.value = playerVideo.value
        currentVideoTitle.value = props.player?.name || 'Tu Leyenda'
      } else if (enemyVideo.value) {
        currentStep.value = 'enemy-video'
        currentVideoSrc.value = enemyVideo.value
        currentVideoTitle.value = props.enemy?.name || 'Rival'
      } else {
        // Si no hay videos para ninguno de los dos, ir directo a la intro normal
        emit('videos-done')
      }
    }

    function handleVideoEnded() {
      if (currentStep.value === 'player-video') {
        if (enemyVideo.value) {
          currentStep.value = 'enemy-video'
          currentVideoSrc.value = enemyVideo.value
          currentVideoTitle.value = props.enemy?.name || 'Rival'
        } else {
          emit('videos-done')
        }
      } else if (currentStep.value === 'enemy-video') {
        emit('videos-done')
      }
    }

    function skipVideos() {
      emit('skip')
    }

    function getCharacterSprite(character, state = 'idle') {
      const sprite = character?.sprites?.[state]
      if (Array.isArray(sprite)) return sprite[0] || character?.image || ''
      return sprite || character?.image || ''
    }

    // Intentar reproducir el video de forma robusta
    function attemptPlay() {
      if (videoPlayer.value) {
        videoPlayer.value.play().catch(err => {
          console.warn("Autoplay bloqueado con sonido, intentando con mute...", err)
          if (videoPlayer.value) {
            videoPlayer.value.muted = true
            videoPlayer.value.play().catch(playErr => {
              console.error("No se pudo reproducir el video:", playErr)
              // En caso de error fatal, saltamos al siguiente paso para que no se pegue el juego
              handleVideoEnded()
            })
          }
        })
      }
    }

    onMounted(() => {
      if (props.phase === 0) {
        startVideoSequence()
        // Dar un pequeño delay para asegurar que el DOM del video cargó
        setTimeout(attemptPlay, 150)
      }
    })

    watch(currentVideoSrc, () => {
      nextTick(() => {
        attemptPlay()
      })
    })

    return {
      videoPlayer,
      currentVideoSrc,
      currentVideoTitle,
      handleVideoEnded,
      skipVideos,
      getCharacterSprite
    }
  }
}
</script>

<style scoped>
.cinematic-intro {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(1rem, 4vw, 3rem);
  padding: clamp(1rem, 4vw, 4rem);
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 48%, rgba(200, 168, 75, 0.16), transparent 30%),
    radial-gradient(circle at 80% 42%, rgba(0, 212, 255, 0.14), transparent 28%),
    linear-gradient(120deg, rgba(4, 4, 8, 0.98), rgba(13, 5, 8, 0.96));
}

/* Modo Video */
.cinematic-intro.video-mode {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.intro-video-element {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  z-index: 1;
}

.video-header {
  position: absolute;
  top: 2.5rem;
  left: 3.5rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  pointer-events: none;
  font-family: var(--font-display);
}

.video-subtitle {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.25rem;
}

.video-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-family: var(--font-title);
  color: var(--gold-bright);
  text-shadow: 0 0 20px rgba(240, 208, 96, 0.65);
  margin: 0;
  text-transform: uppercase;
}

.btn-skip-intro {
  position: absolute;
  bottom: 2.5rem;
  right: 3.5rem;
  z-index: 10;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--gold-bright);
  background: rgba(10, 10, 15, 0.75);
  border: 1px solid rgba(240, 208, 96, 0.45);
  padding: 0.75rem 1.4rem;
  cursor: pointer;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  transition: all 0.25s ease;
}

.btn-skip-intro:hover {
  background: rgba(240, 208, 96, 0.18);
  border-color: var(--gold-bright);
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(240, 208, 96, 0.25);
}

.skip-arrow {
  display: inline-block;
  margin-left: 0.3rem;
  font-weight: bold;
}

.intro-fog {
  position: absolute;
  inset: -20%;
  opacity: 0.22;
  filter: blur(34px);
  background:
    radial-gradient(circle at 20% 75%, rgba(255, 255, 255, 0.12), transparent 34%),
    radial-gradient(circle at 80% 20%, rgba(0, 212, 255, 0.16), transparent 30%);
  animation: introFog 5s ease-in-out infinite alternate;
}

.intro-stage {
  position: absolute;
  top: 1.4rem;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(240, 208, 96, 0.72);
  text-align: center;
}

@keyframes introFog {
  from { transform: translateX(-2%) scale(1); }
  to { transform: translateX(2%) scale(1.04); }
}

.intro-fighter {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: minmax(220px, 52vh) auto;
  align-items: end;
  min-width: 0;
  opacity: 0;
  filter: blur(10px);
  transition: opacity 0.7s ease, transform 0.7s ease, filter 0.7s ease;
}

.intro-player {
  transform: translateX(-12%) scale(1.08);
  justify-items: start;
}

.intro-enemy {
  transform: translateX(12%) scale(1.08);
  justify-items: end;
  text-align: right;
}

.intro-fighter.active {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.intro-fighter img {
  max-height: min(56vh, 560px);
  max-width: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 34px rgba(0, 0, 0, 0.95));
  animation: introZoom 3.8s ease-out both;
}

.intro-enemy img {
  transform: scaleX(-1);
}

.intro-fighter.segua img { filter: drop-shadow(0 0 34px rgba(160, 216, 239, 0.48)); }
.intro-fighter.cadejos img { filter: drop-shadow(0 0 34px rgba(192, 57, 43, 0.5)); }
.intro-fighter.padre img { filter: drop-shadow(0 0 34px rgba(0, 212, 255, 0.5)); }

@keyframes introZoom {
  from { scale: 0.94; }
  to { scale: 1.03; }
}

.intro-copy {
  max-width: 390px;
  padding-top: 1rem;
}

.intro-copy span,
.intro-copy small {
  display: block;
  font-family: var(--font-display);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.intro-copy span {
  color: var(--text-muted);
  font-size: 0.68rem;
}

.intro-copy strong {
  display: block;
  margin: 0.25rem 0;
  font-family: var(--font-title);
  font-size: clamp(1.6rem, 4vw, 3.2rem);
  line-height: 0.95;
  color: var(--gold-bright);
  text-shadow: 0 0 24px rgba(240, 208, 96, 0.5);
}

.intro-copy small {
  color: var(--cyan-soul);
  font-size: 0.74rem;
}

.intro-copy p {
  margin: 0.7rem 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-family: var(--font-display);
  font-size: 0.82rem;
  line-height: 1.6;
}

.intro-vs {
  position: relative;
  z-index: 3;
  font-family: var(--font-title);
  font-size: clamp(3rem, 9vw, 8rem);
  color: var(--gold-bright);
  opacity: 0;
  transform: scale(2.2);
  text-shadow:
    0 0 30px rgba(240, 208, 96, 0.95),
    4px 4px 0 rgba(139, 0, 0, 1);
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.intro-vs.active {
  opacity: 1;
  transform: scale(1);
}

@media (max-width: 760px) {
  .cinematic-intro {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto 1fr;
    gap: 0.3rem;
  }

  .intro-fighter {
    grid-template-columns: 42% 1fr;
    grid-template-rows: auto;
    gap: 0.8rem;
    align-items: center;
  }

  .intro-enemy {
    grid-template-columns: 1fr 42%;
  }

  .intro-enemy img {
    grid-column: 2;
    grid-row: 1;
  }

  .intro-enemy .intro-copy {
    grid-column: 1;
    grid-row: 1;
  }

  .intro-fighter img {
    max-height: 28vh;
  }

  .intro-copy p {
    display: none;
  }
}
</style>
