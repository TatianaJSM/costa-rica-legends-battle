<template>
  <div
    ref="screenEl"
    class="battle-screen"
    :class="[cameraClass, { 'zoom-hit': zoomHit }]"
  >
    <!-- ── FIXED BACKGROUND LAYER ─────────────────────────── -->
    <div class="stage-background" :style="stageBackgroundStyle"></div>

    <div class="screen-flash" :class="{ active: flashActive, strong: zoomHit }"></div>

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
    <div class="arena" :class="{ visible: ready && !introActive }">

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
          :style="playerState === 'jump' ? { animationDuration: getJumpDuration(playerChar) + 'ms' } : {}"
          loading="eager"
          decoding="async"
          @error="onSpriteError($event, playerChar)"
        />
        <div class="fighter-shadow"></div>
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
          :style="enemyState === 'jump' ? { animationDuration: getJumpDuration(enemyChar) + 'ms' } : {}"
          loading="eager"
          decoding="async"
          @error="onSpriteError($event, enemyChar)"
        />
        <div class="fighter-shadow"></div>
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
        <button class="control-chip" @click="showMoveMenu = !showMoveMenu">Movimientos</button>
        <button class="control-chip" :disabled="battleOver" @click="jump('player')">W / Space</button>
        <button
          class="control-chip coyol-chip"
          :class="{ disabled: coyolUsed }"
          :disabled="coyolUsed || battleOver"
          @click="useCoyol"
        >C · Coyol +15%</button>
      </div>

      <transition name="move-panel">
        <div v-if="showMoveMenu" class="move-menu">
          <div class="move-menu-header">
            <span>Lista de movimientos</span>
            <button class="close-moves" @click="showMoveMenu = false">✕</button>
          </div>

          <div class="move-list">
            <button
              v-for="atk in attacks"
              :key="atk.id"
              class="move-row"
              :class="[atk.type, { disabled: !canAttack }]"
              :disabled="!canAttack"
              @click="playerAttack(atk)"
            >
              <span class="move-key">{{ atk.key }}</span>
              <span class="move-info">
                <strong>{{ atk.name }}</strong>
                <small>{{ atk.note }}</small>
              </span>
              <span class="move-damage">-{{ atk.damage }}%</span>
            </button>

            <button class="move-row utility" @click="jump('player')">
              <span class="move-key">W</span>
              <span class="move-info">
                <strong>Saltar</strong>
                <small>También Space. Evade ataques.</small>
              </span>
              <span class="move-damage evade">Evadir</span>
            </button>

            <button
              class="move-row coyol"
              :class="{ disabled: coyolUsed }"
              :disabled="coyolUsed || battleOver"
              @click="useCoyol"
            >
              <span class="move-key">C</span>
              <span class="move-info">
                <strong>Vino de Coyol</strong>
                <small>Cura 15% una vez por combate.</small>
              </span>
              <span class="move-damage heal">+15%</span>
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- ── PANTALLA FINAL ─────────────────────────────────── -->
    <transition name="fade">
      <div v-if="battleOver" class="game-over-screen">
        <div class="go-bg-glow" :class="winner === 'player' ? 'win' : 'lose'"></div>
        <div class="finish-him" :class="winner === 'player' ? 'win' : 'lose'">
          {{ winner === 'player' ? 'VICTORIA' : 'DERROTA' }}
        </div>
        <div class="winner-text">
          {{ winner === 'player' ? playerChar.name + ' TRIUNFÓ' : enemyChar.name + ' VENCIÓ' }}
        </div>
        <div class="go-buttons">
          <button class="btn btn-primary" @click="restartBattle">REVANCHA</button>
          <button class="btn btn-secondary" @click="emit('go-to', 'select')">CAMBIAR PERSONAJE</button>
          <button class="btn btn-secondary" @click="emit('go-to', 'home')">MENÚ</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import CinematicIntro from './CinematicIntro.vue'
import { seguaAnimations } from '../data/seguaAnimations'
import { cadejosAnimations } from '../data/cadejosAnimations'
import { padreAnimations } from '../data/padreAnimations'

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
// Aquí jump_02 y jump_03 duran más para que el salto se note.
const FRAME_DURATIONS = {
  idle: [180, 180, 180],
  walk: [120, 120, 120, 120],
  jump: [120, 350, 450, 350, 140],
  acid: [60, 60, 60, 60, 60, 60],
  special: [60, 60, 60, 60, 60, 60],
  hit: [120],
  ko: [160],
}

export default {
  name: 'BattleScreen',
  components: { CinematicIntro },
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
    const coyolUsed = ref(false)
    const showMoveMenu = ref(false)
    const introActive = ref(true)
    const introPhase = ref(1)
    const playerVulnerable = ref(false)
    const enemyVulnerable = ref(false)

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
      // Para La Segua, tanto special como attack usan los frames del ácido.
      if (character?.type === 'segua' && (state === 'special' || state === 'attack')) return 'acid'
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
            name: 'Ataque Ácido',
            damage: 20,
            type: 'special',
            delay: 720,
            range: 34,
            special: true,
            note: 'Lanza un grito y escupe un chorro de ácido corrosivo.',
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
          key: 'K',
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
        return { effect: '', message: 'Ataque Ácido', damage: 20, shake: 'strong' }
      }

      if (character?.type === 'cadejos') {
        return { effect: 'chainStrike', message: 'Cadenas sombrías', damage: 22, shake: 'strong' }
      }

      return { effect: 'deadlyBite', message: 'Ataque especial', damage: 18, shake: 'strong' }
    }

    async function performAttack(attacker, attack) {
      if (!attack) return
      if (battleOver.value || introActive.value) return
      if (attacker === 'player' && (playerState.value === 'block' || !canAttack.value)) return

      const isPlayer = attacker === 'player'
      const attackerChar = isPlayer ? playerChar.value : enemyChar.value
      const range = attack.range || (attack.special ? 34 : 18)

      if (isPlayer) canAttack.value = false

      await approachTarget(attacker, range)
      if (battleOver.value) return

      const stateRef = isPlayer ? playerState : enemyState
      stateRef.value = attack.special ? 'special' : 'attack'
      specialDirection.value = isPlayer ? 'from-player' : 'from-enemy'

      let damage = attack.damage
      let message = attack.name
      let shake = attack.special ? 'strong' : 'light'

      if (attack.special) {
        const sp = specialFor(attackerChar)
        damage = sp.damage
        message = sp.message
        shake = sp.shake
        specialEffect.value = sp.effect
      }

      if (isPlayer && enemyVulnerable.value && !attack.special) {
        damage = Math.ceil(damage * 1.25)
        enemyVulnerable.value = false
        clearTimeout(enemyVulnerableTimer)
      }

      showMessage(message, attack.special ? 'fight' : 'normal')
      await sleep(attack.special ? 360 : 190)

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

      await sleep(attack.delay)
      specialEffect.value = ''

      if (!battleOver.value) stateRef.value = 'idle'
      if (isPlayer && !battleOver.value) canAttack.value = true
    }

    function playerAttack(atk) {
      performAttack('player', atk)
    }

    function doHit(attacker, damage, strong = false, shake = 'light') {
      if (battleOver.value) return

      const isPlayer = attacker === 'player'
      const targetState = isPlayer ? enemyState : playerState
      const isBlocking = targetState.value === 'block'
      const finalDamage = isBlocking ? Math.ceil(damage * 0.5) : damage

      triggerFeedback(isBlocking ? 'light' : shake, isBlocking ? false : strong)

      if (isPlayer) {
        enemyFlash.value = true

        setTimeout(() => {
          enemyFlash.value = false
        }, 150)

        enemyHp.value = Math.max(0, enemyHp.value - finalDamage)
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

      const char = fighter === 'player' ? playerChar.value : enemyChar.value
      const duration = getJumpDuration(char)
      await sleep(duration)

      if (!battleOver.value && stateRef.value === 'jump') {
        stateRef.value = 'idle'
      }
    }

    function useCoyol() {
      if (battleOver.value || introActive.value || coyolUsed.value) return

      playerHp.value = Math.min(100, playerHp.value + 15)
      playerDmgBar.value = playerHp.value
      coyolUsed.value = true
      spawnDamageNumber('+15%', playerX.value, 42, 'heal')
      showMessage('Vino de Coyol', 'heal')
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
        if (battleOver.value || introActive.value) return

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

        if (Math.random() > 0.78) {
          await jump('enemy')
        } else {
          let enemyAtk
          if (enemyChar.value?.type === 'segua') {
            enemyAtk = {
              id: 1,
              name: 'Ataque Ácido',
              damage: 20,
              type: 'special',
              delay: 720,
              range: 34,
              special: true,
            }
          } else {
            enemyAtk = Math.random() > 0.72
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
      startTimer()
      scheduleAiAttack()
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

      if (win === 'enemy') playerState.value = 'ko'
      if (win === 'player') enemyState.value = 'ko'
    }

    function restartBattle() {
      playerHp.value = 100
      enemyHp.value = 100
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
      specialEffect.value = ''
      coyolUsed.value = false
      showMoveMenu.value = false
      damageNumbers.value = []
      showMessage('¡PELEA!', 'fight')
      startTimer()
      scheduleAiAttack()
    }

    const keysPressed = {}

    function handleKeydown(event) {
      if (battleOver.value || introActive.value) return

      keysPressed[event.code] = true

      if (event.code === 'Space' || event.code === 'KeyW') {
        event.preventDefault()
        jump('player')
      }

      if (event.code === 'KeyS') {
        const rigidStates = ['jump', 'attack', 'special', 'hit', 'ko']
        if (!rigidStates.includes(playerState.value)) {
          playerState.value = 'block'
        }
      }

      if (playerChar.value?.type === 'segua') {
        // Para La Segua, solo la tecla J realiza ataque
        if (event.code === 'KeyJ') playerAttack(attacks.value[0])
      } else {
        if (event.code === 'KeyJ') playerAttack(attacks.value[0])
        if (event.code === 'KeyK') playerAttack(attacks.value[1])
        if (event.code === 'KeyL') playerAttack(attacks.value[2])
      }

      if (event.code === 'KeyC') useCoyol()
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

      const rigidStates = ['jump', 'attack', 'special', 'hit', 'ko', 'block']
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

      const rigidStates = ['jump', 'attack', 'special', 'hit', 'ko', 'block']

      // AI blocking chance if player is close and attacking
      const isPlayerAttacking = playerState.value === 'attack' || playerState.value === 'special'
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

    // Loop principal del juego.
    let rafId = null

    function gameLoop() {
      updateMovement()
      updateAiMovement()
      rafId = requestAnimationFrame(gameLoop)
    }

    onMounted(() => {
      // Preload La Segua acid attack and jump frames to prevent disappearing/flickering
      const framesToPreload = [
        ...(seguaAnimations?.acid || []),
        ...(seguaAnimations?.jump || [])
      ]
      framesToPreload.forEach(src => {
        const img = new Image()
        img.src = src
      })

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
      clearTimeout(playerFrameTimer)
      clearTimeout(enemyFrameTimer)
      clearTimeout(aiTimeout)
      clearTimeout(msgTimer)
      clearTimeout(enemyVulnerableTimer)
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
    })

    return {
      emit,
      playerChar,
      enemyChar,
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
      coyolUsed,
      showMoveMenu,
      introActive,
      introPhase,
      playerState,
      enemyState,
      playerFlash,
      enemyFlash,
      playerVulnerable,
      enemyVulnerable,
      attacks,
      currentSprite,
      onSpriteError,
      playerAttack,
      restartBattle,
      jump,
      useCoyol,
      getJumpDuration,
      hpClass,
      getSpritesFor,
      playerFrame,
      enemyFrame,
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
  transform-origin: center bottom;
}

.battle-screen.shaking { animation: screenShake 0.18s ease both; }
.battle-screen.shaking.strong { animation: screenShakeStrong 0.32s ease both; }
.battle-screen.zoom-hit { animation: impactZoom 0.28s ease both; }

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

.screen-flash {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(255,255,255,0);
  pointer-events: none;
  transition: background 0.05s;
}

.screen-flash.active { background: rgba(255,255,255,0.18); }
.screen-flash.active.strong { background: rgba(180, 0, 0, 0.24); }

/* ── HUD ──────────────────────────────────────────────────── */
.battle-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1rem 2rem 0.8rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.88), transparent);
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
}

.arena.visible { opacity: 1; }

/* ── SPRITES ──────────────────────────────────────────────── */
.fighter-sprite {
  position: absolute;
  bottom: 7.5%;
  translate: -50% 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 16;
  transition: left 0.08s linear;
  will-change: left;
}

.sprite-img {
  height: 26vh;
  max-width: min(40vw, 320px);
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(0,0,0,0.92));
  transform-origin: center bottom;
}

.sprite-img.flipped { transform: scaleX(-1); }

.sprite-img.flash-hit {
  filter: drop-shadow(0 0 0 white) brightness(4);
  transition: filter 0.06s;
}

.sprite-img.block {
  filter: drop-shadow(0 0 20px rgba(240, 208, 96, 0.8)) brightness(1.1) !important;
  transform: scale(0.96) !important;
}

.sprite-img.flipped.block {
  transform: scaleX(-1) scale(0.96) !important;
}

.fighter-sprite .sprite-img:not(.attack):not(.special):not(.hit):not(.jump):not(.ko):not(.block) {
  animation: idleBreath 2.6s ease-in-out infinite;
}

@keyframes idleBreath {
  0%,100% { translate: 0 0; }
  50% { translate: 0 -6px; }
}

.sprite-img.walk {
  animation: walkBob 0.32s ease-in-out infinite !important;
}

@keyframes walkBob {
  0%,100% { rotate: -0.8deg; translate: 0 0; }
  50% { rotate: 0.8deg; translate: 0 -8px; }
}

.fighter-sprite.player .sprite-img.attack,
.fighter-sprite.player .sprite-img.special {
  animation: attackLungeRight 0.36s ease-out !important;
}

@keyframes attackLungeRight {
  0%,100% { transform: translateX(0); }
  40% { transform: translateX(44px) scale(1.06); }
}

.fighter-sprite.enemy .sprite-img.attack,
.fighter-sprite.enemy .sprite-img.special {
  animation: attackLungeLeft 0.36s ease-out !important;
}

@keyframes attackLungeLeft {
  0%,100% { transform: scaleX(-1) translateX(0); }
  40% { transform: scaleX(-1) translateX(44px) scale(1.06); }
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
  0%,100% { transform: translateY(0); }
  35% { transform: translateY(-120px); }
  68% { transform: translateY(-125px); }
}

@keyframes jumpMoveFlipped {
  0%,100% { transform: scaleX(-1) translateY(0); }
  35% { transform: scaleX(-1) translateY(-120px); }
  68% { transform: scaleX(-1) translateY(-125px); }
}

.fighter-sprite.player .sprite-img.ko {
  animation: koFall 0.65s ease-out forwards !important;
}

.fighter-sprite.enemy .sprite-img.ko {
  animation: koFallEnemy 0.65s ease-out forwards !important;
}

@keyframes koFall {
  to { transform: rotate(-82deg) translateY(35px); opacity: 0.38; }
}

@keyframes koFallEnemy {
  to { transform: scaleX(-1) rotate(82deg) translateY(35px); opacity: 0.38; }
}

.fighter-sprite.segua .sprite-img {
  filter: drop-shadow(0 0 20px rgba(160,216,239,0.42)) drop-shadow(0 0 8px rgba(0,0,0,0.9));
}

.fighter-sprite.cadejos .sprite-img {
  filter: drop-shadow(0 0 20px rgba(192,57,43,0.42)) drop-shadow(0 0 8px rgba(0,0,0,0.9));
}

.fighter-sprite.padre .sprite-img {
  filter: drop-shadow(0 0 20px rgba(0,212,255,0.42)) drop-shadow(0 0 8px rgba(0,0,0,0.9));
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

.fighter-shadow {
  width: 82%;
  height: 18px;
  margin-top: -18px;
  border-radius: 999px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.82), transparent 72%);
  animation: shadowBreath 2.6s ease-in-out infinite;
}

@keyframes shadowBreath {
  0%,100% { transform: scaleX(1); opacity: 0.82; }
  50% { transform: scaleX(0.86); opacity: 0.54; }
}

/* ── EFECTOS ESPECIALES ───────────────────────────────────── */
.special-effect {
  position: absolute;
  top: 34%;
  height: 150px;
  pointer-events: none;
  z-index: 22;
}

.special-effect.headThrow::before {
  content: '';
  position: absolute;
  top: 35px;
  left: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 52% 42%, rgba(255,255,255,0.95) 0 8%, transparent 9%),
    radial-gradient(circle at 38% 38%, rgba(255,255,255,0.95) 0 8%, transparent 9%),
    radial-gradient(circle, rgba(200,245,255,0.98), rgba(0,212,255,0.36) 58%, transparent 70%);
  box-shadow: 0 0 30px rgba(0,212,255,0.95);
  animation: headThrowFx 0.72s ease-in forwards;
}

.special-effect.from-enemy.headThrow::before {
  animation-name: headThrowFxReverse;
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
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
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
    height: clamp(150px, 30vh, 280px);
    max-width: 46vw;
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
