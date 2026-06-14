const seguaBase = new URL('../assets/images/characters/segua.png', import.meta.url).href

export const seguaAnimations = {
  // Mientras no tengas frames idle, usamos la imagen normal de La Segua
  idle: [
    seguaBase
  ],

  // Mientras no tengas frames walk, usamos la imagen normal
  walk: [
    seguaBase
  ],

  // Usamos la imagen normal para el salto (sin frames raros)
  jump: [
    seguaBase
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