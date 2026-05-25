<template>
  <div class="arena-stage" :class="{ visible }">

    <!-- Sprite jugador -->
    <div class="fighter-sprite player"
      :class="[playerChar.type, {
        attacking: playerAttacking,
        hit:       playerHit,
        ko:        playerKo,
      }]"
    >
      <img :src="playerChar.image" :alt="playerChar.name" />
      <div class="fighter-shadow"></div>
    </div>

    <!-- Números de daño flotantes -->
    <transition-group name="dmg-pop" tag="div" class="damage-numbers">
      <div
        v-for="dmg in damageNumbers"
        :key="dmg.id"
        class="damage-number"
        :class="dmg.type"
        :style="{ left: dmg.x + '%', top: dmg.y + '%' }"
      >{{ dmg.text }}</div>
    </transition-group>

    <!-- Mensaje central de batalla (¡PELEA!, MISS, etc.) -->
    <transition name="battle-msg">
      <div v-if="battleMessage" class="battle-message" :class="messageType">
        {{ battleMessage }}
      </div>
    </transition>

    <!-- Sprite enemigo -->
    <div class="fighter-sprite enemy"
      :class="[enemyChar.type, {
        attacking: enemyAttacking,
        hit:       enemyHit,
        ko:        enemyKo,
      }]"
    >
      <img :src="enemyChar.image" :alt="enemyChar.name" />
      <div class="fighter-shadow"></div>
    </div>

    <!-- Suelo decorativo -->
    <div class="arena-floor"></div>
  </div>
</template>

<script>
export default {
  name: 'ArenaStage',
  props: {
    playerChar:     { type: Object,  required: true },
    enemyChar:      { type: Object,  required: true },
    playerAttacking:{ type: Boolean, default: false },
    playerHit:      { type: Boolean, default: false },
    playerKo:       { type: Boolean, default: false },
    enemyAttacking: { type: Boolean, default: false },
    enemyHit:       { type: Boolean, default: false },
    enemyKo:        { type: Boolean, default: false },
    damageNumbers:  { type: Array,   default: () => [] },
    battleMessage:  { type: String,  default: '' },
    messageType:    { type: String,  default: 'normal' },
    visible:        { type: Boolean, default: false },
  }
}
</script>

<style scoped>
.arena-stage {
  flex: 1; position: relative;
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 0 4% 3%; min-height: 50vh;
  opacity: 0; transition: opacity 0.6s ease 0.4s;
  background:
    radial-gradient(ellipse 70% 40% at 50% 100%, rgba(80,0,0,0.3) 0%, transparent 60%);
}
.arena-stage.visible { opacity: 1; }

/* Suelo */
.arena-floor {
  position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--blood), var(--gold-dim), var(--blood), transparent);
  filter: blur(1px);
}

/* Sprites */
.fighter-sprite {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
}

.fighter-sprite img {
  height: clamp(200px, 38vh, 420px);
  width: auto; object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));
  transition: filter 0.2s;
}

.fighter-sprite.player img {
  filter: drop-shadow(0 0 20px rgba(200,168,75,0.25));
}
.fighter-sprite.enemy img {
  transform: scaleX(-1);
  filter: drop-shadow(0 0 20px rgba(139,0,0,0.25));
}

.fighter-shadow {
  width: 70%; height: 12px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%);
  margin-top: -5px;
}

/* Ataque - jugador va hacia la derecha */
.fighter-sprite.player.attacking {
  animation: attackRight 0.3s ease-out;
}
@keyframes attackRight {
  0%   { transform: translateX(0); }
  40%  { transform: translateX(45px) scale(1.05); }
  100% { transform: translateX(0); }
}

/* Ataque - enemigo va hacia la izquierda */
.fighter-sprite.enemy.attacking {
  animation: attackLeft 0.3s ease-out;
}
@keyframes attackLeft {
  0%   { transform: translateX(0); }
  40%  { transform: translateX(-45px) scale(1.05); }
  100% { transform: translateX(0); }
}

/* Recibir golpe */
.fighter-sprite.player.hit { animation: hitShakePlayer 0.3s ease; }
@keyframes hitShakePlayer {
  0%,100% { transform: translateX(0); }
  20%{ transform: translateX(-14px); }
  40%{ transform: translateX(10px); }
  60%{ transform: translateX(-8px); }
  80%{ transform: translateX(6px); }
}

.fighter-sprite.enemy.hit { animation: hitShakeEnemy 0.3s ease; }
@keyframes hitShakeEnemy {
  0%,100% { transform: scaleX(-1) translateX(0); }
  20%{ transform: scaleX(-1) translateX(-14px); }
  40%{ transform: scaleX(-1) translateX(10px); }
  60%{ transform: scaleX(-1) translateX(-8px); }
  80%{ transform: scaleX(-1) translateX(6px); }
}

/* KO */
.fighter-sprite.ko img {
  animation: koFall 0.6s ease-out forwards;
  filter: drop-shadow(0 0 30px rgba(139,0,0,0.9)) grayscale(0.4) !important;
}
@keyframes koFall {
  to { transform: rotate(-85deg) translateY(20px); opacity: 0.3; }
}
.fighter-sprite.enemy.ko img {
  animation: koFallEnemy 0.6s ease-out forwards;
}
@keyframes koFallEnemy {
  to { transform: scaleX(-1) rotate(85deg) translateY(20px); opacity: 0.3; }
}

/* Números de daño */
.damage-numbers {
  position: absolute; inset: 0; pointer-events: none; z-index: 20;
}
.damage-number {
  position: absolute;
  font-family: var(--font-title);
  font-size: 1.8rem; font-weight: 900;
  pointer-events: none; user-select: none;
}
.damage-number.enemy-dmg {
  color: var(--blood-light);
  text-shadow: 0 0 15px rgba(192,57,43,0.9), 2px 2px 0 #000;
}
.damage-number.player-dmg {
  color: #fff;
  text-shadow: 0 0 15px rgba(255,255,255,0.6), 2px 2px 0 #000;
}

.dmg-pop-enter-active { animation: dmgFloat 0.9s ease-out forwards; }
.dmg-pop-leave-active { display: none; }
@keyframes dmgFloat {
  0%  { opacity: 1; transform: translateY(0)    scale(0.5); }
  30% { opacity: 1; transform: translateY(-30px) scale(1.2); }
  100%{ opacity: 0; transform: translateY(-80px) scale(0.8); }
}

/* Mensaje central */
.battle-message {
  position: absolute; top: 20%; left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-title);
  font-size: clamp(1.5rem, 5vw, 3rem);
  letter-spacing: 0.15em; text-transform: uppercase;
  pointer-events: none; z-index: 30;
  text-shadow: 2px 2px 0 #000;
  white-space: nowrap;
}
.battle-message.hit   { color: var(--blood-light); }
.battle-message.fight {
  color: var(--gold-bright);
  font-size: clamp(2rem, 7vw, 4.5rem);
  text-shadow: 0 0 30px rgba(240,208,96,0.8), 3px 3px 0 rgba(139,0,0,1);
}

.battle-msg-enter-active { animation: msgPop 0.8s ease-out; }
.battle-msg-leave-active { transition: opacity 0.2s; }
.battle-msg-leave-to     { opacity: 0; }
@keyframes msgPop {
  0%  { opacity: 0; transform: translateX(-50%) scale(1.8); }
  30% { opacity: 1; transform: translateX(-50%) scale(0.95); }
  85% { opacity: 1; transform: translateX(-50%) scale(1); }
  100%{ opacity: 0; transform: translateX(-50%) scale(1); }
}

@media (max-width: 768px) {
  .fighter-sprite img { height: clamp(150px, 28vh, 260px); }
}
</style>
