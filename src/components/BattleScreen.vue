<template>
  <div
    ref="screenEl"
    class="battle-screen"
  >
    <!-- ── FIXED BACKGROUND LAYER ─────────────────────────── -->
    <div class="stage-background" :style="stageBackgroundStyle"></div>

    <CinematicIntro
      v-if="introActive"
      :player="playerChar"
      :enemy="enemyChar"
      :selected-stage="selectedStage"
      :phase="introPhase"
    />

    <!-- ── HUD ───────────────────────────────────────────── -->
    <div class="battle-header" :class="{ visible: ready && !introActive }">
      <div class="fighter-side left">
        <div class="fighter-name">{{ playerChar.name }}</div>
        <div class="hp-bar-wrap">
          <div class="hp-bar" :class="hpClass(playerHp)">
            <div class="hp-damage-fill" :style="{ width: playerDmgBar + '%' }"></div>
            <div class="hp-fill player-hp" :style="{ width: playerHp + '%' }"></div>
          </div>
          <div class="hp-label">{{ Math.round(playerHp) }}%</div>
        </div>
      </div>

      <div class="timer-block">
        <div class="stage-name">{{ selectedStage?.name || 'Arena de Leyendas' }}</div>
        <div class="vs-badge">VS</div>
        <div class="battle-timer" :class="{ warning: timeLeft <= 10 }">
          {{ String(timeLeft).padStart(2, '0') }}
        </div>
        <div class="round-label">RONDA {{ round }}</div>
      </div>

      <div class="fighter-side right">
        <div class="fighter-name">{{ enemyChar.name }}</div>
        <div class="hp-bar-wrap reversed">
          <div class="hp-label">{{ Math.round(enemyHp) }}%</div>
          <div class="hp-bar" :class="hpClass(enemyHp)">
            <div class="hp-damage-fill" :style="{ width: enemyDmgBar + '%' }"></div>
            <div class="hp-fill enemy-hp" :style="{ width: enemyHp + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ARENA ─────────────────────────────────────────── -->
    <div class="arena" :class="[{ visible: ready && !introActive }, cameraClass, { 'zoom-hit': zoomHit }]">

      <!-- VINO DE COYOL ITEM (z-index: 10, above background, below characters) -->
      <div
        v-if="coyolItem && coyolItem.visible"
        class="coyol-item"
        :style="{ left: coyolItem.x + '%' }"
      >
        <img class="coyol-item-img" src="/src/assets/images/items/vino-coyol.png" alt="Vino de Coyol" />
        <span class="coyol-particle p1"></span>
        <span class="coyol-particle p2"></span>
        <span class="coyol-particle p3"></span>
        <span class="coyol-particle p4"></span>
      </div>

      <!-- JUGADOR -->
      <div
        class="fighter-sprite player"
        :class="[playerChar.type, { vulnerable: playerVulnerable }]"
        :style="{ left: playerX + '%' }"
      >
        <img
          v-for="(spriteUrl, idx) in getSpritesFor(playerChar, playerState)"
          :key="spriteUrl + '-' + idx"
          v-show="idx === (playerFrame % getSpritesFor(playerChar, playerState).length)"
          :src="spriteUrl"
          :alt="playerChar.name"
          :class="['sprite-img', playerState, { 'flash-hit': playerFlash }]"
          :style="getSpriteStyle(playerChar, playerState, idx)"
          loading="eager"
          decoding="async"
          @error="onSpriteError($event, playerChar)"
        />
      </div>

      <!-- EFECTO ESPECIAL -->
      <div
        v-if="specialEffect"
        class="special-effect"
        :class="[specialEffect, specialDirection]"
        :style="specialEffectStyle"
      >
        <span v-if="specialEffect === 'acidSpit'" class="acid-drop d1"></span>
        <span v-if="specialEffect === 'acidSpit'" class="acid-drop d2"></span>
        <span v-if="specialEffect === 'acidSpit'" class="acid-drop d3"></span>
      </div>

      <!-- ENTIDADES DE PROYECTILES ACTIVOS (CABEZAS FANTASMALES) -->
      <div
        v-for="proj in activeProjectiles"
        :key="proj.id"
        :class="['projectile-entity', getProjectileClass(proj)]"
        :style="{
          left: proj.x + '%',
          transform: proj.direction < 0 ? 'scaleX(-1)' : 'none'
        }"
      >
        <img
          :src="getProjectileSrc(proj)"
          alt="Proyectil"
          class="projectile-img"
        />
      </div>


      <!-- ENEMIGO -->
      <div
        class="fighter-sprite enemy"
        :class="[enemyChar.type, { vulnerable: enemyVulnerable }]"
        :style="{ left: enemyX + '%' }"
      >
        <img
          v-for="(spriteUrl, idx) in getSpritesFor(enemyChar, enemyState)"
          :key="spriteUrl + '-' + idx"
          v-show="idx === (enemyFrame % getSpritesFor(enemyChar, enemyState).length)"
          :src="spriteUrl"
          :alt="enemyChar.name"
          :class="['sprite-img', 'flipped', enemyState, { 'flash-hit': enemyFlash }]"
          :style="getSpriteStyle(enemyChar, enemyState, idx)"
          loading="eager"
          decoding="async"
          @error="onSpriteError($event, enemyChar)"
        />
      </div>

      <!-- Números de daño -->
      <transition-group name="dmg-pop" tag="div" class="damage-numbers">
        <div
          v-for="dmg in damageNumbers"
          :key="dmg.id"
          class="damage-number"
          :class="dmg.type"
          :style="{ left: dmg.x + '%', top: dmg.y + '%' }"
        >{{ dmg.text }}</div>
      </transition-group>

      <!-- Mensaje de batalla -->
      <transition name="battle-msg">
        <div v-if="battleMessage" class="battle-message" :class="messageType">
          {{ battleMessage }}
        </div>
      </transition>
    </div>

    <!-- ── CONTROLES ──────────────────────────────────────── -->
    <div class="battle-controls compact" :class="{ visible: ready && !introActive && !battleOver }">
      <div class="quick-controls">
        <button class="control-chip" @mouseenter="playSound('hover')" @click="showMoveMenu = !showMoveMenu; playSound('click')">Movimientos</button>
        <button class="control-chip" :disabled="battleOver" @mouseenter="playSound('hover')" @click="jump('player')">W / Space</button>
      </div>

      <transition name="move-panel">
        <div v-if="showMoveMenu" class="move-menu">
          <div class="move-menu-header">
            <span>Lista de movimientos</span>
            <button class="close-moves" @mouseenter="playSound('hover')" @click="showMoveMenu = false; playSound('click')">✕</button>
          </div>

          <div class="move-list">
            <button
              v-for="atk in attacks"
              :key="atk.id"
              class="move-row"
              :class="[atk.type, { disabled: !canAttack || (atk.special && playerSpecialCooldown > 0) }]"
              :disabled="!canAttack || (atk.special && playerSpecialCooldown > 0)"
              @mouseenter="playSound('hover')"
              @click="playerAttack(atk)"
            >
              <span class="move-key">{{ atk.key }}</span>
              <span class="move-info">
                <strong>
                  {{ atk.name }}
                  <span v-if="atk.special && playerSpecialCooldown > 0" class="cooldown-badge">
                    ({{ playerSpecialCooldown }}s)
                  </span>
                </strong>
                <small>{{ atk.note }}</small>
              </span>
              <span class="move-damage">-{{ atk.damage }}%</span>
            </button>

            <button class="move-row utility" @mouseenter="playSound('hover')" @click="showMoveMenu = false; playSound('click'); jump('player')">
              <span class="move-key">W</span>
              <span class="move-info">
                <strong>Saltar</strong>
                <small>También Space. Evade ataques.</small>
              </span>
              <span class="move-damage evade">Evadir</span>
            </button>


          </div>
        </div>
      </transition>
    </div>

    <!-- ── PANTALLA DE RESULTADOS (COMPONENTE RESULT SCREEN) ── -->
    <ResultScreen
      :visible="battleOver"
      :winner="winner"
      :playerChar="playerChar"
      :enemyChar="enemyChar"
      :roundsPlayed="round"
      :totalDamageDealt="playerDamageDealt"
      :timeUsed="60 - timeLeft"
      @restart="restartBattle"
      @go-to="emit('go-to', $event)"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import CinematicIntro from './CinematicIntro.vue'
import ResultScreen from './ResultScreen.vue'
import { seguaAnimations } from '../data/seguaAnimations'
import { cadejosAnimations } from '../data/cadejosAnimations'
import { padreAnimations } from '../data/padreAnimations'
import seguaMetadata from '../data/seguaMetadata.json'
import padreMetadata from '../data/padreMetadata.json'
import cadejosMetadata from '../data/cadejosMetadata.json'
import { playSound } from '../modules/soundManager'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Velocidades generales de sprites.
const FRAME_MS = {
  idle: 160,
  walk: 100,
  run: 70,
  jump: 90,
  attack: 80,
  special: 70,
  acid: 90,
  hit: 90,
  ko: 120,
}

// Duraciones específicas por frame para La Segua.
const FRAME_DURATIONS = {
  idle: [180, 180, 180, 180],
  walk: [120, 120, 120, 120, 120],
  jump: [140, 420, 160],
  attack: [120, 120, 120],
  special: [120, 120, 120],
  projectile: [120, 120, 120],
  hit: [120, 120, 120],
  ko: [140, 140, 240, 400],
  victory: [220, 220]
}

export default {
  name: 'BattleScreen',
  components: { CinematicIntro, ResultScreen },
  props: {
    characters: { type: Array, default: () => [] },
    selectedCharacter: { type: Object, default: null },
    selectedStage: { type: Object, default: null },
  },
  emits: ['go-to'],

  setup(props, { emit }) {
    // ── Personajes ─────────────────────────────────────────────
    const playerChar = computed(() => props.selectedCharacter || props.characters[0] || {})

    const enemyChar = computed(() => {
      const others = (props.characters || []).filter(c => c.id !== playerChar.value?.id)
      return others[Math.floor(Math.random() * others.length)] || props.characters[1] || props.characters[0] || {}
    })

    // ── Posiciones ─────────────────────────────────────────────
    const playerX = ref(22)
    const enemyX = ref(76)

    // ── STAGE BACKGROUND ───────────────────────────────────────
    const stageBackgroundStyle = computed(() => ({
      backgroundImage: `url(${props.selectedStage?.image || '/src/assets/images/backgrounds/cafetal.png'})`
    }))

    // ── HP / Combate ───────────────────────────────────────────
    const playerHp = ref(100)
    const enemyHp = ref(100)
    const playerDamageDealt = ref(0)
    const playerDmgBar = ref(100)
    const enemyDmgBar = ref(100)
    const timeLeft = ref(60)
    const round = ref(1)
    const ready = ref(false)
    const canAttack = ref(false)
    const battleOver = ref(false)
    const winner = ref(null)
    const flashActive = ref(false)
    const zoomHit = ref(false)
    const cameraClass = ref('')
    const battleMessage = ref('')
    const messageType = ref('')
    const damageNumbers = ref([])
    const specialEffect = ref('')
    const specialDirection = ref('from-player')
    const activeProjectiles = ref([])
    let nextProjectileId = 0
    const coyolItem = ref(null)
    let coyolSpawnTimeout = null
    const showMoveMenu = ref(false)
    const introActive = ref(true)
    const introPhase = ref(1)
    const playerVulnerable = ref(false)
    const enemyVulnerable = ref(false)

    // ── Cooldowns ──────────────────────────────────────────────
    const playerSpecialCooldown = ref(0)
    const enemySpecialCooldown = ref(0)

    // ── Sprites animados ───────────────────────────────────────
    const playerState = ref('idle')
    const enemyState = ref('idle')
    const playerFrame = ref(0)
    const enemyFrame = ref(0)
    const playerFlash = ref(false)
    const enemyFlash = ref(false)

    let playerFrameTimer = null
    let enemyFrameTimer = null

    watch(playerState, () => {
      startSpriteLoop('player')
    })

    watch(enemyState, () => {
      startSpriteLoop('enemy')
    })

    function getAnimationState(character, state) {
      return state
    }

    function getSpritesFor(character, state) {
      const animationState = getAnimationState(character, state)

      // La Segua usa los frames nuevos de src/assets/images/characters/segua/...
      if (character?.type === 'segua') {
        const seguaFrames = seguaAnimations[animationState]
        if (Array.isArray(seguaFrames) && seguaFrames.length > 0) return seguaFrames
      }

      if (character?.type === 'cadejos') {
        const cadejosFrames = cadejosAnimations[animationState]
        if (Array.isArray(cadejosFrames) && cadejosFrames.length > 0) return cadejosFrames
      }

      if (character?.type === 'padre') {
        const padreFrames = padreAnimations[animationState]
        if (Array.isArray(padreFrames) && padreFrames.length > 0) return padreFrames
      }

      // El Padre y Cadejos siguen usando sprites del JSON si existen (fallback).
      const sprites = character?.sprites?.[state]
      if (Array.isArray(sprites) && sprites.length > 0) return sprites

      return character?.sprites?.idle || [character?.image || '']
    }

    function getFrameDuration(character, state, frameIndex) {
      const animationState = getAnimationState(character, state)

      if (character?.type === 'segua') {
        const durations = FRAME_DURATIONS[animationState]
        if (Array.isArray(durations) && durations[frameIndex] !== undefined) {
          return durations[frameIndex]
        }
      }

      return FRAME_MS[state] || 120
    }

    function getJumpDuration(character) {
      if (character?.type === 'segua') {
        const sprites = getSpritesFor(character, 'jump')
        if (sprites.length > 1) {
          let totalDuration = 0
          for (let i = 0; i < sprites.length; i++) {
            totalDuration += getFrameDuration(character, 'jump', i)
          }
          return totalDuration > 0 ? totalDuration : 1200
        }
      }
      return 1200
    }

    function getSpriteStyle(character, state, idx) {
      const styles = {}

      if (state === 'jump') {
        styles.animationDuration = `${getJumpDuration(character)}ms`
      }

      if (character?.type === 'segua') {
        const sprites = getSpritesFor(character, state)
        if (sprites && sprites.length > 0) {
          const frameIdx = idx % sprites.length

          // Determine the metadata key
          let folder = state
          let prefix = state
          if (state === 'hit') {
            folder = 'hurt'
            prefix = 'hurt'
          } else if (state === 'ko') {
            folder = 'ko'
            prefix = 'ko'
          }

          const fileNum = String(frameIdx + 1).padStart(2, '0')
          const key = `${folder}/${prefix}_${fileNum}.png`

          const meta = seguaMetadata[key]
          if (meta && meta.offsetPct !== undefined) {
            const offsetPct = -meta.offsetPct * 100
            styles['--feet-offset-pct'] = `${offsetPct}%`
          }
        }
      } else if (character?.type === 'padre') {
        const sprites = getSpritesFor(character, state)
        if (sprites && sprites.length > 0) {
          const frameIdx = idx % sprites.length

          // Determine the metadata key
          let folder = state
          let prefix = state
          if (state === 'hit') {
            folder = character?.type === 'segua' ? 'hurt' : 'hit'
            prefix = character?.type === 'segua' ? 'hurt' : 'hit'
          } else if (state === 'ko') {
            folder = 'ko'
            prefix = 'ko'
          } else if (state === 'block') {
            folder = 'crouch'
            prefix = 'crouch'
          }

          const fileNum = String(frameIdx + 1).padStart(2, '0')
          const key = `${folder}/${prefix}_${fileNum}.png`

          const meta = padreMetadata[key]
          if (meta && meta.offsetPct !== undefined) {
            const offsetPct = -meta.offsetPct * 100
            styles['--feet-offset-pct'] = `${offsetPct}%`
          }
        }
      } else if (character?.type === 'cadejos') {
        const sprites = getSpritesFor(character, state)
        if (sprites && sprites.length > 0) {
          const frameIdx = idx % sprites.length

          // Determine the metadata key
          let folder = state
          let prefix = state
          if (state === 'hit') {
            folder = 'hit'
            prefix = 'hit'
          } else if (state === 'ko') {
            folder = 'ko'
            prefix = 'ko'
          } else if (state === 'block') {
            folder = 'idle'
            prefix = 'idle'
          } else if (state === 'getup') {
            folder = 'idle'
            prefix = 'idle'
          }

          const fileNum = String(frameIdx + 1).padStart(2, '0')
          const key = `${folder}/${prefix}_${fileNum}.png`

          const meta = cadejosMetadata[key]
          if (meta && meta.offsetPct !== undefined) {
            const offsetPct = -meta.offsetPct * 100
            styles['--feet-offset-pct'] = `${offsetPct}%`
          }
        }
      }

      return styles
    }

    function startSpriteLoop(who) {
      const stateRef = who === 'player' ? playerState : enemyState
      const frameRef = who === 'player' ? playerFrame : enemyFrame
      const char = who === 'player' ? playerChar : enemyChar

      if (who === 'player') clearTimeout(playerFrameTimer)
      else clearTimeout(enemyFrameTimer)

      frameRef.value = 0

      function nextFrame() {
        const state = stateRef.value
        const character = char.value
        const sprites = getSpritesFor(character, state)
        const count = sprites.length || 1
        const duration = getFrameDuration(character, state, frameRef.value)

        const timer = setTimeout(() => {
          if (state === 'ko' && frameRef.value === count - 1) {
            return
          }
          frameRef.value = (frameRef.value + 1) % count
          nextFrame()
        }, duration)

        if (who === 'player') playerFrameTimer = timer
        else enemyFrameTimer = timer
      }

      nextFrame()
    }

    // State transitions are now handled reactively via watch

    function currentSprite(character, state) {
      const sprites = getSpritesFor(character, state)
      const frameRef = character?.id === playerChar.value?.id ? playerFrame : enemyFrame
      const idx = frameRef.value % sprites.length
      return sprites[idx] || character?.image || ''
    }

    function onSpriteError(event, character) {
      const idleSprites = getSpritesFor(character, 'idle')
      const fallback = idleSprites?.[0] || character?.image

      if (event?.target && fallback && event.target.src !== fallback) {
        event.target.src = fallback
      }
    }

    // ── Ataques ────────────────────────────────────────────────
    let dmgIdCounter = 0
    let timerInterval = null
    let aiTimeout = null
    let msgTimer = null
    let enemyVulnerableTimer = null

    const attacks = computed(() => {
      if (playerChar.value?.type === 'segua') {
        return [
          {
            id: 1,
            key: 'J',
            name: 'Ataque de Garras',
            damage: 10,
            type: 'fast',
            delay: 360,
            range: 20,
            animation: 'attack',
            note: 'Zarpazo rápido a corta distancia.',
          },
          {
            id: 2,
            key: 'Q',
            name: 'Energía Maldita',
            damage: 22,
            type: 'special',
            delay: 800,
            range: 48,
            special: true,
            effect: 'coyolBlast',
            animation: 'projectile',
            note: 'Lanza una esfera de energía maldita.',
          },
          {
            id: 3,
            key: 'L',
            name: 'Grito Terrorífico',
            damage: 16,
            type: 'heavy',
            delay: 520,
            range: 20,
            special: true,
            effect: '',
            animation: 'special',
            note: 'Grito espectral a corta distancia.',
          }
        ]
      }

      if (playerChar.value?.type === 'padre') {
        return [
          {
            id: 1,
            key: 'J',
            name: 'Zarpazo de Garras',
            damage: 8,
            type: 'fast',
            delay: 360,
            range: 20,
            animation: 'attack',
            note: 'Zarpazo rápido a corta distancia.',
          },
          {
            id: 2,
            key: 'Q',
            name: 'Tirar la Cabeza',
            damage: 20,
            type: 'special',
            delay: 800,
            range: 48,
            special: true,
            effect: 'headThrow',
            animation: 'special',
            note: 'Lanza su cabeza flotante (5s cooldown).',
          },
          {
            id: 3,
            key: 'L',
            name: 'Grito del Padre',
            damage: 12,
            type: 'heavy',
            delay: 520,
            range: 20,
            animation: 'heavy',
            note: 'Grito espectral a corta distancia.',
          }
        ]
      }

      if (playerChar.value?.type === 'cadejos') {
        return [
          {
            id: 1,
            key: 'J',
            name: 'Mordida Rápida',
            damage: 10,
            type: 'fast',
            delay: 360,
            range: 20,
            animation: 'attack',
            note: 'Mordida y zarpazo rápido.',
          },
          {
            id: 2,
            key: 'Q',
            name: 'Carrera Espectral',
            damage: 15,
            type: 'special',
            delay: 800,
            range: 48,
            special: true,
            effect: 'shadowWolf',
            animation: 'special',
            note: 'Lanza un lobo de sombras (5s cooldown).',
          },
          {
            id: 3,
            key: 'L',
            name: 'Zarpazo de Fuego',
            damage: 20,
            type: 'heavy',
            delay: 520,
            range: 20,
            animation: 'heavy',
            note: 'Zarpazo pesado a corta distancia.',
          }
        ]
      }

      return [
        {
          id: 1,
          key: 'J',
          name: 'Ataque Rápido',
          damage: 8,
          type: 'fast',
          delay: 320,
          range: 18,
          note: 'Corto alcance, recuperación veloz.',
        },
        {
          id: 2,
          key: 'Q',
          name: playerChar.value?.skill || 'Habilidad',
          damage: 18,
          type: 'special',
          delay: 720,
          range: 34,
          special: true,
          note: 'Ataque especial del personaje.',
        },
        {
          id: 3,
          key: 'L',
          name: 'Golpe Fuerte',
          damage: 12,
          type: 'heavy',
          delay: 520,
          range: 20,
          note: 'Más daño, más compromiso.',
        },
      ]
    })

    const specialEffectStyle = computed(() => {
      const left = specialDirection.value === 'from-player' ? playerX.value : enemyX.value
      const width = Math.max(12, Math.abs(enemyX.value - playerX.value))

      return {
        left: `${Math.min(playerX.value, enemyX.value)}%`,
        width: `${width}%`,
        '--origin-x': `${left}%`,
      }
    })

    function getDistance() {
      return Math.abs(enemyX.value - playerX.value)
    }

    function isInRange(range) {
      return getDistance() <= range
    }

    async function approachTarget(attacker, range = 18) {
      if (isInRange(range)) return

      if (attacker === 'player') {
        playerState.value = 'walk'
        playerX.value = clamp(enemyX.value - range + 3, 8, 48)
      } else {
        enemyState.value = 'walk'
        enemyX.value = clamp(playerX.value + range - 3, 52, 92)
      }

      await sleep(360)
    }

    function applyKnockback(target, power = 4) {
      if (target === 'enemy') enemyX.value = clamp(enemyX.value + power, 52, 92)
      else playerX.value = clamp(playerX.value - power, 8, 48)
    }

    function specialFor(character) {
      if (character?.type === 'padre') {
        return { effect: 'headThrow', message: 'Cabeza espectral', damage: 24, shake: 'strong' }
      }

      if (character?.type === 'segua') {
        return { effect: 'coyolBlast', message: 'Energía Maldita', damage: 22, shake: 'strong' }
      }

      if (character?.type === 'cadejos') {
        return { effect: 'shadowWolf', message: 'Carrera Espectral', damage: 15, shake: 'strong' }
      }

      return { effect: 'deadlyBite', message: 'Ataque especial', damage: 18, shake: 'strong' }
    }

    async function performAttack(attacker, attack) {
      if (!attack) return
      if (battleOver.value || introActive.value) return
      if (attacker === 'player' && (playerState.value === 'block' || !canAttack.value)) return

      const isPlayer = attacker === 'player'
      const attackerChar = isPlayer ? playerChar.value : enemyChar.value
      const targetChar = isPlayer ? enemyChar.value : playerChar.value

      // Padre has a larger collision box (boss presence)
      const sizeBonus = (attackerChar?.type === 'padre' || targetChar?.type === 'padre') ? 3.5 : 0
      const range = (attack.range || (attack.special ? 34 : 18)) + sizeBonus

      // Cooldown check for special attacks
      if (attack.special) {
        const cooldownRef = isPlayer ? playerSpecialCooldown : enemySpecialCooldown
        if (cooldownRef.value > 0) {
          if (isPlayer) {
            showMessage(`RECARGANDO... ${cooldownRef.value}s`, 'hit')
          }
          return
        }
      }

      if (isPlayer) canAttack.value = false

      await approachTarget(attacker, range)
      if (battleOver.value) return

      // Set cooldown if special attack is triggered
      if (attack.special) {
        const cooldownRef = isPlayer ? playerSpecialCooldown : enemySpecialCooldown
        cooldownRef.value = 5
      }

      const stateRef = isPlayer ? playerState : enemyState
      stateRef.value = attack.animation || (attack.special ? 'special' : 'attack')
      specialDirection.value = isPlayer ? 'from-player' : 'from-enemy'

      // Play attack sound based on type
      if (attack.special) {
        playSound('specialAttack')
      } else if (attack.type === 'heavy') {
        playSound('heavyAttack')
      } else {
        playSound('lightAttack')
      }

      let damage = attack.damage
      let message = attack.name
      let shake = attack.special ? 'strong' : 'light'

      if (attack.special) {
        const sp = specialFor(attackerChar)
        damage = attack.damage !== undefined ? attack.damage : sp.damage
        message = attack.name || sp.message
        shake = attack.shake || sp.shake
        specialEffect.value = attack.effect !== undefined ? attack.effect : sp.effect
      }

      if (isPlayer && enemyVulnerable.value && !attack.special) {
        damage = Math.ceil(damage * 1.25)
        enemyVulnerable.value = false
        clearTimeout(enemyVulnerableTimer)
      }

      showMessage(message, attack.special ? 'fight' : 'normal')
      await sleep(attack.special ? 360 : 190)

      if (attack.effect === 'headThrow' || attack.effect === 'shadowWolf' || (attack.special && (attackerChar?.type === 'padre' || attackerChar?.type === 'cadejos'))) {
        if (specialEffect.value === 'headThrow' || specialEffect.value === 'shadowWolf') {
          specialEffect.value = ''
        }
        spawnProjectile(attacker, damage)
      } else {
        if (isInRange(range + 5)) {
          doHit(attacker, damage, attack.special, shake)

          if (attack.special && attackerChar?.type === 'segua' && isPlayer && !battleOver.value) {
            enemyVulnerable.value = true
            spawnDamageNumber('Vulnerable', enemyX.value, 44, 'vulnerable')
            showMessage('Vulnerable', 'vulnerable')
            clearTimeout(enemyVulnerableTimer)
            enemyVulnerableTimer = setTimeout(() => {
              enemyVulnerable.value = false
            }, 4200)
          }
        } else {
          showMessage('MISS', 'hit')
        }
      }


      await sleep(attack.delay)
      specialEffect.value = ''

      if (!battleOver.value) stateRef.value = 'idle'
      if (isPlayer && !battleOver.value) canAttack.value = true
    }

    function playerAttack(atk) {
      showMoveMenu.value = false
      performAttack('player', atk)
    }

    function doHit(attacker, damage, strong = false, shake = 'light') {
      if (battleOver.value) return

      const isPlayer = attacker === 'player'
      const targetState = isPlayer ? enemyState : playerState
      const isBlocking = targetState.value === 'block'
      const finalDamage = isBlocking ? Math.ceil(damage * 0.5) : damage

      // Play hit or block sound
      if (isBlocking) {
        playSound('block')
      } else {
        playSound('hit')
      }

      triggerFeedback(isBlocking ? 'light' : shake, isBlocking ? false : strong)

      if (isPlayer) {
        enemyFlash.value = true

        setTimeout(() => {
          enemyFlash.value = false
        }, 150)

        enemyHp.value = Math.max(0, enemyHp.value - finalDamage)
        playerDamageDealt.value += finalDamage
        spawnDamageNumber(finalDamage, enemyX.value, 32, isBlocking ? 'block-dmg' : 'enemy-dmg')
        applyKnockback('enemy', isBlocking ? 1 : (strong ? 6 : 3))

        setTimeout(() => {
          enemyDmgBar.value = enemyHp.value
        }, 400)

        if (isBlocking) {
          showMessage('¡BLOQUEADO!', 'heal')
        } else {
          enemyState.value = 'hit'
          setTimeout(() => {
            if (!battleOver.value && enemyState.value === 'hit') enemyState.value = 'idle'
          }, 320)
          showMessage(`-${finalDamage}% HP`, 'hit')
        }

        if (enemyHp.value <= 0) {
          enemyState.value = 'ko'
          endBattle('player')
        }
      } else {
        playerFlash.value = true

        setTimeout(() => {
          playerFlash.value = false
        }, 150)

        playerHp.value = Math.max(0, playerHp.value - finalDamage)
        spawnDamageNumber(finalDamage, playerX.value, 32, isBlocking ? 'block-dmg' : 'player-dmg')
        applyKnockback('player', isBlocking ? 1 : (strong ? 6 : 3))

        setTimeout(() => {
          playerDmgBar.value = playerHp.value
        }, 400)

        if (isBlocking) {
          showMessage('¡BLOQUEADO!', 'heal')
        } else {
          playerState.value = 'hit'
          setTimeout(() => {
            if (!battleOver.value && playerState.value === 'hit') playerState.value = 'idle'
          }, 320)
          showMessage(`-${finalDamage}% HP`, 'hit')
        }

        if (playerHp.value <= 0) {
          playerState.value = 'ko'
          endBattle('enemy')
        }
      }
    }

    async function jump(fighter = 'player') {
      if (battleOver.value || introActive.value) return

      const stateRef = fighter === 'player' ? playerState : enemyState
      if (stateRef.value === 'jump') return

      stateRef.value = 'jump'
      playSound('jump')

      const char = fighter === 'player' ? playerChar.value : enemyChar.value
      const duration = getJumpDuration(char)
      await sleep(duration)

      if (!battleOver.value && stateRef.value === 'jump') {
        stateRef.value = 'idle'
      }
    }

    function spawnCoyolItem() {
      if (battleOver.value || introActive.value) return
      if (coyolItem.value) return // Only one bottle exists at a time

      coyolItem.value = {
        x: Math.floor(Math.random() * 66) + 17, // random position between 17% and 83% of combat floor
        visible: true
      }
      showMessage('¡VINO DE COYOL! (+15 VIDA)', 'heal')
    }

    function playPickupSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        // Retro rising dual chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08) // A5

        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } catch (e) {
        console.warn('Audio Context failed:', e)
      }
    }

    function collectItem(who) {
      if (!coyolItem.value || !coyolItem.value.visible) return

      coyolItem.value.visible = false
      const itemX = coyolItem.value.x

      // Restore 15% health (max health is 100)
      if (who === 'player') {
        playerHp.value = Math.min(100, playerHp.value + 15)
        playerDmgBar.value = playerHp.value
        spawnDamageNumber('+15% HP', itemX, 36, 'heal')
      } else {
        enemyHp.value = Math.min(100, enemyHp.value + 15)
        enemyDmgBar.value = enemyHp.value
        spawnDamageNumber('+15% HP', itemX, 36, 'heal')
      }

      playPickupSound()
      coyolItem.value = null

      // Schedule next respawn after 20 seconds
      clearTimeout(coyolSpawnTimeout)
      coyolSpawnTimeout = setTimeout(() => {
        spawnCoyolItem()
      }, 20000)
    }

    function checkItemCollection() {
      if (!coyolItem.value || !coyolItem.value.visible) return

      const playerThreshold = playerChar.value?.type === 'padre' ? 6.0 : 4.5
      const enemyThreshold = enemyChar.value?.type === 'padre' ? 6.0 : 4.5

      if (Math.abs(playerX.value - coyolItem.value.x) < playerThreshold) {
        collectItem('player')
      } else if (Math.abs(enemyX.value - coyolItem.value.x) < enemyThreshold) {
        collectItem('enemy')
      }
    }

    function spawnDamageNumber(amount, x, y, type) {
      const id = ++dmgIdCounter

      damageNumbers.value.push({
        id,
        text: typeof amount === 'number' ? `-${amount}%` : amount,
        x: clamp(x + (Math.random() - 0.5) * 7, 8, 92),
        y: y + (Math.random() - 0.5) * 8,
        type,
      })

      setTimeout(() => {
        damageNumbers.value = damageNumbers.value.filter(d => d.id !== id)
      }, 950)
    }

    function triggerFeedback(power = 'light', strong = false) {
      flashActive.value = true
      zoomHit.value = strong
      cameraClass.value = power === 'strong' ? 'shaking strong' : 'shaking'

      setTimeout(() => {
        flashActive.value = false
      }, 90)

      setTimeout(() => {
        zoomHit.value = false
        cameraClass.value = ''
      }, strong ? 340 : 190)
    }

    function showMessage(text, type = 'normal') {
      battleMessage.value = text
      messageType.value = type
      clearTimeout(msgTimer)

      msgTimer = setTimeout(() => {
        battleMessage.value = ''
      }, 900)
    }

    function hpClass(hp) {
      if (hp > 60) return 'hp-high'
      if (hp > 25) return 'hp-mid'
      return 'hp-low'
    }

    function startTimer() {
      clearInterval(timerInterval)

      timerInterval = setInterval(() => {
        if (battleOver.value || introActive.value || showMoveMenu.value) return

        timeLeft.value--

        if (timeLeft.value <= 0) {
          clearInterval(timerInterval)
          endBattle(playerHp.value >= enemyHp.value ? 'player' : 'enemy')
        }
      }, 1000)
    }

    function scheduleAiAttack() {
      clearTimeout(aiTimeout)
      if (battleOver.value || introActive.value) return

      const delay = Math.random() * 1900 + 1500

      aiTimeout = setTimeout(async () => {
        if (battleOver.value || introActive.value) return

        if (showMoveMenu.value) {
          scheduleAiAttack()
          return
        }

        if (Math.random() > 0.78) {
          await jump('enemy')
        } else {
          let enemyAtk
          if (enemyChar.value?.type === 'segua') {
            const rand = Math.random()
            if (rand > 0.66 && enemySpecialCooldown.value === 0) {
              enemyAtk = {
                id: 2,
                name: 'Energía Maldita',
                damage: 22,
                type: 'special',
                delay: 800,
                range: 48,
                special: true,
                effect: 'coyolBlast',
                animation: 'projectile',
              }
            } else if (rand > 0.33 && enemySpecialCooldown.value === 0) {
              enemyAtk = {
                id: 3,
                name: 'Grito Terrorífico',
                damage: 16,
                type: 'heavy',
                delay: 520,
                range: 20,
                special: true,
                effect: '',
                animation: 'special',
              }
            } else {
              enemyAtk = {
                id: 1,
                name: 'Ataque de Garras',
                damage: 10,
                type: 'fast',
                delay: 360,
                range: 20,
                animation: 'attack',
              }
            }
          } else if (enemyChar.value?.type === 'padre') {
            const rand = Math.random()
            if (rand > 0.66 && enemySpecialCooldown.value === 0) {
              enemyAtk = {
                id: 2,
                name: 'Tirar la Cabeza',
                damage: 20,
                type: 'special',
                delay: 800,
                range: 48,
                special: true,
                effect: 'headThrow',
                animation: 'special',
              }
            } else if (rand > 0.33) {
              enemyAtk = {
                id: 3,
                name: 'Grito del Padre',
                damage: 12,
                type: 'heavy',
                delay: 520,
                range: 20,
                animation: 'heavy',
              }
            } else {
              enemyAtk = {
                id: 1,
                name: 'Zarpazo de Garras',
                damage: 8,
                type: 'fast',
                delay: 360,
                range: 20,
                animation: 'attack',
              }
            }
          } else if (enemyChar.value?.type === 'cadejos') {
            const rand = Math.random()
            if (rand > 0.66 && enemySpecialCooldown.value === 0) {
              enemyAtk = {
                id: 2,
                name: 'Carrera Espectral',
                damage: 15,
                type: 'special',
                delay: 800,
                range: 48,
                special: true,
                effect: 'shadowWolf',
                animation: 'special',
              }
            } else if (rand > 0.33) {
              enemyAtk = {
                id: 3,
                name: 'Zarpazo de Fuego',
                damage: 20,
                type: 'heavy',
                delay: 520,
                range: 20,
                animation: 'heavy',
              }
            } else {
              enemyAtk = {
                id: 1,
                name: 'Mordida Rápida',
                damage: 10,
                type: 'fast',
                delay: 360,
                range: 20,
                animation: 'attack',
              }
            }
          } else {
            enemyAtk = (Math.random() > 0.72 && enemySpecialCooldown.value === 0)
              ? {
                  id: 2,
                  name: enemyChar.value?.skill || 'Especial',
                  damage: 15,
                  type: 'special',
                  delay: 680,
                  range: 32,
                  special: true,
                }
              : {
                  id: 1,
                  name: 'Zarpazo',
                  damage: Math.floor(Math.random() * 8) + 6,
                  type: 'fast',
                  delay: 360,
                  range: 18,
                }
          }

          await performAttack('enemy', enemyAtk)
        }

        scheduleAiAttack()
      }, delay)
    }

    function startFight() {
      introActive.value = false
      ready.value = true
      canAttack.value = true
      showMessage('¡PELEA!', 'fight')
      playSound('startFight')
      startTimer()
      scheduleAiAttack()

      // Spawn first Coyol bottle after 10 seconds of combat
      clearTimeout(coyolSpawnTimeout)
      coyolSpawnTimeout = setTimeout(() => {
        spawnCoyolItem()
      }, 10000)
    }

    function runIntro() {
      introActive.value = true
      introPhase.value = 1
      canAttack.value = false

      setTimeout(() => {
        introPhase.value = 2
      }, 1200)

      setTimeout(() => {
        introPhase.value = 3
      }, 2500)

      setTimeout(startFight, 3900)
    }

    function endBattle(win) {
      clearInterval(timerInterval)
      clearTimeout(aiTimeout)
      battleOver.value = true
      winner.value = win
      canAttack.value = false

      playSound('ko')

      if (win === 'enemy') {
        playerState.value = 'ko'
        enemyState.value = 'victory'
      }
      if (win === 'player') {
        enemyState.value = 'ko'
        playerState.value = 'victory'

        // Play victory fanfare after a short delay
        setTimeout(() => {
          if (battleOver.value && winner.value === 'player') {
            playSound('victory')
          }
        }, 800)
      }
    }

    function restartBattle() {
      playerHp.value = 100
      enemyHp.value = 100
      playerDamageDealt.value = 0
      playerDmgBar.value = 100
      enemyDmgBar.value = 100
      timeLeft.value = 60
      round.value++
      playerX.value = 22
      enemyX.value = 76
      battleOver.value = false
      winner.value = null
      canAttack.value = true
      playerState.value = 'idle'
      enemyState.value = 'idle'
      playerVulnerable.value = false
      enemyVulnerable.value = false
      playerSpecialCooldown.value = 0
      enemySpecialCooldown.value = 0
      specialEffect.value = ''
      activeProjectiles.value = []
      coyolItem.value = null
      showMoveMenu.value = false
      damageNumbers.value = []
      showMessage('¡PELEA!', 'fight')
      startTimer()
      scheduleAiAttack()

      // Spawn Coyol bottle after 10 seconds of combat
      clearTimeout(coyolSpawnTimeout)
      coyolSpawnTimeout = setTimeout(() => {
        spawnCoyolItem()
      }, 10000)
    }

    const keysPressed = {}

    function handleKeydown(event) {
      if (battleOver.value || introActive.value || showMoveMenu.value) return

      keysPressed[event.code] = true

      if (event.code === 'Space' || event.code === 'KeyW') {
        event.preventDefault()
        jump('player')
      }

      if (event.code === 'KeyS') {
        const rigidStates = ['jump', 'attack', 'special', 'projectile', 'hit', 'ko', 'heavy']
        if (!rigidStates.includes(playerState.value)) {
          playerState.value = 'block'
        }
      }

      if (event.code === 'KeyJ') playerAttack(attacks.value[0])
      if (event.code === 'KeyQ' || event.code === 'KeyK') playerAttack(attacks.value[1])
      if (event.code === 'KeyL') playerAttack(attacks.value[2])


    }

    function handleKeyup(event) {
      keysPressed[event.code] = false
      if (event.code === 'KeyS') {
        if (playerState.value === 'block') {
          playerState.value = 'idle'
        }
      }
    }

    const speed = 0.5
    const aiSpeed = 0.35

    function updateMovement() {
      if (battleOver.value || introActive.value) return

      const rigidStates = ['jump', 'attack', 'special', 'projectile', 'hit', 'ko', 'block', 'heavy']
      if (rigidStates.includes(playerState.value)) return

      let isMoving = false

      if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
        playerX.value = clamp(playerX.value - speed, 8, enemyX.value - 12)
        isMoving = true
      }
      if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
        playerX.value = clamp(playerX.value + speed, 8, enemyX.value - 12)
        isMoving = true
      }

      if (isMoving) {
        if (playerState.value !== 'walk') playerState.value = 'walk'
      } else {
        if (playerState.value === 'walk') playerState.value = 'idle'
      }
    }

    function updateAiMovement() {
      if (battleOver.value || introActive.value) return

      const rigidStates = ['jump', 'attack', 'special', 'projectile', 'hit', 'ko', 'block', 'heavy']

      // AI blocking chance if player is close and attacking
      const isPlayerAttacking = playerState.value === 'attack' || playerState.value === 'special' || playerState.value === 'projectile' || playerState.value === 'heavy'
      if (isPlayerAttacking && getDistance() < 24 && Math.random() < 0.02) {
        if (!rigidStates.includes(enemyState.value)) {
          enemyState.value = 'block'
          setTimeout(() => {
            if (enemyState.value === 'block' && !battleOver.value) {
              enemyState.value = 'idle'
            }
          }, 380)
          return
        }
      }

      if (rigidStates.includes(enemyState.value)) return

      const distance = enemyX.value - playerX.value
      let isMoving = false

      if (distance > 26) {
        enemyX.value = clamp(enemyX.value - aiSpeed, playerX.value + 12, 92)
        isMoving = true
      } else if (distance < 15) {
        enemyX.value = clamp(enemyX.value + aiSpeed, playerX.value + 12, 92)
        isMoving = true
      }

      if (isMoving) {
        if (enemyState.value !== 'walk') enemyState.value = 'walk'
      } else {
        if (enemyState.value === 'walk') enemyState.value = 'idle'
      }
    }

    function spawnProjectile(attacker, damage) {
      const isPlayer = attacker === 'player'
      const startX = isPlayer ? playerX.value + 6 : enemyX.value - 6
      const direction = isPlayer ? 1 : -1
      const attackerChar = isPlayer ? playerChar.value : enemyChar.value
      const frameCount = attackerChar?.type === 'cadejos' ? 4 : 7
      
      activeProjectiles.value.push({
        id: nextProjectileId++,
        attacker,
        x: startX,
        y: 35,
        speed: 1.8,
        direction,
        damage,
        frame: 0,
        frameCount,
        lastFrameTime: Date.now()
      })
    }

    function updateProjectiles() {
      if (battleOver.value) {
        activeProjectiles.value = []
        return
      }

      const now = Date.now()
      const projs = []
      
      for (const proj of activeProjectiles.value) {
        // Move horizontally
        proj.x += proj.speed * proj.direction
        
        // Cycle frames
        if (now - proj.lastFrameTime > 80) {
          proj.frame = (proj.frame + 1) % proj.frameCount
          proj.lastFrameTime = now
        }
        
        // Check for collision
        const isPlayer = proj.attacker === 'player'
        const targetX = isPlayer ? enemyX.value : playerX.value
        
        // Collision threshold
        const collisionDist = 6.0
        let hit = false
        if (proj.direction > 0 && proj.x >= targetX - collisionDist) {
          hit = true
        } else if (proj.direction < 0 && proj.x <= targetX + collisionDist) {
          hit = true
        }
        
        if (hit) {
          // Projectile damages enemy on collision
          doHit(proj.attacker, proj.damage, true, 'strong')
          // Disappears on impact (do not push to projs)
        } else if (proj.x < -10 || proj.x > 110) {
          // Disappears if off-screen (do not push to projs)
        } else {
          projs.push(proj)
        }
      }
      
      activeProjectiles.value = projs
    }

    // Loop principal del juego.
    let rafId = null

    function gameLoop() {
      if (!showMoveMenu.value) {
        updateMovement()
        updateAiMovement()
        checkItemCollection()
        updateProjectiles()
      }
      rafId = requestAnimationFrame(gameLoop)
    }


    let cooldownInterval = null

    onMounted(() => {
      // Preload Segua and Padre animation frames to prevent disappearing/flickering
      const framesToPreload = []
      const anims = [seguaAnimations, padreAnimations]
      anims.forEach(anim => {
        if (anim) {
          Object.values(anim).forEach(frameArray => {
            if (Array.isArray(frameArray)) {
              framesToPreload.push(...frameArray)
            }
          })
        }
      })
      framesToPreload.forEach(src => {
        const img = new Image()
        img.src = src
      })

      cooldownInterval = setInterval(() => {
        if (playerSpecialCooldown.value > 0) playerSpecialCooldown.value--
        if (enemySpecialCooldown.value > 0) enemySpecialCooldown.value--
      }, 1000)

      ready.value = true
      startSpriteLoop('player')
      startSpriteLoop('enemy')
      gameLoop()
      runIntro()
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('keyup', handleKeyup)
    })

    onUnmounted(() => {
      clearInterval(timerInterval)
      clearInterval(cooldownInterval)
      clearTimeout(playerFrameTimer)
      clearTimeout(enemyFrameTimer)
      clearTimeout(aiTimeout)
      clearTimeout(msgTimer)
      clearTimeout(enemyVulnerableTimer)
      clearTimeout(coyolSpawnTimeout)
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
    })

    function getProjectileSrc(proj) {
      const isPlayer = proj.attacker === 'player'
      const attackerChar = isPlayer ? playerChar.value : enemyChar.value
      if (attackerChar?.type === 'cadejos') {
        return cadejosAnimations.projectile[proj.frame % cadejosAnimations.projectile.length]
      }
      return padreAnimations.projectile[proj.frame % padreAnimations.projectile.length]
    }

    function getProjectileClass(proj) {
      const isPlayer = proj.attacker === 'player'
      const attackerChar = isPlayer ? playerChar.value : enemyChar.value
      return attackerChar?.type === 'cadejos' ? 'cadejos-proj' : 'padre-proj'
    }

    return {
      emit,
      playerChar,
      enemyChar,
      getProjectileSrc,
      getProjectileClass,
      stageBackgroundStyle,
      playerX,
      enemyX,
      playerHp,
      enemyHp,
      playerDmgBar,
      enemyDmgBar,
      timeLeft,
      round,
      ready,
      canAttack,
      battleOver,
      winner,
      flashActive,
      zoomHit,
      cameraClass,
      battleMessage,
      messageType,
      damageNumbers,
      specialEffect,
      specialDirection,
      specialEffectStyle,
      coyolItem,
      showMoveMenu,
      introActive,
      introPhase,
      playerState,
      enemyState,
      playerFlash,
      enemyFlash,
      playerVulnerable,
      enemyVulnerable,
      playerSpecialCooldown,
      enemySpecialCooldown,
      attacks,
      currentSprite,
      onSpriteError,
      playerAttack,
      restartBattle,
      jump,
      getJumpDuration,
      getSpriteStyle,
      hpClass,
      getSpritesFor,
      playerFrame,
      enemyFrame,
      activeProjectiles,
      padreAnimations,
      cadejosAnimations,
      playSound,
      playerDamageDealt,
    }
  },
}
</script>

<style scoped>
/* ── RESET / BASE ─────────────────────────────────────────── */
.battle-screen {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #050508;
  z-index: 1;
}

.arena.shaking { animation: screenShake 0.18s ease both; }
.arena.shaking.strong { animation: screenShakeStrong 0.32s ease both; }
.arena.zoom-hit { animation: impactZoom 0.28s ease both; }

@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(3px, -1px); }
  50% { transform: translate(-3px, 1px); }
  75% { transform: translate(2px, 1px); }
}

@keyframes screenShakeStrong {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(7px, -3px) scale(1.01); }
  45% { transform: translate(-8px, 2px) scale(1.012); }
  70% { transform: translate(5px, 3px) scale(1.006); }
}

@keyframes impactZoom {
  0%, 100% { filter: none; }
  35% { filter: contrast(1.12) brightness(1.12); }
}

/* ── FIXED BACKGROUND LAYER ─────────────────────────── */
.stage-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
}



/* ── HUD ──────────────────────────────────────────────────── */
.battle-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1rem 2rem 0.8rem;
  background: transparent;
  position: relative;
  z-index: 20;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.battle-header.visible {
  opacity: 1;
  transform: translateY(0);
}

.battle-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 3%;
  right: 3%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blood), var(--gold), var(--blood), transparent);
}

.fighter-side {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.fighter-side.right { align-items: flex-end; }

.fighter-name {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--gold);
}

.hp-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hp-bar-wrap.reversed { flex-direction: row-reverse; }

.hp-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  min-width: 2.5rem;
}

.hp-bar {
  width: 240px;
  height: 22px;
  background: #111116;
  border: 3px solid #000;
  box-shadow: 0 0 0 1.5px rgba(200,168,75,0.45);
  position: relative;
  overflow: hidden;
}

.hp-fill,
.hp-damage-fill {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  transition: width 0.4s ease;
}

.hp-bar::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: repeating-linear-gradient(90deg, transparent, transparent 7px, #000 7px, #000 9px);
  pointer-events: none;
  z-index: 5;
}

.hp-damage-fill {
  background: rgba(255,255,255,0.3);
  transition: width 1.2s ease 0.4s;
}

.hp-fill.player-hp,
.hp-fill.enemy-hp {
  background: #00ff66;
}

.hp-bar.hp-mid .hp-fill {
  background: #ffff00;
}

.hp-bar.hp-low .hp-fill {
  background: #ff0033;
  animation: lowHpPulse 0.4s ease-in-out infinite;
}

@keyframes lowHpPulse {
  0%,100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
}

.timer-block {
  text-align: center;
  min-width: 170px;
}

.stage-name {
  font-family: var(--font-display);
  font-size: 0.58rem;
  color: var(--text-muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.2rem;
}

.vs-badge {
  font-family: var(--font-title);
  font-size: 1.4rem;
  color: var(--gold-bright);
  text-shadow: 0 0 15px rgba(240,208,96,0.8), 2px 2px 0 rgba(139,0,0,1);
  animation: vsPulse 2s ease-in-out infinite;
}

@keyframes vsPulse {
  0%,100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.battle-timer {
  font-family: var(--font-title);
  font-size: 2.2rem;
  color: var(--gold-bright);
  text-shadow: 0 0 20px rgba(240,208,96,0.6);
  line-height: 1;
}

.battle-timer.warning {
  color: var(--blood-light);
  animation: timerWarn 0.3s ease-in-out infinite;
}

@keyframes timerWarn {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.round-label {
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

/* ── ARENA ────────────────────────────────────────────────── */
.arena {
  flex: 1;
  position: relative;
  z-index: 15;
  min-height: 58vh;
  opacity: 0;
  transition: opacity 0.6s ease;
  transform-origin: center bottom;
}

.arena.visible { opacity: 1; }

/* ── SPRITES ──────────────────────────────────────────────── */
.fighter-sprite {
  position: absolute;
  bottom: 40px;
  translate: -50% 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 16;
  transition: left 0.08s linear;
  will-change: left;
}

.sprite-img {
  height: calc(var(--base-height) * var(--display-scale));
  max-width: min(50vw, 400px);
  object-fit: contain;
  filter: none;
  transform-origin: bottom center;
  transform: translateX(var(--feet-offset-pct, 0%));
}

.sprite-img.flipped { transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)); }

.sprite-img.flash-hit {
  filter: drop-shadow(0 0 0 white) brightness(4);
  transition: filter 0.06s;
}

.sprite-img.block {
  filter: drop-shadow(0 0 20px rgba(240, 208, 96, 0.8)) brightness(1.1) !important;
  transform: translateX(var(--feet-offset-pct, 0%)) scale(0.96) !important;
}

.sprite-img.flipped.block {
  transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)) scale(0.96) !important;
}

.fighter-sprite .sprite-img:not(.attack):not(.special):not(.projectile):not(.hit):not(.jump):not(.ko):not(.block) {
  /* No idleBreath animation to keep character strictly grounded */
}

.sprite-img.walk {
  /* No walkBob animation to keep character strictly grounded */
}

.fighter-sprite.player .sprite-img.attack,
.fighter-sprite.player .sprite-img.special,
.fighter-sprite.player .sprite-img.projectile,
.fighter-sprite.player .sprite-img.heavy {
  animation: attackLungeRight 0.36s ease-out !important;
}

@keyframes attackLungeRight {
  0%,100% { transform: translateX(var(--feet-offset-pct, 0%)); }
  40% { transform: translateX(calc(44px + var(--feet-offset-pct, 0%))) scale(1.06); }
}

.fighter-sprite.enemy .sprite-img.attack,
.fighter-sprite.enemy .sprite-img.special,
.fighter-sprite.enemy .sprite-img.projectile,
.fighter-sprite.enemy .sprite-img.heavy {
  animation: attackLungeLeft 0.36s ease-out !important;
}

@keyframes attackLungeLeft {
  0%,100% { transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)); }
  40% { transform: scaleX(-1) translateX(calc(44px + var(--feet-offset-pct, 0%))) scale(1.06); }
}

.sprite-img.hit {
  animation: hitShake 0.3s ease !important;
}

@keyframes hitShake {
  0%,100% { translate: 0 0; }
  20% { translate: -12px 0; }
  40% { translate: 10px 0; }
  60% { translate: -7px 0; }
  80% { translate: 5px 0; }
}

.sprite-img.jump {
  animation: jumpMove 1.2s ease-in-out !important;
}

.fighter-sprite.enemy .sprite-img.jump {
  animation: jumpMoveFlipped 1.2s ease-in-out !important;
}

@keyframes jumpMove {
  0%,100% { transform: translateX(var(--feet-offset-pct, 0%)) translateY(0); }
  35% { transform: translateX(var(--feet-offset-pct, 0%)) translateY(-120px); }
  68% { transform: translateX(var(--feet-offset-pct, 0%)) translateY(-125px); }
}

@keyframes jumpMoveFlipped {
  0%,100% { transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)) translateY(0); }
  35% { transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)) translateY(-120px); }
  68% { transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)) translateY(-125px); }
}

.fighter-sprite.player .sprite-img.ko {
  animation: koFall 0.65s ease-out forwards !important;
}

.fighter-sprite.enemy .sprite-img.ko {
  animation: koFallEnemy 0.65s ease-out forwards !important;
}

@keyframes koFall {
  to { transform: translateX(var(--feet-offset-pct, 0%)) rotate(-82deg) translateY(15px); opacity: 1.0; }
}

@keyframes koFallEnemy {
  to { transform: scaleX(-1) translateX(var(--feet-offset-pct, 0%)) rotate(82deg) translateY(15px); opacity: 1.0; }
}

.fighter-sprite.segua {
  --display-scale: 1.0;
  --base-height: 280px; /* Scale Segua to 280px tall */
}
.fighter-sprite.segua .sprite-img {
  filter: none;
}

.fighter-sprite.cadejos {
  --display-scale: 1.0;
  --base-height: 320px;
}
.fighter-sprite.cadejos .sprite-img {
  max-width: min(55vw, 450px);
  filter: none;
}

.fighter-sprite.padre {
  --display-scale: 1.0;
  --base-height: 300px;
}
.fighter-sprite.padre .sprite-img {
  filter: none;
}

.fighter-sprite.vulnerable::before {
  content: 'Vulnerable';
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  color: #b7ff6a;
  text-shadow: 0 0 12px rgba(120,255,90,0.9);
  z-index: 3;
}



/* ── EFECTOS ESPECIALES ───────────────────────────────────── */
/* ── VINO DE COYOL PICKUP ITEM ───────────────────────────── */
.coyol-item {
  position: absolute;
  bottom: 0;
  translate: -50% 0;
  width: 80px;
  height: 80px;
  z-index: 10;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coyol-item-img {
  height: 80px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 15px rgba(240, 208, 96, 0.82));
  animation: coyolFloat 2s ease-in-out infinite;
}

@keyframes coyolFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.coyol-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #f0d060;
  box-shadow: 0 0 6px #f0d060;
  border-radius: 50%;
  opacity: 0;
}

.coyol-particle.p1 { left: 20%; bottom: 10px; animation: coyolSparkle 1.8s infinite 0s; }
.coyol-particle.p2 { right: 25%; bottom: 20px; animation: coyolSparkle 2.2s infinite 0.4s; }
.coyol-particle.p3 { left: 45%; bottom: 5px; animation: coyolSparkle 1.5s infinite 0.8s; }
.coyol-particle.p4 { right: 15%; bottom: 30px; animation: coyolSparkle 2.0s infinite 1.2s; }

@keyframes coyolSparkle {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
}

.special-effect {
  position: absolute;
  top: 34%;
  height: 150px;
  pointer-events: none;
  z-index: 22;
}

.special-effect.coyolBlast::before {
  content: '';
  position: absolute;
  top: 35px;
  left: 0;
  width: 100px;
  height: 44px;
  background: url('/src/assets/images/characters/segua/projectile.png') no-repeat center;
  background-size: contain;
  animation: headThrowFx 0.72s ease-in forwards;
}

.special-effect.from-enemy.coyolBlast::before {
  animation-name: headThrowFxReverse;
  transform: scaleX(-1);
}

.special-effect.headThrow::before {
  content: '';
  position: absolute;
  top: 35px;
  left: 0;
  width: 90px;
  height: 70px;
  background: url('/src/assets/images/characters/padre/projectile.png') no-repeat center;
  background-size: contain;
  animation: headThrowFx 0.72s ease-in forwards;
}

.special-effect.from-enemy.headThrow::before {
  animation-name: headThrowFxReverse;
  transform: scaleX(-1);
}

.projectile-entity {
  position: absolute;
  bottom: 160px; /* Aligned to raised combat floor, chest/head level */
  width: 90px;
  height: 90px;
  z-index: 21;
  pointer-events: none;
  transform-origin: center center;
}
.projectile-entity.cadejos-proj {
  bottom: 85px; /* raised lower height matching the dog's height */
  width: 100px;
  height: 100px;
}
.projectile-entity.padre-proj {
  bottom: 160px;
}

.projectile-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(90, 160, 255, 0.7));
}


@keyframes headThrowFx {
  from { opacity: 1; transform: translateX(0) rotate(0deg) scale(0.8); }
  to { opacity: 0; transform: translateX(calc(100% - 70px)) rotate(760deg) scale(1.12); }
}

@keyframes headThrowFxReverse {
  from { opacity: 1; transform: translateX(calc(100% - 70px)) rotate(0deg) scale(0.8); }
  to { opacity: 0; transform: translateX(0) rotate(-760deg) scale(1.12); }
}

.special-effect.acidSpit {
  height: 120px;
  background: linear-gradient(90deg, rgba(155,255,92,0), rgba(155,255,92,0.42), rgba(0,255,190,0));
  filter: blur(2px) drop-shadow(0 0 20px rgba(120,255,90,0.8));
  animation: acidTrail 0.72s ease-out forwards;
}

.special-effect.acidSpit::before {
  content: '';
  position: absolute;
  inset: 38px 0 32px;
  background:
    radial-gradient(circle, rgba(190,255,110,0.92) 0 12%, transparent 14%) 0 0 / 42px 30px,
    linear-gradient(90deg, rgba(140,255,90,0.9), rgba(0,255,190,0.12));
  clip-path: polygon(0 32%, 78% 8%, 100% 50%, 78% 88%, 0 68%);
}

.acid-drop {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #b7ff6a;
  box-shadow: 0 0 16px rgba(183,255,106,0.95);
  animation: acidDrop 0.62s ease-out forwards;
}

.acid-drop.d1 { left: 30%; top: 18px; }
.acid-drop.d2 { left: 58%; top: 72px; animation-delay: 0.08s; }
.acid-drop.d3 { left: 76%; top: 28px; animation-delay: 0.14s; }

@keyframes acidTrail {
  from { opacity: 0; transform: scaleX(0.18); transform-origin: left center; }
  32% { opacity: 1; }
  to { opacity: 0; transform: scaleX(1); transform-origin: left center; }
}

@keyframes acidDrop {
  to { opacity: 0; transform: translateY(34px) scale(0.3); }
}

.special-effect.chainStrike::before,
.special-effect.chainStrike::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 18px;
  background:
    repeating-linear-gradient(90deg, transparent 0 10px, rgba(210,210,210,0.95) 10px 20px, transparent 20px 30px),
    linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0));
  box-shadow: 0 0 18px rgba(0,212,255,0.65);
  animation: chainStrikeFx 0.68s ease-out forwards;
}

.special-effect.chainStrike::before { top: 38px; rotate: -8deg; }
.special-effect.chainStrike::after { top: 78px; rotate: 7deg; animation-delay: 0.08s; }

@keyframes chainStrikeFx {
  from { opacity: 0; transform: scaleX(0.1) translateX(-20%); }
  35% { opacity: 1; }
  to { opacity: 0; transform: scaleX(1.1) translateX(12%); }
}

.special-effect.deadlyBite::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse, rgba(192,57,43,0.5), transparent 65%);
  filter: blur(8px);
  animation: biteFx 0.5s ease-out forwards;
}

@keyframes biteFx {
  from { opacity: 0; transform: scaleX(0.4); }
  45% { opacity: 1; }
  to { opacity: 0; transform: scaleX(1.2); }
}

/* ── NÚMEROS DE DAÑO ──────────────────────────────────────── */
.damage-numbers {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 28;
}

.damage-number {
  position: absolute;
  font-family: var(--font-title);
  font-size: 1.8rem;
  font-weight: 900;
  pointer-events: none;
}

.damage-number.enemy-dmg {
  color: var(--blood-light);
  text-shadow: 0 0 15px rgba(192,57,43,0.9), 2px 2px 0 #000;
}

.damage-number.player-dmg {
  color: #fff;
  text-shadow: 0 0 15px rgba(255,255,255,0.6), 2px 2px 0 #000;
}

.damage-number.heal {
  color: var(--gold-bright);
  text-shadow: 0 0 15px rgba(240,208,96,0.9), 2px 2px 0 #000;
}

.damage-number.vulnerable {
  color: #b7ff6a;
  font-size: 1.2rem;
  text-shadow: 0 0 16px rgba(120,255,90,0.9), 2px 2px 0 #000;
}

.dmg-pop-enter-active { animation: dmgFloat 0.9s ease-out forwards; }
.dmg-pop-leave-active { display: none; }

@keyframes dmgFloat {
  0% { opacity: 1; transform: translateY(0) scale(0.5); }
  30% { opacity: 1; transform: translateY(-30px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-80px) scale(0.8); }
}

/* ── MENSAJE BATALLA ──────────────────────────────────────── */
.battle-message {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-title);
  font-size: clamp(1.5rem, 5vw, 3rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  pointer-events: none;
  z-index: 30;
  text-align: center;
  text-shadow: 2px 2px 0 #000;
}

.battle-message.hit { color: var(--blood-light); }
.battle-message.heal { color: var(--gold-bright); text-shadow: 0 0 25px rgba(240,208,96,0.9), 2px 2px 0 #000; }
.battle-message.vulnerable { color: #b7ff6a; text-shadow: 0 0 25px rgba(120,255,90,0.9), 2px 2px 0 #000; }
.battle-message.fight { color: var(--gold-bright); font-size: clamp(2rem, 7vw, 4.5rem); text-shadow: 0 0 30px rgba(240,208,96,0.8), 3px 3px 0 rgba(139,0,0,1); }

.battle-msg-enter-active { animation: msgPop 0.8s ease-out; }
.battle-msg-leave-active { transition: opacity 0.2s; }
.battle-msg-leave-to { opacity: 0; }

@keyframes msgPop {
  0% { opacity: 0; transform: translateX(-50%) scale(1.8); }
  30% { opacity: 1; transform: translateX(-50%) scale(0.95); }
  85% { opacity: 1; transform: translateX(-50%) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) scale(1); }
}

/* ── CONTROLES ────────────────────────────────────────────── */
.battle-controls.compact {
  position: fixed;
  left: 50%;
  bottom: 1.2rem;
  transform: translateX(-50%) translateY(20px);
  z-index: 45;
  width: min(760px, calc(100% - 2rem));
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.battle-controls.compact.visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.quick-controls {
  display: flex;
  justify-content: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.control-chip {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold-bright);
  background: rgba(5,5,8,0.82);
  border: 1px solid rgba(200,168,75,0.45);
  padding: 0.75rem 1.1rem;
  cursor: pointer;
  backdrop-filter: blur(8px);
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
}

.control-chip:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--gold-bright);
  background: rgba(30,18,8,0.92);
}

.control-chip:disabled,
.control-chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.coyol-chip {
  color: var(--gold);
  border-color: rgba(240,208,96,0.45);
}

.cooldown-badge {
  color: var(--cyan-soul);
  font-size: 0.65rem;
  margin-left: 0.4rem;
}

.move-menu {
  margin-top: 0.8rem;
  background: linear-gradient(180deg, rgba(10,10,16,0.96), rgba(5,5,8,0.94));
  border: 1px solid rgba(200,168,75,0.45);
  box-shadow: 0 0 30px rgba(0,0,0,0.75), inset 0 0 30px rgba(200,168,75,0.05);
  backdrop-filter: blur(10px);
  padding: 1rem;
  position: relative;
}

.move-menu::before,
.move-menu::after {
  content: '';
  position: absolute;
  width: 26px;
  height: 26px;
  border-color: var(--gold);
  border-style: solid;
  pointer-events: none;
}

.move-menu::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
.move-menu::after { right: -1px; bottom: -1px; border-width: 0 2px 2px 0; }

.move-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--gold);
  padding-bottom: 0.8rem;
  margin-bottom: 0.8rem;
  border-bottom: 1px solid rgba(200,168,75,0.18);
}

.close-moves {
  background: transparent;
  border: none;
  color: var(--gold);
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.move-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

.move-row {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.75rem 0.9rem;
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, transform 0.2s, border-color 0.2s;
}

.move-row:hover:not(:disabled) {
  transform: translateX(4px);
  background: rgba(200,168,75,0.08);
  border-color: rgba(200,168,75,0.35);
}

.move-row.disabled,
.move-row:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.move-key {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-family: var(--font-title);
  font-size: 1rem;
  color: #050508;
  background: var(--gold-bright);
  box-shadow: 0 0 15px rgba(240,208,96,0.35);
}

.move-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.move-info strong {
  font-family: var(--font-display);
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
}

.move-info small {
  font-family: var(--font-display);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.move-damage {
  font-family: var(--font-title);
  font-size: 0.9rem;
  color: var(--blood-light);
  white-space: nowrap;
}

.move-damage.evade { color: var(--cyan-soul); }
.move-damage.heal { color: var(--gold-bright); }
.move-row.special .move-key { background: var(--cyan-soul); }
.move-row.heavy .move-key { background: var(--blood-light); color: #fff; }
.move-row.coyol .move-key { background: var(--gold); }

.move-panel-enter-active { animation: movePanelIn 0.25s ease-out; }
.move-panel-leave-active { transition: opacity 0.2s, transform 0.2s; }
.move-panel-leave-to { opacity: 0; transform: translateY(12px) scale(0.98); }

@keyframes movePanelIn {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

/* ── GAME OVER ────────────────────────────────────────────── */
.game-over-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: radial-gradient(circle at center, #120e18 0%, #050407 100%);
}

.go-bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.go-bg-glow.win {
  background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(200,168,75,0.2), transparent 70%);
}

.go-bg-glow.lose {
  background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(139,0,0,0.3), transparent 70%);
}

.finish-him {
  font-family: var(--font-title);
  font-size: clamp(2.5rem, 8vw, 6rem);
  letter-spacing: 0.12em;
  animation: goAppear 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both;
}

.finish-him.win {
  color: var(--gold-bright);
  text-shadow: 0 0 30px rgba(240,208,96,0.9), 4px 4px 0 rgba(100,60,0,1);
}

.finish-him.lose {
  color: var(--blood-light);
  text-shadow: 0 0 30px rgba(192,57,43,1), 4px 4px 0 #000;
}

@keyframes goAppear {
  from { opacity: 0; transform: scale(2); filter: blur(10px); }
  to { opacity: 1; transform: scale(1); filter: blur(0); }
}

.winner-text {
  font-family: var(--font-display);
  font-size: clamp(0.9rem, 3vw, 1.5rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  margin: 0.8rem 0 2rem;
  animation: goAppear 0.5s ease 0.2s both;
}

.go-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  max-width: 320px;
  animation: goAppear 0.5s ease 0.4s both;
}

.go-buttons .btn {
  width: 100%;
  padding: 0.9rem;
}

.fade-enter-active { animation: fadeIn 0.4s ease; }
.fade-leave-active { transition: opacity 0.3s; }
.fade-leave-to { opacity: 0; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── RESPONSIVE ───────────────────────────────────────────── */
@media (max-width: 768px) {
  .battle-header {
    grid-template-columns: 1fr;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
  }

  .fighter-side,
  .fighter-side.right {
    align-items: center;
  }

  .hp-bar {
    width: 160px;
    height: 12px;
  }

  .sprite-img {
    max-width: 48vw;
  }



  .arena { min-height: 54vh; }

  .battle-controls.compact {
    bottom: 0.7rem;
    width: calc(100% - 1rem);
  }

  .move-row {
    grid-template-columns: 44px 1fr auto;
    gap: 0.6rem;
    padding: 0.65rem;
  }

  .move-info strong { font-size: 0.72rem; }
  .move-info small { font-size: 0.6rem; }
  .move-key { width: 34px; height: 34px; }
  .battle-timer { font-size: 1.8rem; }
}
</style>
