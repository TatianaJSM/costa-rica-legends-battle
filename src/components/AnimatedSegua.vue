<template>
  <div
    class="animated-segua"
    :class="currentAction"
  >
    <img
      v-if="currentImage"
      :src="currentImage"
      alt="La Segua"
      class="segua-frame"
      draggable="false"
    />

    <div class="segua-shadow"></div>

    <div v-if="showControls" class="segua-controls">
      <button @click="playIdle">Idle</button>
      <button @click="playWalk">Caminar</button>
      <button @click="playJump">Brincar</button>
      <button @click="playAttack">Atacar</button>
      <button @click="playAcid">Ácido</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { seguaAnimations } from '../data/seguaAnimations'

defineProps({
  showControls: {
    type: Boolean,
    default: true
  }
})

const currentAction = ref('idle')
const currentFrame = ref(0)
const frameTimer = ref(null)

const frameDurations = {
  idle: [240, 240, 240],
  walk: [120, 120, 120, 120],

  // Aquí jump_02 y jump_03 duran más
  jump: [120, 450, 480, 140],

  attack: [120, 120, 160],
  acid: [120, 130, 150, 160, 180]
}

const currentFrames = computed(() => {
  return seguaAnimations[currentAction.value] || []
})

const currentImage = computed(() => {
  return currentFrames.value[currentFrame.value] || ''
})

function playAction(action, loop = true) {
  clearTimeout(frameTimer.value)

  currentAction.value = action
  currentFrame.value = 0

  const frames = seguaAnimations[action] || []
  if (!frames.length) return

  function nextFrame() {
    const durations = frameDurations[action] || []
    const duration = durations[currentFrame.value] || 120

    frameTimer.value = setTimeout(() => {
      currentFrame.value++

      if (currentFrame.value >= frames.length) {
        if (loop) {
          currentFrame.value = 0
          nextFrame()
        } else {
          playAction('idle', true)
        }
      } else {
        nextFrame()
      }
    }, duration)
  }

  nextFrame()
}

function playIdle() {
  playAction('idle', true)
}

function playWalk() {
  playAction('walk', true)
}

function playJump() {
  playAction('jump', false)
}

function playAttack() {
  playAction('attack', false)
}

function playAcid() {
  playAction('acid', false)
}

onMounted(() => {
  playIdle()
})

onUnmounted(() => {
  clearTimeout(frameTimer.value)
})

defineExpose({
  playIdle,
  playWalk,
  playJump,
  playAttack,
  playAcid
})
</script>

<style scoped>
.animated-segua {
  position: relative;
  width: 430px;
  height: 540px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
}

.segua-frame {
  position: relative;
  z-index: 2;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  object-position: bottom center;
  filter:
    drop-shadow(0 18px 20px rgba(0, 0, 0, 0.9))
    drop-shadow(0 0 18px rgba(160, 216, 239, 0.16));
  transform-origin: bottom center;
  user-select: none;
}

/* Sombra */
.segua-shadow {
  position: absolute;
  bottom: 10px;
  width: 58%;
  height: 28px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.75), transparent 70%);
  filter: blur(5px);
  z-index: 1;
}

/* Idle */
.animated-segua.idle .segua-frame {
  animation: seguaIdle 1.8s ease-in-out infinite;
}

@keyframes seguaIdle {
  0%, 100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-4px) scale(1.01);
  }
}

/* Walk */
.animated-segua.walk .segua-frame {
  animation: seguaWalk 0.45s ease-in-out infinite;
}

@keyframes seguaWalk {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

/* Jump */
.animated-segua.jump .segua-frame {
  animation: seguaJump 1.2s ease-in-out forwards;
}

@keyframes seguaJump {
  0% {
    transform: translateY(0) scale(1);
  }

  30% {
    transform: translateY(-95px) scale(1.02);
  }

  65% {
    transform: translateY(-105px) scale(1.02);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

.animated-segua.jump .segua-shadow {
  animation: seguaJumpShadow 1.2s ease-in-out forwards;
}

@keyframes seguaJumpShadow {
  0%, 100% {
    transform: scaleX(1);
    opacity: 0.75;
  }

  45%, 65% {
    transform: scaleX(0.55);
    opacity: 0.35;
  }
}

/* Attack */
.animated-segua.attack .segua-frame {
  animation: seguaAttack 0.45s ease-out forwards;
}

@keyframes seguaAttack {
  0% {
    transform: translateX(0) scale(1);
  }

  45% {
    transform: translateX(35px) scale(1.03);
  }

  100% {
    transform: translateX(0) scale(1);
  }
}

/* Acid */
.animated-segua.acid .segua-frame {
  animation: seguaAcid 0.8s ease-out forwards;
}

@keyframes seguaAcid {
  0% {
    transform: translateX(0) scale(1);
    filter:
      drop-shadow(0 18px 20px rgba(0, 0, 0, 0.9))
      drop-shadow(0 0 10px rgba(120, 255, 0, 0.15));
  }

  40% {
    transform: translateX(22px) scale(1.03);
    filter:
      drop-shadow(0 18px 20px rgba(0, 0, 0, 0.9))
      drop-shadow(0 0 30px rgba(120, 255, 0, 0.5));
  }

  100% {
    transform: translateX(0) scale(1);
    filter:
      drop-shadow(0 18px 20px rgba(0, 0, 0, 0.9))
      drop-shadow(0 0 16px rgba(120, 255, 0, 0.2));
  }
}

/* Botones temporales */
.segua-controls {
  position: absolute;
  left: 50%;
  bottom: -72px;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  gap: 0.45rem;
  pointer-events: auto;
}

.segua-controls button {
  background: rgba(10, 10, 16, 0.92);
  border: 1px solid rgba(200, 168, 75, 0.35);
  color: #f0d060;
  padding: 0.45rem 0.65rem;
  font-size: 0.7rem;
  cursor: pointer;
}

.segua-controls button:hover {
  background: rgba(200, 168, 75, 0.15);
}
</style>