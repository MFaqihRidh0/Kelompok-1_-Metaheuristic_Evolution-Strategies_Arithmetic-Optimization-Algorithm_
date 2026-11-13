// ============================================================================
// AOA CLOUD BATTLE ARENA — PROCEDURAL CLOUD OPS AUDIO & HOWLER SYNTH ENGINE
// Menyediakan BGM Ambient Adventure (gaya Kounine) & Efek Suara Jurus Api/Listrik
// ============================================================================

const CloudAudio = (() => {
  let ctx = null;
  let isMuted = false;
  let bgmInterval = null;
  let bgmStep = 0;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, type, duration, gainVal = 0.12, slideFreq = null) {
    if (isMuted) return;
    ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideFreq), now + duration);
    }

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playNoiseBurst(duration, filterFreq = 800, filterType = 'lowpass', gainVal = 0.22) {
    if (isMuted) return;
    ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  // 1. Efek Suara Jurus Api (Pyro Multiplication Blast)
  function playFireSkill() {
    playNoiseBurst(0.42, 650, 'bandpass', 0.32);
    playTone(180, 'sawtooth', 0.35, 0.15, 55);
    setTimeout(() => {
      playNoiseBurst(0.38, 420, 'lowpass', 0.36);
      playTone(110, 'triangle', 0.32, 0.2, 40);
    }, 140);
  }

  // 2. Efek Suara Jurus Listrik (Thunder Division Strike)
  function playLightningSkill() {
    playNoiseBurst(0.25, 2400, 'highpass', 0.28);
    playTone(920, 'sawtooth', 0.14, 0.14, 240);
    setTimeout(() => {
      playTone(1350, 'square', 0.16, 0.12, 180);
      playNoiseBurst(0.32, 1400, 'bandpass', 0.3);
    }, 70);
  }

  // 3. Efek Suara Ultimate Elemental Overload
  function playUltimateSkill() {
    playFireSkill();
    setTimeout(playLightningSkill, 90);
    setTimeout(() => {
      playTone(220, 'sawtooth', 0.5, 0.18, 55);
    }, 180);
  }

  // 4. Efek Suara Musuh Kalah & Membuka Slide Presentasi
  function playVictoryUnlock() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
    notes.forEach((n, idx) => {
      setTimeout(() => {
        playTone(n, 'triangle', 0.35, 0.14);
      }, idx * 85);
    });
  }

  // 5. Efek Suara Re-open Slide dari Mayat Musuh [O]
  function playReopenSlide() {
    playTone(587.33, 'sine', 0.16, 0.12, 880);
    setTimeout(() => playTone(880, 'triangle', 0.22, 0.12), 90);
  }

  // 6. Efek Klik UI
  function playClick() {
    playTone(660, 'sine', 0.08, 0.08, 880);
  }

  // 7. Musik Latar (Warm Chiptune/Ambient Synth ala Kounine)
  function startBGM() {
    ensureContext();
    if (bgmInterval) return;
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const pattern = [0, 2, 4, 5, 4, 2, 3, 1, 0, 4, 7, 5, 4, 2, 1, 2];

    bgmInterval = setInterval(() => {
      if (isMuted || !ctx) return;
      const noteIdx = pattern[bgmStep % pattern.length];
      const freq = scale[noteIdx];
      playTone(freq * 0.5, 'sine', 0.42, 0.032);
      if (bgmStep % 4 === 0) {
        playTone(freq * 0.25, 'triangle', 0.75, 0.038);
      }
      bgmStep++;
    }, 460);
  }

  function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('btnAudioToggle');
    if (btn) btn.innerText = isMuted ? '🔇' : '🔊';
    return isMuted;
  }

  return {
    startBGM,
    playFireSkill,
    playLightningSkill,
    playUltimateSkill,
    playVictoryUnlock,
    playReopenSlide,
    playClick,
    toggleMute
  };
})();
