import { ref } from 'vue'

const seguaIntroUrl = new URL('../assets/videos/segua_intro.mp4', import.meta.url).href
const cadejosIntroUrl = new URL('../assets/videos/cadejos_intro.mp4', import.meta.url).href
const padreIntroUrl = new URL('../assets/videos/padre_intro.mp4', import.meta.url).href

export const videoMap = {
  segua: seguaIntroUrl,
  cadejos: cadejosIntroUrl,
  padre: padreIntroUrl
}

// Guarda las URLs de tipo Blob (en memoria RAM) de los videos
export const preloadedVideos = ref({
  segua: null,
  cadejos: null,
  padre: null
})

// Descarga los videos en segundo plano al iniciar la app
export function preloadAllVideos() {
  Object.keys(videoMap).forEach(key => {
    if (preloadedVideos.value[key]) return // Ya está precargado

    fetch(videoMap[key])
      .then(res => {
        if (!res.ok) throw new Error("Fallo en la descarga de video")
        return res.blob()
      })
      .then(blob => {
        // Convierte el archivo binario descargado a una URL local Blob (directa de la RAM)
        preloadedVideos.value[key] = URL.createObjectURL(blob)
      })
      .catch(err => {
        console.warn(`No se pudo precargar en caché el video de ${key}:`, err)
        // Si falla (por ejemplo, sin conexión), usamos la URL de red como respaldo
        preloadedVideos.value[key] = videoMap[key]
      })
  })
}
