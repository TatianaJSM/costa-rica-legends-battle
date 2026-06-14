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

  // Estos sí son tus frames de salto (5 frames)
  jump: [
    new URL('../assets/images/characters/segua/jump/jump_01.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_02.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_03.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_04.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/jump/jump_05.png', import.meta.url).href
  ],

  // Tus frames de ataque (6 frames)
  attack: [
    new URL('../assets/images/characters/segua/attack/atack_01.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_02.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_03.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_04.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_05.png', import.meta.url).href,
    new URL('../assets/images/characters/segua/attack/atack_06.png', import.meta.url).href
  ],

  // Mientras no tengas frames de ácido, usamos la imagen normal
  acid: [
    seguaBase
  ]
}