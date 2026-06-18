# Referencias de Aprendizaje y Recursos Multimedia
*Curso IF7102 - Multimedios | I Ciclo 2026 | Universidad de Costa Rica (UCR)*

Este archivo documenta las fuentes de información, tutoriales, documentación oficial, licencias de recursos multimedia y herramientas de Inteligencia Artificial empleadas en el desarrollo del proyecto.

---

## 1. Documentación Oficial Consultada
1. **Vue.js 3 - Documentación Oficial:**
   * **URL:** [https://vuejs.org/](https://vuejs.org/)
   * **Secciones específicas:** Composition API, Single File Components (SFC), Props, Custom Events, Life Cycle Hooks (`onMounted`, `onUnmounted`), `ref`, `computed`, y directivas reactivas (`v-if`, `v-show`, `v-for`).
2. **Vite - Guía de Configuración:**
   * **URL:** [https://vitejs.dev/](https://vitejs.dev/)
   * **Secciones específicas:** Asset resolution, Hot Module Replacement (HMR) y empaquetado de producción.
3. **MDN Web Docs - Web Audio API:**
   * **URL:** [https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
   * **Secciones específicas:** `AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`, `AudioBufferSourceNode`, decaimiento exponencial del volumen (`exponentialRampToValueAtTime`) e inicialización por interacción del usuario para evitar bloqueos del navegador.
4. **YouTube IFrame Player API - Referencia de Desarrolladores:**
   * **URL:** [https://developers.google.com/youtube/iframe_api_reference](https://developers.google.com/youtube/iframe_api_reference)
   * **Secciones específicas:** Instanciación dinámica mediante `YT.Player`, eventos de estado (`onReady`, `onStateChange`), controles de volumen (`setVolume`, `mute`, `unMute`), y parámetros de reproducción en bucle (`loop`, `playlist`).

---

## 2. Tutoriales y Cursos de Apoyo
1. **Título:** *Learn Vue 3 - Full Course for Beginners*
   * **URL:** [https://www.youtube.com/watch?v=FXpIoQ_rT_c](https://www.youtube.com/watch?v=FXpIoQ_rT_c)
   * **Descripción:** Guía para entender la transición entre Options API y la moderna Composition API.
2. **Título:** *Web Audio API Synth - Let's Build a Synthesizer in Javascript*
   * **URL:** [https://www.youtube.com/watch?v=laCjGi3C4Us](https://www.youtube.com/watch?v=laCjGi3C4Us)
   * **Descripción:** Explicación básica de cómo conectar osciladores y ganancias para simular efectos de sonido de consolas de 8 y 16 bits de forma procedural.

---

## 3. Recursos Multimedia y Licencias

### A. Gráficos y Hojas de Sprites
1. **Hojas de Sprites de Combate de Leyendas (La Segua, El Cadejos y El Padre sin Cabeza):**
   * **Origen:** Recursos de uso educativo provistos por la cátedra del curso *IF7102 - Multimedios*, UCR Recinto de Liberia.
   * **Licencia:** Uso académico exclusivo (Fair Use académico).
   * **Procesamiento:** Extracción manual y por scripts para remover el fondo blanco/gris, centrado de pies en la arena, y generación de JSON de compensación de movimiento (`cadejosMetadata.json` y `padreMetadata.json`).
2. **Escenarios de Combate (Casona de Santa Rosa, Mercado Central de San José y Cafetal Nocturno):**
   * **Origen:** Fondos en arte de píxeles (Pixel Art) diseñados específicamente para el juego.
   * **Licencia:** Licencia libre para uso académico e individual.
   * **Formatos:** PNG de resolución fija y sin suavizados de interpolación (`image-rendering: pixelated`).

### B. Fuentes Tipográficas
1. **Fuente "Press Start 2P":**
   * **Diseñador:** CodeMan38.
   * **URL:** [Google Fonts - Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
   * **Licencia:** SIL Open Font License, Version 1.1 (Licencia libre de código abierto).

### C. Audio y Música
1. **Efectos de Sonido (SFX) y Música de Combate (8-bits):**
   * **Origen:** Sintetizados mediante código en tiempo real en [soundManager.js](file:///C:/Users/Lenovo/Desktop/costa-rica-legends-battle-vue/src/modules/soundManager.js) usando Web Audio API.
   * **Licencia:** Producción propia del estudiante (libre de derechos).
2. **Canción de Menú: "Hoist The Colours" (Bobby Bass, Ebucs, Eric Hollaway):**
   * **Origen:** Video de YouTube con ID `htZ29c-k-L8`.
   * **Licencia:** Uso temporal de referencia con fines demostrativos y académicos sin fines de lucro.

---

## 4. Uso de Herramientas de Inteligencia Artificial (IA)
En conformidad con los lineamientos del curso (sección 6, página 6-7), se declara el uso ético y de apoyo de herramientas de Inteligencia Artificial:
* **Herramienta Empleada:** **Antigravity (Google DeepMind)**.
* **Uso Realizado:**
  - Copiloto de programación para resolver problemas de desfases de coordenadas al animar las patas de El Cadejos.
  - Optimización matemática de curvas de decaimiento en osciladores de Web Audio para evitar clics de interferencia acústica.
  - Depuración de llamadas asíncronas de la API de YouTube y control de la carga del IFrame para evitar bloqueos del navegador en entornos de desarrollo local.
  - Estructuración de componentes y refactorización para acoplar `ResultScreen.vue` en el loop principal de Vue 3.
