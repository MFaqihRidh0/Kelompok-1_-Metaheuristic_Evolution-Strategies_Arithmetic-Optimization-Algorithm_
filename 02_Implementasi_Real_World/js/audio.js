// ============================================================================
// AOA CLOUD BATTLE ARENA — FULL WEB AUDIO & HOWLER SYNTHESIS ENGINE
// 1. Suara Game Jernih & Terdengar Jelas di Speaker Laptop (Master Compressor + Lead Melody + SFX)
// 2. Otomatis Berhenti (Pause) Saat Jendela Slide Presentasi Dibuka,
//    dan Otomatis Menyala Kembali Saat Kembali ke Arena Pertarungan 3D!
// ============================================================================

const CloudAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let bgmGain = null;

  let isMuted = false;
  let isPausedForSlide = false;
  let bgmInterval = null;
  let bgmStep = 0;
  let lastFootstepTime = 0;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, ctx.currentTime);
        compressor.knee.setValueAtTime(12, ctx.currentTime);
        compressor.ratio.setValueAtTime(4, ctx.currentTime);
        compressor.attack.setValueAtTime(0.005, ctx.currentTime);
        compressor.release.setValueAtTime(0.15, ctx.currentTime);

        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.95, ctx.currentTime);

        bgmGain = ctx.createGain();
        bgmGain.gain.setValueAtTime(0.65, ctx.currentTime);

        bgmGain.connect(compressor);
        masterGain.connect(compressor);
        compressor.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
      window.Howler.ctx.resume().catch(() => {});
    }
  }

  // Unlock AudioContext secara otomatis pada interaksi pertama di halaman
  ['pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(evtName => {
    window.addEventListener(evtName, () => {
      ensureContext();
    }, { passive: true });
  });

  function playTone(freq, type, duration, gainVal = 0.25, slideFreq = null, useBgmBus = false) {
    if (isMuted) return;
    if (useBgmBus && isPausedForSlide) return;
    ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideFreq), now + duration);
    }

    // Attack cepat + decay halus agar terdengar jelas & tidak klik di speaker laptop
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(useBgmBus ? bgmGain : masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playNoiseBurst(duration, filterFreq = 1000, filterType = 'lowpass', gainVal = 0.38) {
    if (isMuted || isPausedForSlide) return;
    ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.42));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);
  }

  // 1. Efek Suara Langkah Kaki di Jalan Batu (Footsteps)
  function playFootstep() {
    if (isMuted || isPausedForSlide) return;
    const nowMs = performance.now();
    if (nowMs - lastFootstepTime < 260) return;
    lastFootstepTime = nowMs;

    playNoiseBurst(0.055, 520 + Math.random() * 180, 'bandpass', 0.16);
    playTone(135 + Math.random() * 25, 'triangle', 0.06, 0.12, 75);
  }

  // 2. 🔥 Efek Suara Jurus Api (Solar Fireball Launch & Explosion)
  function playFireSkill() {
    if (isMuted || isPausedForSlide) return;
    ensureContext();
    // Suara semburan api meluncur
    playNoiseBurst(0.45, 780, 'bandpass', 0.52);
    playTone(320, 'sawtooth', 0.35, 0.28, 85);
    playTone(480, 'triangle', 0.25, 0.24, 120);

    // Suara ledakan bola api saat menghantam musuh
    setTimeout(() => {
      if (isMuted || isPausedForSlide) return;
      playNoiseBurst(0.48, 380, 'lowpass', 0.62);
      playTone(160, 'sawtooth', 0.38, 0.35, 42);
      playTone(240, 'triangle', 0.30, 0.28, 60);
    }, 150);
  }

  // 3. ⚡ Efek Suara Jurus Listrik (5-Orb Raijin Thunder Strike)
  function playLightningSkill() {
    if (isMuted || isPausedForSlide) return;
    ensureContext();
    // Sengatan listrik frekuensi tinggi & menengah
    playNoiseBurst(0.28, 2200, 'highpass', 0.48);
    playTone(1250, 'sawtooth', 0.14, 0.28, 280);
    playTone(880, 'square', 0.16, 0.24, 190);

    setTimeout(() => {
      if (isMuted || isPausedForSlide) return;
      playTone(1560, 'sawtooth', 0.18, 0.28, 210);
      playTone(620, 'triangle', 0.26, 0.32, 95);
      playNoiseBurst(0.36, 1200, 'bandpass', 0.52);
    }, 65);
  }

  // 4. 💥 Efek Suara Ultimate Elemental Overload
  function playUltimateSkill() {
    if (isMuted || isPausedForSlide) return;
    playFireSkill();
    setTimeout(() => {
      if (!isPausedForSlide) playLightningSkill();
    }, 85);
    setTimeout(() => {
      if (!isPausedForSlide) {
        playTone(440, 'sawtooth', 0.48, 0.32, 90);
        playTone(660, 'triangle', 0.45, 0.28, 130);
      }
    }, 170);
  }

  // 5. 🏆 Efek Suara Musuh Kalah (Fanfare singkat sebelum Slide terbuka)
  function playVictoryUnlock() {
    if (isMuted) return;
    ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
    notes.forEach((n, idx) => {
      setTimeout(() => {
        if (isMuted) return;
        playTone(n, 'triangle', 0.28, 0.28);
        playTone(n * 1.5, 'sine', 0.24, 0.14);
      }, idx * 70);
    });
  }

  // 6. Efek Suara Buka Slide [O]
  function playReopenSlide() {
    if (isMuted) return;
    playTone(587.33, 'triangle', 0.14, 0.22, 880);
  }

  // 7. Efek Klik UI
  function playClick() {
    if (isMuted) return;
    playTone(720, 'triangle', 0.07, 0.18, 960);
  }

  // 8. Musik Latar Game (Adventure Synth Melody + Bass + Chords yang Jelas Terdengar)
  function startBGM() {
    ensureContext();
    isPausedForSlide = false;
    if (bgmGain && ctx) {
      bgmGain.gain.cancelScheduledValues(ctx.currentTime);
      bgmGain.gain.setValueAtTime(0.68, ctx.currentTime);
    }

    if (bgmInterval) return;

    // Tangga nada A Minor / C Major Heroic Adventure (Frekuensi 330Hz - 880Hz agar jelas di speaker laptop!)
    const melodyNotes = [
      440.00, 523.25, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25,
      440.00, 523.25, 659.25, 880.00, 783.99, 659.25, 587.33, 523.25
    ];
    const bassNotes = [
      220.00, 220.00, 174.61, 174.61, 130.81, 130.81, 196.00, 196.00,
      220.00, 220.00, 174.61, 174.61, 146.83, 146.83, 164.81, 196.00
    ];

    const playBgmTick = () => {
      if (isMuted || isPausedForSlide || !ctx) return;
      ensureContext();

      const idx = bgmStep % melodyNotes.length;
      const melFreq = melodyNotes[idx];
      const bassFreq = bassNotes[idx];

      // Lead Melody (Triangle + Harmonik Oktaf Atas agar jernih di speaker laptop)
      playTone(melFreq, 'triangle', 0.28, 0.22, null, true);
      playTone(melFreq * 2, 'sine', 0.20, 0.08, null, true);

      // Bass & Chord pada ketukan genap
      if (bgmStep % 2 === 0) {
        playTone(bassFreq, 'sawtooth', 0.36, 0.14, null, true);
        playTone(bassFreq * 1.5, 'triangle', 0.34, 0.12, null, true);
      }

      // Ketukan perkusi ritmis ringan
      if (bgmStep % 4 === 0) {
        playTone(110, 'triangle', 0.12, 0.20, 48, true);
      } else if (bgmStep % 2 === 1) {
        playNoiseBurst(0.035, 3200, 'highpass', 0.09);
      }

      bgmStep++;
    };

    // Mainkan nada pertama seketika saat game dimulai
    playBgmTick();
    bgmInterval = setInterval(playBgmTick, 320);
  }

  // OTOMATIS HENTIKAN SUARA GAME SAAT SLIDE PRESENTASI DIBUKA
  function pauseForPresentation() {
    isPausedForSlide = true;
    if (bgmGain && ctx) {
      const now = ctx.currentTime;
      bgmGain.gain.cancelScheduledValues(now);
      bgmGain.gain.setValueAtTime(0.0001, now);
    }
  }

  // OTOMATIS NYALAKAN KEMBALI SUARA GAME SAAT SLIDE PRESENTASI DITUTUP
  function resumeFromPresentation() {
    isPausedForSlide = false;
    ensureContext();
    if (bgmGain && ctx && !isMuted) {
      const now = ctx.currentTime;
      bgmGain.gain.cancelScheduledValues(now);
      bgmGain.gain.setValueAtTime(0.68, now);
    }
    if (!bgmInterval) {
      startBGM();
    }
  }

  function toggleMute() {
    ensureContext();
    isMuted = !isMuted;
    const btn = document.getElementById('btnAudioToggle');
    if (btn) btn.innerText = isMuted ? '🔇' : '🔊';
    if (!isMuted && !isPausedForSlide) {
      playClick();
    }
    return isMuted;
  }

  return {
    startBGM,
    pauseForPresentation,
    resumeFromPresentation,
    playFootstep,
    playFireSkill,
    playLightningSkill,
    playUltimateSkill,
    playVictoryUnlock,
    playReopenSlide,
    playClick,
    toggleMute
  };
})();
