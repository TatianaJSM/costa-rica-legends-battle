# Costa Rica Legends Battle ⚔️🇨🇷
**Proyecto Personal de Desarrollo Web Multimedia**
*Curso IF7102 - Multimedios | I Ciclo 2026 | Universidad de Costa Rica (UCR)*

Un videojuego de lucha y combates en estética retro de 16-bits inspirado en los seres y leyendas de la mitología tradicional de Costa Rica: **La Segua**, **El Cadejos** y **El Padre sin Cabeza**.

---

## 🚀 Declaración de Elección de Framework
En cumplimiento con los requisitos de la Fase 12 del proyecto de investigación personal, se declara la elección oficial del framework:
* **Framework Utilizado:** **Vue 3** (construido sobre Vite)
* **API del Framework:** **Composition API** (con SFCs `<script>` de Vue)

---

## 🎨 Características Multimedia e Integración

El juego implementa la **Opción 5: Juego Educativo de Un Nivel / Batalla de Leyendas** con los siguientes componentes de integración de medios:

1. **Pantallas y Estructura en Componentes:**
   * **Start Screen (`StartScreen.vue`):** Pantalla de inicio animada con efectos de rayos y truenos procedimentales sobre canvas, menús de navegación y un modal interactivo para consultar la historia y lore de cada leyenda.
   * **Selection Screen (`SelectScreen.vue`):** Interfaz para elegir el luchador (P1) y previsualizar al rival controlado por inteligencia artificial (CPU), con estadísticas de habilidades dinámicas.
   * **Battle Arena Screen (`BattleScreen.vue`):** La arena principal donde ocurre el combate, gestionando el loop de física del juego, colisión, posicionamiento y estados.
   * **Result Screen (`ResultScreen.vue`):** Pantalla dedicada que aparece al finalizar la batalla. Muestra estadísticas detalladas del combate (daño infligido, tiempo empleado, rondas totales) y renderiza partículas de confetti dinámicas sobre canvas para celebrar victorias.

2. **Extracción y Optimización de Hojas de Sprites (Spritesheets):**
   * Se procesó y limpió la hoja de sprites oficial en fondo blanco de **El Cadejos** (`media__1781750210599.jpg`), removiendo de forma automatizada mediante scripts todos los colores del fondo para lograr transparencia total de píxeles (incluyendo "pockets" o huecos encerrados entre el pelaje y las patas), sin comprometer los efectos de fuego azul o los ojos rojos de la bestia.
   * Los pies de cada frame se alinearon con precisión matemática al suelo utilizando metadatos de recortes (`cadejosMetadata.json` y `padreMetadata.json`) para evitar efectos de flotación o sacudidas durante el renderizado.

3. **Sistema de Audio y Música Web Audio API:**
   * **Efectos de Sonido (SFX):** Sintetizados proceduralmente en tiempo real a través de osciladores nativos del navegador (sine, triangle, square y sawtooth) y filtros de paso de banda/paso de bajo. Incluye sonidos de clicks, hovers, saltos, zarpazos ligeros, golpes fuertes, explosiones de impacto, bloqueos metálicos, sonidos de caída (KO) y fanfarria de victoria.
   * **Música de Menú (YouTube BGM):** Integra la canción temática **"Hoist The Colours"** (ID: `htZ29c-k-L8`) mediante la API oficial de IFrame de YouTube de forma invisible. Cuenta con un fundido de entrada (fade-in) automático de 2 segundos al entrar a los menús, y un fundido de salida (fade-out) de 1 segundo al iniciar el combate.
   * **Música de Combate:** Un tema rockero de 8-bits sintetizado por pasos a 132 BPM que se reproduce de forma cíclica e incorpora platillos retro de ruido blanco.
   * **Botón de Mute Global:** Un botón flotante en la parte superior derecha (`🔊` / `🔇`) sincroniza y apaga de inmediato tanto las pistas sintetizadas como el reproductor de YouTube.

---

## 🕹️ Controles de Jugabilidad

* **Movimiento:** Teclas `A` / `D` (o flechas izquierda/derecha) para desplazarse lateralmente.
* **Salto:** Teclas `W` o `Espacio` para saltar y evadir ataques enemigos o proyectiles.
* **Bloqueo:** Mantener presionada la tecla `S` para mitigar el 50% del daño recibido.
* **Ataque Rápido:** Tecla `J` (Zarpazo / Mordida rápida).
* **Ataque Fuerte:** Tecla `L` (Grito espectral / Zarpazo de fuego).
* **Ataque Especial:** Tecla `Q` o `K` (Dispara un proyectil espectral - Calavera o Lobo de sombras). *Cuenta con 5 segundos de cooldown*.
* **Vino de Coyol:** Recoge las botellas que caen del cielo para recuperar 15% de salud.

---

## 🛠️ Instrucciones de Ejecución

Para levantar y probar la aplicación en tu entorno local, asegúrate de tener instalado [Node.js](https://nodejs.org/).

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre la dirección que te proporcione la consola (usualmente `http://localhost:5173`) en tu navegador web.

3. **Compilar para producción:**
   ```bash
   npm run build
   ```
