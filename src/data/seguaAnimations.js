const seguaBase = new URL('../assets/images/characters/segua.png', import.meta.url).href

export const seguaAnimations = {
  // Mientras no tengas frames idle, usamos la imagen normal de La Segua
  idle: [
    seguaBase
  ],

  walk: [
    new URL('../assets/images/characters/segua/walk/walk_01.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/walk/walk_02.png', import.meta.url).href
  ],

  // Estos sí son tus frames de salto (5 frames)
  jump: [
    new URL('../assets/images/characters/segua/jump/jump_01.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_02.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_03.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_04.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_05.png', import.meta.url).href
  ],

  // Tanto attack como acid usan los 6 frames para el ataque de ácido
  attack: [
    new URL('../assets/images/characters/segua/attack/atack_01.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_02.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_03.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_04.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_05.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_06.png', import.meta.url).href
  ],

  acid: [
    new URL('../assets/images/characters/segua/attack/atack_01.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_02.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_03.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_04.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_05.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_06.png', import.meta.url).href
  ]
}