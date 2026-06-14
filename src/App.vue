
<template>
  <div class="app-root">
    <!-- Partículas de fondo globales -->
    <canvas ref="particleCanvas" class="particle-canvas"></canvas>

    <!-- Transición entre pantallas -->
    <transition :name="transitionName" mode="out-in">
      <component
        :is="currentScreenComponent"
        :key="currentScreen"
        :characters="characters"
        :stages="stages"
        :selectedCharacter="selectedCharacter"
        :selectedStage="selectedStage"
        @select-character="onSelectCharacter"
        @go-to="goTo"
      />
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import HomeScreen from './components/StartScreen.vue'
import SelectScreen from './components/SelectScreen.vue'
import BattleScreen from './components/BattleScreen.vue'
import { preloadAllVideos } from './data/videoCache'

export default {
  name: 'App',
  components: { HomeScreen, SelectScreen, BattleScreen },

  setup() {
    const currentScreen = ref('home')
    const transitionName = ref('slide-up')
    const selectedCharacter = ref(null)
    const selectedStage = ref(null)
    const particleCanvas = ref(null)

    const characters = ref([])
    const stages = ref([])

    // Cargar personajes desde JSON
    fetch('/src/data/characters.json')
      .then(r => r.json())
      .then(data => {
        characters.value = data
      })
      .catch(() => {
        characters.value = [
          {
            id: 1,
            name: 'La Segua',
            skill: 'Grito Espectral',
            type: 'segua',
            power: 3,
            speed: 5,
            mysticism: 5,
            image: '/src/assets/images/characters/segua.png',
            description: 'Espíritu vengativo que atrae a los hombres con su belleza para luego revelar su verdadera forma.'
          },
          {
            id: 2,
            name: 'El Cadejos',
            skill: 'Mordida Sombría',
            type: 'cadejos',
            power: 5,
            speed: 4,
            defense: 3,
            image: '/src/assets/images/characters/cadejos.png',
            description: 'Perro demoníaco de ojos rojos que vaga en la noche, mensajero de la muerte.'
          },
          {
            id: 3,
            name: 'El Padre sin Cabeza',
            skill: 'Condena Espectral',
            type: 'padre',
            power: 3,
            speed: 2,
            range: 5,
            image: '/src/assets/images/characters/padre-sin-cabeza.png',
            description: 'Sacerdote condenado que arrastra cadenas y lleva una calavera en llamas azules.'
          }
        ]
      })

    // Cargar escenarios desde JSON
    fetch('/src/data/stages.json')
      .then(r => r.json())
      .then(data => {
        stages.value = data
      })
      .catch(() => {
        stages.value = [
          {
            id: 1,
            name: 'Casona de Santa Rosa',
            image: '/src/assets/images/backgrounds/casona-santa-rosa.png'
          },
          {
            id: 2,
            name: 'Mercado Central de San José',
            image: '/src/assets/images/backgrounds/mercado-central.png'
          },
          {
            id: 3,
            name: 'Cafetal Nocturno',
            image: '/src/assets/images/backgrounds/cafetal.png'
          }
        ]
      })

    const currentScreenComponent = computed(() => {
      const map = {
        home: HomeScreen,
        select: SelectScreen,
        battle: BattleScreen
      }

      return map[currentScreen.value] || HomeScreen
    })

    function goTo(screen) {
      const order = ['home', 'select', 'battle']
      const fromIdx = order.indexOf(currentScreen.value)
      const toIdx = order.indexOf(screen)

      transitionName.value = toIdx >= fromIdx ? 'slide-up' : 'slide-down'
      currentScreen.value = screen
    }

    function onSelectCharacter(char) {
      selectedCharacter.value = char

      if (stages.value.length > 0) {
        const randomIndex = Math.floor(Math.random() * stages.value.length)
        selectedStage.value = stages.value[randomIndex]
      }

      goTo('battle')
    }

    // ── Partículas de fondo ──────────────────────────────
    let animFrame = null
    const particles = []

    function initParticles() {
      const canvas = particleCanvas.value
      if (!canvas) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.4 + 0.1),
          alpha: Math.random() * 0.5 + 0.1,
          color:
            Math.random() > 0.6
              ? 'rgba(200,168,75,'
              : Math.random() > 0.5
                ? 'rgba(0,180,220,'
                : 'rgba(180,30,30,'
        })
      }
    }

    function animateParticles() {
      const canvas = particleCanvas.value
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.0008

        if (p.y < 0 || p.alpha <= 0) {
          p.y = canvas.height + 5
          p.x = Math.random() * canvas.width
          p.alpha = Math.random() * 0.5 + 0.1
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'
        ctx.fill()
      })

      animFrame = requestAnimationFrame(animateParticles)
    }

    function onResize() {
      if (particleCanvas.value) {
        particleCanvas.value.width = window.innerWidth
        particleCanvas.value.height = window.innerHeight
      }
    }

    onMounted(() => {
      preloadAllVideos() // Precarga los videos en segundo plano
      initParticles()
      animateParticles()
      window.addEventListener('resize', onResize)
    })

    onUnmounted(() => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', onResize)
    })

    return {
      currentScreen,
      currentScreenComponent,
      transitionName,
      characters,
      stages,
      selectedCharacter,
      selectedStage,
      particleCanvas,
      goTo,
      onSelectCharacter
    }
  }
}
</script>

<style>
@import './css/global.css';

/* Transiciones entre pantallas */
.slide-up-enter-active,
.slide-up-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.77, 0, 0.175, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.97);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(0.97);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-40px) scale(0.97);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.97);
}

.app-root {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.particle-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
</style>