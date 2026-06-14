<template>
  <div class="cinematic-intro" :class="{ 'video-mode': phase === 0 }">
    <!-- REPRODUCTOR DE VIDEO SEQUENCIAL -->
    <div v-if="phase === 0 && (playerVideo || enemyVideo)" class="video-container">
      <div class="video-header" :key="currentStep">
        <span class="video-subtitle">Presentando a...</span>
        <h2 class="video-title">{{ currentVideoTitle }}</h2>
      </div>

      <!-- Video del Jugador (precargado y autoejecutado) -->
      <video
        v-show="currentStep === 'player-video'"
        ref="playerVideoPlayer"
        :src="playerVideo"
        preload="auto"
        autoplay
        playsinline
        class="intro-video-element"
        @playing="clearWatchdog"
        @ended="handlePlayerVideoEnded"
        @error="handleVideoError"
      ></video>

      <!-- Video del Enemigo (precargado en paralelo) -->
      <video
        v-show="currentStep === 'enemy-video'"
        ref="enemyVideoPlayer"
        :src="enemyVideo"
        preload="auto"
        playsinline
        class="intro-video-element"
        @playing="clearWatchdog"
        @ended="handleEnemyVideoEnded"
        @error="handleVideoError"
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
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { preloadedVideos, videoMap } from '../data/videoCache'

export default {
  name: 'CinematicIntro',
  props: {
    player: { type: Object, default: null },
    enemy: { type: Object, default: null },
    phase: { type: Number, default: 0 },
    selectedStage: { type: Object, default: null }
  },
  emits: ['videos-done', 'skip'],
  setup(props, { emit }) {
    const playerVideoPlayer = ref(null)
    const enemyVideoPlayer = ref(null)
    const currentStep = ref('player-video')
    const currentVideoTitle = ref('')

    const playerVideo = computed(() => preloadedVideos.value[props.player?.type] || videoMap[props.player?.type])
    const enemyVideo = computed(() => preloadedVideos.value[props.enemy?.type] || videoMap[props.enemy?.type])

    let watchdogTimer = null
    let transitioning = false

    function startWatchdog() {
      clearTimeout(watchdogTimer)
      watchdogTimer = setTimeout(() => {
        console.warn("Watchdog: Tiempo límite de reproducción excedido, forzando salto...")
        if (currentStep.value === 'player-video') {
          handlePlayerVideoEnded()
        } else {
          handleEnemyVideoEnded()
        }
      }, 2500) // 2.5 segundos de gracia para iniciar o responder
    }

    function clearWatchdog() {
      clearTimeout(watchdogTimer)
    }

    function startVideoSequence() {
      if (playerVideo.value) {
        currentStep.value = 'player-video'
        currentVideoTitle.value = props.player?.name || 'Tu Leyenda'
        nextTick(() => {
          attemptPlayPlayer()
        })
      } else if (enemyVideo.value) {
        currentStep.value = 'enemy-video'
        currentVideoTitle.value = props.enemy?.name || 'Rival'
        nextTick(() => {
          attemptPlayEnemy()
        })
      } else {
        emit('videos-done')
      }
    }

    function attemptPlayPlayer() {
      startWatchdog()
      const player = playerVideoPlayer.value
      if (player) {
        player.play().catch(err => {
          console.warn("Player autoplay bloqueado con sonido, intentando en mute...", err)
          player.muted = true
          player.play().catch(playErr => {
            console.error("Error al reproducir el video del jugador:", playErr)
            handlePlayerVideoEnded()
          })
        })
      }
    }

    function attemptPlayEnemy() {
      startWatchdog()
      const enemy = enemyVideoPlayer.value
      if (enemy) {
        enemy.play().catch(err => {
          console.warn("Enemy autoplay bloqueado con sonido, intentando en mute...", err)
          enemy.muted = true
          enemy.play().catch(playErr => {
            console.error("Error al reproducir el video del enemigo:", playErr)
            handleEnemyVideoEnded()
          })
        })
      }
    }

    function handlePlayerVideoEnded() {
      if (transitioning) return
      transitioning = true
      clearWatchdog()

      setTimeout(() => {
        transitioning = false
      }, 200)

      if (enemyVideo.value) {
        currentStep.value = 'enemy-video'
        currentVideoTitle.value = props.enemy?.name || 'Rival'
        nextTick(() => {
          attemptPlayEnemy()
        })
      } else {
        emit('videos-done')
      }
    }

    function handleEnemyVideoEnded() {
      if (transitioning) return
      transitioning = true
      clearWatchdog()

      setTimeout(() => {
        transitioning = false
      }, 200)

      emit('videos-done')
    }

    function handleVideoError(e) {
      console.error("Error de carga en elemento de video:", e)
      if (currentStep.value === 'player-video') {
        handlePlayerVideoEnded()
      } else {
        handleEnemyVideoEnded()
      }
    }

    function skipVideos() {
      clearWatchdog()
      emit('skip')
    }

    function getCharacterSprite(character, state = 'idle') {
      const sprite = character?.sprites?.[state]
      if (Array.isArray(sprite)) return sprite[0] || character?.image || ''
      return sprite || character?.image || ''
    }

    onUnmounted(() => {
      clearWatchdog()
    })

    watch(() => props.phase, (newPhase) => {
      if (newPhase === 0) {
        startVideoSequence()
      }
    }, { immediate: true })

    return {
      playerVideoPlayer,
      enemyVideoPlayer,
      currentStep,
      currentVideoTitle,
      playerVideo,
      enemyVideo,
      handlePlayerVideoEnded,
      handleEnemyVideoEnded,
      handleVideoError,
      clearWatchdog,
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

/* Modo Video Fullscreen */
.cinematic-intro.video-mode {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}

.video-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.intro-video-element {
  width: 100vw;
  height: 100vh;
  object-fit: cover; /* Llena toda la pantalla */
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
}

/* Letrero del Nombre del Personaje */
.video-header {
  position: absolute;
  bottom: 4.5rem;
  left: 4.5rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  pointer-events: none;
  font-family: var(--font-display);
  background: linear-gradient(90deg, rgba(5, 5, 8, 0.85) 0%, rgba(5, 5, 8, 0.4) 75%, transparent 100%);
  border-left: 4px solid var(--gold-bright);
  padding: 1.2rem 3.5rem 1.2rem 1.8rem;
  backdrop-filter: blur(4px);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  animation: slideInName 0.72s cubic-bezier(0.19, 1, 0.22, 1) both;
}

@keyframes slideInName {
  from {
    transform: translateX(-50px);
    opacity: 0;
    filter: blur(5px);
  }
  to {
    transform: translateX(0);
    opacity: 1;
    filter: blur(0);
  }
}

.video-subtitle {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.24em;
}

.video-title {
  font-size: clamp(2.2rem, 5.5vw, 4rem);
  font-family: var(--font-title);
  color: var(--gold-bright);
  text-shadow: 0 0 25px rgba(240, 208, 96, 0.8);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn-skip-intro {
  position: absolute;
  bottom: 4.5rem;
  right: 4.5rem;
  z-index: 10;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--gold-bright);
  background: rgba(10, 10, 15, 0.8);
  border: 1px solid rgba(240, 208, 96, 0.45);
  padding: 0.85rem 1.6rem;
  cursor: pointer;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  transition: all 0.25s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
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
