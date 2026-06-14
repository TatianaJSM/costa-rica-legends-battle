<template>
  <div class="cinematic-intro">
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
  </div>
</template>

<script>
export default {
  name: 'CinematicIntro',
  props: {
    player: { type: Object, default: null },
    enemy: { type: Object, default: null },
    phase: { type: Number, default: 1 },
    selectedStage: { type: Object, default: null }
  },
  setup() {
    function getCharacterSprite(character, state = 'idle') {
      const sprite = character?.sprites?.[state]
      if (Array.isArray(sprite)) return sprite[0] || character?.image || ''
      return sprite || character?.image || ''
    }

    return { getCharacterSprite }
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
