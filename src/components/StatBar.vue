<template>
  <div class="stat-row">
    <div class="stat-lbl">
      <span>{{ label }}</span>
      <span>{{ value }}/{{ max }}</span>
    </div>
    <div class="stat-bar">
      <div
        class="stat-fill"
        :class="{ accent }"
        :style="{ width: (value / max * 100) + '%' }"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatBar',
  props: {
    label:  { type: String,  required: true },
    value:  { type: Number,  required: true },
    max:    { type: Number,  default: 5 },
    accent: { type: Boolean, default: false },
  }
}
</script>

<style scoped>
.stat-row { margin: 0.35rem 0; }

.stat-lbl {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-bar {
  height: 5px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(200,168,75,0.12);
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold-bright));
  transition: width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}

.stat-fill::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 3px; height: 100%;
  background: rgba(255,255,255,0.7);
  filter: blur(1px);
}

.stat-fill.accent {
  background: linear-gradient(90deg, #003040, #00d4ff);
}
</style>
