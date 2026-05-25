<template>
  <transition name="item-pop">
    <div v-if="visible" class="item-pickup" :class="item.rarity">
      <div class="corner-tl"></div><div class="corner-tr"></div>
      <div class="corner-bl"></div><div class="corner-br"></div>

      <div class="item-icon">{{ item.icon }}</div>
      <div class="item-info">
        <div class="item-name">{{ item.name }}</div>
        <div class="item-desc">{{ item.description }}</div>
      </div>
      <div class="item-badge" :class="item.rarity">{{ item.rarity }}</div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ItemPickup',
  props: {
    visible: { type: Boolean, default: false },
    item: {
      type: Object,
      default: () => ({
        icon: '⚗️',
        name: 'Poción de Vida',
        description: '+20% HP restaurado',
        rarity: 'comun',
      })
    }
  }
}
</script>

<style scoped>
.item-pickup {
  position: fixed;
  bottom: 7rem; right: 2rem;
  display: flex; align-items: center; gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  background: var(--bg-card-2);
  border: 1px solid rgba(200,168,75,0.3);
  z-index: 60; max-width: 280px;
  position: relative;
}

/* Esquinas */
.corner-tl, .corner-tr, .corner-bl, .corner-br {
  position: absolute;
  width: 10px; height: 10px;
  border-color: var(--gold); border-style: solid;
}
.corner-tl { top:-1px; left:-1px;   border-width: 2px 0 0 2px; }
.corner-tr { top:-1px; right:-1px;  border-width: 2px 2px 0 0; }
.corner-bl { bottom:-1px; left:-1px;  border-width: 0 0 2px 2px; }
.corner-br { bottom:-1px; right:-1px; border-width: 0 2px 2px 0; }

/* Rareza */
.item-pickup.comun    { border-color: rgba(200,168,75,0.3); }
.item-pickup.raro     { border-color: rgba(0,120,200,0.5);  background: rgba(0,20,40,0.9); }
.item-pickup.epico    { border-color: rgba(140,0,200,0.5);  background: rgba(20,0,30,0.9); }
.item-pickup.legendario{ border-color: rgba(200,168,75,0.8); background: rgba(20,12,0,0.95); box-shadow: 0 0 30px rgba(200,168,75,0.3); }

.item-icon { font-size: 1.8rem; flex-shrink: 0; }

.item-info { flex: 1; }
.item-name {
  font-family: var(--font-display);
  font-size: 0.82rem; font-weight: 700;
  color: var(--gold-bright); letter-spacing: 0.06em;
  margin-bottom: 0.15rem;
}
.item-desc {
  font-family: var(--font-display);
  font-size: 0.68rem; color: var(--text-muted);
  letter-spacing: 0.05em;
}

.item-badge {
  font-family: var(--font-display);
  font-size: 0.55rem; letter-spacing: 0.15em;
  text-transform: uppercase; padding: 0.2rem 0.5rem;
  border: 1px solid; white-space: nowrap;
}
.item-badge.comun      { color: var(--gold-dim);   border-color: var(--gold-dim); }
.item-badge.raro       { color: #5ab4ff;            border-color: #1a5080; }
.item-badge.epico      { color: #c060ff;            border-color: #6020a0; }
.item-badge.legendario { color: var(--gold-bright); border-color: var(--gold); }

/* Animación */
.item-pop-enter-active { animation: itemSlideIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
.item-pop-leave-active { animation: itemSlideOut 0.3s ease-in forwards; }
@keyframes itemSlideIn {
  from { opacity: 0; transform: translateX(80px) scale(0.8); }
  to   { opacity: 1; transform: translateX(0)    scale(1); }
}
@keyframes itemSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(80px); }
}
</style>
