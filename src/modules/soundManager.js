import { ref } from 'vue'

// Estado reactivo del silencio global, sincronizado con localStorage
export const isMuted = ref(localStorage.getItem('game_muted') === 'true')

let audioCtx = null
let bgmInterval = null
let currentBgmType = null
let currentStep = 0

// Variables para el reproductor de YouTube
let ytPlayer = null
let ytReady = false
let ytLoading = false

// Notas para los loops de música (frecuencias en Hz)
const NOTE_E2 = 82.41
const NOTE_G2 = 98.00
const NOTE_A2 = 110.00
const NOTE_B2 = 123.47
const NOTE_Bb2 = 116.54
const NOTE_C3 = 130.81
const NOTE_D3 = 146.83
const NOTE_E3 = 164.81
const NOTE_F2 = 87.31
const NOTE_Fs2 = 92.50

// Melodía misteriosa/lenta para el menú (16 pasos) - Usada como fallback offline
const menuSequence = [
  NOTE_E2, null, NOTE_G2, null, NOTE_B2, null, NOTE_Bb2, null,
  NOTE_A2, null, NOTE_G2, null, NOTE_Fs2, null, NOTE_F2, null
]

// Melodía rápida de combate (16 pasos)
const battleSequence = [
  NOTE_A2, NOTE_A2, NOTE_C3, NOTE_A2, NOTE_D3, NOTE_A2, NOTE_C3, NOTE_G2,
  NOTE_A2, NOTE_A2, NOTE_C3, NOTE_A2, NOTE_E3, NOTE_D3, NOTE_C3, NOTE_G2
]

// Variables para el fade-in/fade-out
let fadeTimer = null

// Inicializar el reproductor de YouTube oculto
export function initYouTubePlayer() {
  console.log('[SoundManager] initYouTubePlayer llamado')
  if (ytPlayer || ytLoading) return
  ytLoading = true

  const createPlayer = () => {
    console.log('[SoundManager] Creando YT.Player instanciado')
    try {
      ytPlayer = new window.YT.Player('yt-menu-player', {
        height: '200',
        width: '200',
        videoId: 'htZ29c-k-L8',
        playerVars: {
          autoplay: 1, // Intentar reproducir automáticamente
          loop: 1,
          playlist: 'htZ29c-k-L8', // Requerido para repetir en bucle
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin // Evita bloqueos de origen en local
        },
        events: {
          onReady: (event) => {
            console.log('[SoundManager] YT Player listo (onReady)')
            ytReady = true
            updateYTPlayerState()
            // Si estamos en el menú, arrancar la reproducción inmediatamente
            if (currentBgmType === 'menu') {
              playYTMenu()
            }
          },
          onStateChange: (event) => {
            console.log('[SoundManager] YT Player cambió estado:', event.data)
            // Si el video termina o se detiene y seguimos en menú, reanudar
            if (event.data === window.YT.PlayerState.ENDED && currentBgmType === 'menu') {
              ytPlayer.playVideo()
            }
          }
        }
      })
    } catch (e) {
      console.error('[SoundManager] Error al instanciar el reproductor de YouTube:', e)
      ytLoading = false
    }
  }

  // Si la API de YouTube ya está cargada en el objeto global, instanciar directamente
  if (window.YT && window.YT.Player) {
    console.log('[SoundManager] API de YouTube ya disponible globalmente')
    createPlayer()
  } else {
    // Si no, definir la función callback global e inyectar el script de forma dinámica
    console.log('[SoundManager] Registrando onYouTubeIframeAPIReady e inyectando script')
    window.onYouTubeIframeAPIReady = createPlayer

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    if (firstScriptTag) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    } else {
      document.head.appendChild(tag)
    }
  }
}

function updateYTPlayerState() {
  if (!ytPlayer || !ytReady) return
  try {
    if (isMuted.value) {
      console.log('[SoundManager] Silenciando reproductor de YouTube')
      ytPlayer.mute()
    } else {
      console.log('[SoundManager] Activando sonido y volumen 35 en YouTube')
      ytPlayer.unMute()
      ytPlayer.setVolume(35)
    }
  } catch (e) {
    console.warn('[SoundManager] Error al actualizar volumen de YouTube:', e)
  }
}

export function fadeInYT(durationMs = 2000, targetVolume = 35) {
  if (!ytPlayer || !ytReady) return
  console.log('[SoundManager] fadeInYT iniciado')
  try {
    clearInterval(fadeTimer)
    if (isMuted.value) {
      ytPlayer.mute()
      return
    }
    ytPlayer.unMute()
    let currentVol = 0
    ytPlayer.setVolume(currentVol)
    ytPlayer.playVideo()
    
    // Detener la música de sintetizador fallback si estaba sonando para no superponerse
    if (bgmInterval) {
      console.log('[SoundManager] Deteniendo sintetizador fallback (Menú YT activo)')
      clearInterval(bgmInterval)
      bgmInterval = null
    }

    const steps = 20
    const stepVol = targetVolume / steps
    const stepTime = durationMs / steps

    fadeTimer = setInterval(() => {
      currentVol += stepVol
      if (currentVol >= targetVolume) {
        currentVol = targetVolume
        clearInterval(fadeTimer)
      }
      try {
        ytPlayer.setVolume(Math.round(currentVol))
      } catch (e) {
        clearInterval(fadeTimer)
      }
    }, stepTime)
  } catch (e) {
    console.warn('[SoundManager] Error en fadeInYT:', e)
  }
}

export function fadeOutYT(durationMs = 1000, onComplete) {
  if (!ytPlayer || !ytReady) {
    if (onComplete) onComplete()
    return
  }
  console.log('[SoundManager] fadeOutYT iniciado')
  try {
    clearInterval(fadeTimer)
    let currentVol = ytPlayer.getVolume()
    const steps = 15
    const stepVol = currentVol / steps
    const stepTime = durationMs / steps

    fadeTimer = setInterval(() => {
      currentVol -= stepVol
      if (currentVol <= 0) {
        currentVol = 0
        clearInterval(fadeTimer)
        try {
          ytPlayer.pauseVideo()
        } catch (e) {}
        if (onComplete) onComplete()
      }
      try {
        ytPlayer.setVolume(Math.round(currentVol))
      } catch (e) {
        clearInterval(fadeTimer)
        if (onComplete) onComplete()
      }
    }, stepTime)
  } catch (e) {
    console.warn('[SoundManager] Error en fadeOutYT:', e)
    if (onComplete) onComplete()
  }
}

function playYTMenu() {
  console.log('[SoundManager] playYTMenu intentando reproducir con fade-in 2s a volumen 35')
  if (!ytPlayer || !ytReady) return
  fadeInYT(2000, 35)
}

// Inicializar el contexto de Audio en respuesta a la primera interacción
export function initAudio() {
  if (audioCtx) return
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    // Cargar también el reproductor de YouTube al iniciar
    initYouTubePlayer()
  } catch (e) {
    console.error('Web Audio API no es soportada en este navegador:', e)
  }
}

// Alternar silencio
export function toggleMute() {
  isMuted.value = !isMuted.value
  localStorage.setItem('game_muted', String(isMuted.value))
  
  updateYTPlayerState()
  
  if (isMuted.value) {
    // Si se silencia, detener la música sintetizada
    stopBGM()
    if (ytPlayer && ytReady) {
      try {
        ytPlayer.mute()
      } catch (e) {}
    }
  } else {
    // Si se quita el silencio, reiniciar BGM si había una activa
    if (currentBgmType) {
      const type = currentBgmType
      currentBgmType = null // forzar reinicio
      startBGM(type)
    }
  }
}

// ── SINTETIZADORES DE EFECTOS DE SONIDO ────────────────────────────────────

export function playSound(type) {
  if (isMuted.value) return
  initAudio()
  if (!audioCtx) return

  // Asegurar que el contexto está activo
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  const now = audioCtx.currentTime

  switch (type) {
    case 'hover': {
      // Un tick rápido y agudo
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1000, now)
      
      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + 0.03)
      break
    }
    
    case 'click': {
      // Un click retro descendente
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1400, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06)
      
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + 0.06)
      break
    }
    
    case 'select': {
      // Campana doble ascendente
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(659.25, now) // E5
      osc.frequency.setValueAtTime(880.00, now + 0.07) // A5
      
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.setValueAtTime(0.08, now + 0.07)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + 0.22)
      break
    }

    case 'startFight': {
      // Sirena/impacto de arcade
      const osc1 = audioCtx.createOscillator()
      const osc2 = audioCtx.createOscillator()
      const filter = audioCtx.createBiquadFilter()
      const gain = audioCtx.createGain()
      
      osc1.type = 'sawtooth'
      osc1.frequency.setValueAtTime(320, now)
      osc1.frequency.linearRampToValueAtTime(90, now + 0.45)
      
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(160, now)
      osc2.frequency.linearRampToValueAtTime(45, now + 0.45)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(500, now)
      
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      
      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.45)
      osc2.stop(now + 0.45)
      break
    }

    case 'jump': {
      // Desplazamiento de frecuencia hacia arriba (salto clásico)
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(700, now + 0.16)
      
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + 0.16)
      break
    }

    case 'lightAttack': {
      // Swish de ruido de corta duración
      const noise = createNoiseBufferSource(0.09)
      if (!noise) return
      
      const filter = audioCtx.createBiquadFilter()
      const gain = audioCtx.createGain()
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1400, now)
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.09)
      filter.Q.setValueAtTime(3.0, now)
      
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
      
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(audioCtx.destination)
      
      noise.start(now)
      break
    }

    case 'heavyAttack': {
      // Swish de ruido pesado + rugido sawtooth
      const noise = createNoiseBufferSource(0.18)
      const osc = audioCtx.createOscillator()
      const filter = audioCtx.createBiquadFilter()
      const gain = audioCtx.createGain()
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.linearRampToValueAtTime(50, now + 0.18)
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(800, now)
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.18)
      
      gain.gain.setValueAtTime(0.16, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      
      if (noise) noise.connect(filter)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(audioCtx.destination)
      
      if (noise) noise.start(now)
      osc.start(now)
      osc.stop(now + 0.18)
      break
    }

    case 'specialAttack': {
      // Láser retro sobrenatural
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.type = 'square'
      osc.frequency.setValueAtTime(900, now)
      osc.frequency.linearRampToValueAtTime(150, now + 0.15)
      osc.frequency.linearRampToValueAtTime(600, now + 0.30)
      
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + 0.30)
      break
    }

    case 'hit': {
      // Impacto crujiente de explosión/golpe
      const noise = createNoiseBufferSource(0.20)
      const osc = audioCtx.createOscillator()
      const filter = audioCtx.createBiquadFilter()
      const gain = audioCtx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.linearRampToValueAtTime(30, now + 0.20)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(400, now)
      filter.frequency.exponentialRampToValueAtTime(70, now + 0.20)
      
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20)
      
      if (noise) noise.connect(filter)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(audioCtx.destination)
      
      if (noise) noise.start(now)
      osc.start(now)
      osc.stop(now + 0.20)
      break
    }

    case 'block': {
      // Ping metálico agudo
      const osc1 = audioCtx.createOscillator()
      const osc2 = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(1500, now)
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.05)
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(2300, now)
      
      gain.gain.setValueAtTime(0.10, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.05)
      osc2.stop(now + 0.05)
      break
    }

    case 'ko': {
      // Caída dramática de tono
      const osc = audioCtx.createOscillator()
      const filter = audioCtx.createBiquadFilter()
      const gain = audioCtx.createGain()
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.70)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(350, now)
      
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.70)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + 0.70)
      break
    }

    case 'victory': {
      // Fanfarria feliz (C5 -> E5 -> G5 -> C6)
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.type = 'square'
      
      const tempo = 0.09
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + tempo) // E5
      osc.frequency.setValueAtTime(783.99, now + tempo * 2) // G5
      osc.frequency.setValueAtTime(1046.50, now + tempo * 3) // C6
      
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.setValueAtTime(0.06, now + tempo)
      gain.gain.setValueAtTime(0.06, now + tempo * 2)
      gain.gain.setValueAtTime(0.06, now + tempo * 3)
      gain.gain.exponentialRampToValueAtTime(0.001, now + tempo * 7)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.start(now)
      osc.stop(now + tempo * 7)
      break
    }
  }
}

// ── SINTETIZADOR DE MÚSICA DE FONDO (BGM STEP SEQUENCER) ───────────────────

export function startBGM(type) {
  console.log('[SoundManager] startBGM llamado para:', type)
  if (isMuted.value) {
    console.log('[SoundManager] Juego silenciado. Saltando BGM.')
    currentBgmType = type
    return
  }
  
  initAudio()
  if (!audioCtx) {
    console.log('[SoundManager] AudioContext no disponible.')
    return
  }

  if (currentBgmType === type) {
    console.log('[SoundManager] BGM ya activa:', type)
    return
  }
  
  stopBGM()
  currentBgmType = type
  currentStep = 0

  if (audioCtx.state === 'suspended') {
    console.log('[SoundManager] Resumiendo AudioContext suspendido')
    audioCtx.resume()
  }

  // 1. Manejo del reproductor de YouTube para el Menú
  if (type === 'menu') {
    if (ytReady && ytPlayer) {
      console.log('[SoundManager] Reproduciendo BGM de YouTube para el menú (con fade-in)')
      playYTMenu()
      return // No iniciar sintetizador si está listo YouTube
    } else if (!ytLoading) {
      console.log('[SoundManager] YouTube no está listo, cargando API...')
      initYouTubePlayer() // Cargar si no está listo
    }
  } else {
    // Si no es el menú, detener YouTube con un fade-out de 1s
    if (ytPlayer && ytReady) {
      console.log('[SoundManager] Pausando reproductor de YouTube para combate (con fade-out 1s)')
      fadeOutYT(1000)
    }
  }

  console.log('[SoundManager] Iniciando sintetizador fallback 8-bits para:', type)

  // 2. Synthesized BGM (usado para Combate, o como Fallback en Menú)
  const bpm = type === 'battle' ? 132 : 95
  const stepDurationMs = (60 / bpm / 2) * 1000 // semicorcheas/octavas

  const seq = type === 'battle' ? battleSequence : menuSequence

  bgmInterval = setInterval(() => {
    if (isMuted.value || !audioCtx) return
    
    const note = seq[currentStep % seq.length]
    if (note !== null && note !== undefined) {
      playBassNote(note, type === 'battle' ? 'sawtooth' : 'triangle', stepDurationMs / 1000)
    }

    // Platillo de ruido retro en combate
    if (type === 'battle' && (currentStep % 4 === 2 || currentStep % 8 === 6)) {
      playRetroHiHat()
    }

    currentStep++
  }, stepDurationMs)
}

export function stopBGM() {
  console.log('[SoundManager] stopBGM llamado')
  clearInterval(fadeTimer)
  if (bgmInterval) {
    console.log('[SoundManager] Deteniendo sintetizador de fondo')
    clearInterval(bgmInterval)
    bgmInterval = null
  }
  if (ytPlayer && ytReady) {
    console.log('[SoundManager] Pausando reproductor de YouTube')
    try {
      ytPlayer.pauseVideo()
    } catch (e) {}
  }
}

// Tocar una nota de bajo retro
function playBassNote(freq, waveType, duration) {
  if (!audioCtx) return
  const now = audioCtx.currentTime
  
  const osc = audioCtx.createOscillator()
  const filter = audioCtx.createBiquadFilter()
  const gain = audioCtx.createGain()
  
  osc.type = waveType
  osc.frequency.setValueAtTime(freq, now)
  
  // Si es combate, hacerlo un poco más crujiente, si es menú, muy suave
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(waveType === 'sawtooth' ? 240 : 160, now)
  
  // Corta duración del paso para no superponer
  const noteLength = duration * 0.82
  
  gain.gain.setValueAtTime(waveType === 'sawtooth' ? 0.05 : 0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + noteLength)
  
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(audioCtx.destination)
  
  osc.start(now)
  osc.stop(now + noteLength)
}

// Hihat de platillo retro con ruido
function playRetroHiHat() {
  if (!audioCtx) return
  const now = audioCtx.currentTime
  
  const noise = createNoiseBufferSource(0.03)
  if (!noise) return
  
  const filter = audioCtx.createBiquadFilter()
  const gain = audioCtx.createGain()
  
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(7000, now)
  
  gain.gain.setValueAtTime(0.02, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
  
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audioCtx.destination)
  
  noise.start(now)
}

// ── UTILIDADES AUXILIARES ──────────────────────────────────────────────────

// Generar búfer de ruido blanco sobre la marcha
function createNoiseBufferSource(duration) {
  if (!audioCtx) return null
  try {
    const bufferSize = audioCtx.sampleRate * duration
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    return source
  } catch (e) {
    return null
  }
}
