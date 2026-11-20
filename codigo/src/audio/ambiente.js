// Sonido ambiental generado con Web Audio: lluvia continua + truenos.
// No necesita archivos de audio.

let ctx = null
let master = null
let lluviaGain = null

function ruido(ctx, segundos, tipo = 'marron') {
  const len = Math.floor(ctx.sampleRate * segundos)
  const buffer = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c)
    let ultimo = 0
    for (let i = 0; i < len; i++) {
      const blanco = Math.random() * 2 - 1
      if (tipo === 'marron') {
        ultimo = (ultimo + 0.02 * blanco) / 1.02
        data[i] = ultimo * 3.5
      } else {
        data[i] = blanco
      }
    }
  }
  return buffer
}

export function iniciarAudio() {
  if (ctx) {
    ctx.resume()
    return
  }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // Lluvia: ruido blanco filtrado (siseo) + ruido marrón (cuerpo)
  lluviaGain = ctx.createGain()
  lluviaGain.gain.value = 0.55
  lluviaGain.connect(master)

  const siseo = ctx.createBufferSource()
  siseo.buffer = ruido(ctx, 4, 'blanco')
  siseo.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2600
  bp.Q.value = 0.6
  const gSiseo = ctx.createGain()
  gSiseo.gain.value = 0.09
  siseo.connect(bp).connect(gSiseo).connect(lluviaGain)
  siseo.start()

  const cuerpo = ctx.createBufferSource()
  cuerpo.buffer = ruido(ctx, 5, 'marron')
  cuerpo.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  const gCuerpo = ctx.createGain()
  gCuerpo.gain.value = 0.35
  cuerpo.connect(lp).connect(gCuerpo).connect(lluviaGain)
  cuerpo.start()
}

export function setSonido(activo) {
  if (!ctx || !master) return
  const t = ctx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setTargetAtTime(activo ? 0.8 : 0, t, 0.6)
}

// intensidad 0..1 — retraso en segundos (la luz llega antes que el sonido)
export function trueno(intensidad = 1, retraso = 1) {
  if (!ctx || !master || ctx.state !== 'running') return
  const t = ctx.currentTime + retraso
  const dur = 3.5 + intensidad * 3

  const src = ctx.createBufferSource()
  src.buffer = ruido(ctx, dur, 'marron')
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(380 + intensidad * 400, t)
  lp.frequency.exponentialRampToValueAtTime(70, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.9 * intensidad + 0.2, t + 0.08)
  // retumbos
  g.gain.setTargetAtTime(0.35 * intensidad, t + 0.3, 0.4)
  g.gain.setValueAtTime(0.35 * intensidad, t + 1.0)
  g.gain.linearRampToValueAtTime(0.55 * intensidad, t + 1.25)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  src.connect(lp).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.1)
}
