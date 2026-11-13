// ============================================================================
// AOA CLOUD BATTLE ARENA — UI CONTROLLER, FLOATING SLIDE WINDOW & SIMULATOR
// ============================================================================

let currentOpenSlideIdx = 0;
let simClockTimer = null;
let simClockValue = 0;

function startGameFromIntro() {
  if (!isIntroMode) return;
  isIntroMode = false;

  const introEl = document.getElementById('introOverlay');
  if (introEl) introEl.classList.add('hidden');

  const hudEl = document.getElementById('gameHudLayer');
  if (hudEl) hudEl.classList.remove('hidden');

  CloudAudio.startBGM();
  CloudAudio.playVictoryUnlock();
  updateQuestHudProgress();
  renderTeleportList();
}

function updateQuestHudProgress() {
  const titleEl = document.getElementById('questProgressTitle');
  const descEl = document.getElementById('questProgressDesc');
  if (!titleEl || !descEl) return;

  titleEl.innerText = `Arena Training • ${defeatedCount}/8 Musuh Dikalahkan`;

  const nextEn = enemyObjects.find(e => !e.defeated);
  if (nextEn) {
    descEl.innerHTML = `Target Berikutnya: <strong>${nextEn.station.name}</strong>. Serang 2x dengan <strong>🔥 Api [J]</strong> & <strong>⚡ Listrik [K]</strong> untuk membuka Slide ${nextEn.station.posNum}!`;
  } else {
    descEl.innerHTML = `🎉 <strong>Seluruh 8 Pos Musuh Telah Dikalahkan!</strong> Dekati mayat musuh & tekan <strong>[O]</strong> untuk membuka kembali slide mana pun.`;
  }
  renderTeleportList();
}

// ============================================================================
// FLOATING PRESENTATION SLIDE WINDOW (Centered, Maximize ⛶, Close ✕)
// ============================================================================
function openSlideWindow(slideIdx) {
  currentOpenSlideIdx = slideIdx;
  const overlay = document.getElementById('slideModalOverlay');
  overlay.classList.add('active');

  const slides = document.querySelectorAll('.game-slide-pane');
  slides.forEach((s, idx) => {
    s.style.display = idx === slideIdx ? 'block' : 'none';
  });

  const st = ENEMY_STATIONS[slideIdx];
  document.getElementById('winStationBadge').innerText = `+ POS ${st.posNum} TERBUKA • ${st.name}`;
  document.getElementById('winStationTitle').innerText = st.slideTitle;
  document.getElementById('winFooterCounter').innerText = `Slide Pos ${st.posNum} / 8`;

  const bodyEl = document.getElementById('slideWindowBody');
  if (bodyEl) bodyEl.scrollTop = 0;

  updateSimDashboardUI();
}

function closeSlideWindow() {
  CloudAudio.playClick();
  const overlay = document.getElementById('slideModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function toggleSlideFullscreen() {
  CloudAudio.playClick();
  const win = document.getElementById('slideFloatingWindow');
  const btn = document.getElementById('btnFullscreenToggle');
  const isFull = win.classList.toggle('fullscreen-mode');
  if (btn) {
    btn.innerText = isFull ? '🗗 Ukuran Mengambang' : '⛶ Layar Penuh';
  }
}

function stepSlideInWindow(dir) {
  CloudAudio.playClick();
  const nextIdx = (currentOpenSlideIdx + dir + ENEMY_STATIONS.length) % ENEMY_STATIONS.length;
  openSlideWindow(nextIdx);
}

function closeAndWalkNext() {
  closeSlideWindow();
  walkToNextUndefeatedPos();
}

// ============================================================================
// TELEPORT & DIRECT SLIDE UNLOCK MENU (Top-Right 📍 Button)
// ============================================================================
function toggleTeleportPopover() {
  CloudAudio.playClick();
  const pop = document.getElementById('teleportPopover');
  pop.classList.toggle('active');
  renderTeleportList();
}

function renderTeleportList() {
  const listEl = document.getElementById('teleportListContainer');
  if (!listEl) return;

  listEl.innerHTML = ENEMY_STATIONS.map((st, idx) => {
    const en = enemyObjects[idx];
    const isDefeated = en && en.defeated;
    const statusBadge = isDefeated
      ? `<span style="color:#059669; font-size:10.5px;">🔓 Terbuka [O]</span>`
      : `<span style="color:#dc2626; font-size:10.5px;">🥊 100 HP</span>`;

    return `
      <div class="teleport-item">
        <div onclick="teleportToPos(${idx})" style="flex:1;">
          <div>Pos ${st.posNum}: ${st.slideTitle.replace(/^Slide \d+:\s*/, '')}</div>
          ${statusBadge}
        </div>
        <button class="btn-hud-secondary" style="padding:3px 8px; font-size:10px;" onclick="openSlideWindow(${idx}); document.getElementById('teleportPopover').classList.remove('active');">
          📖 Buka Slide
        </button>
      </div>
    `;
  }).join('');
}

// ============================================================================
// EMBEDDED SIMULATOR CONSOLE (Random vs AOA Live Allocation)
// ============================================================================
function runEmbeddedAlgo(algoType) {
  const sel = document.getElementById('algoSelect');
  if (sel) sel.value = algoType;
  triggerEmbeddedSimulation();
}

function triggerEmbeddedSimulation() {
  CloudAudio.playClick();
  updateSimDashboardUI();

  const algo = document.getElementById('algoSelect').value;
  const dataset = document.getElementById('datasetSelect').value;
  const env = document.getElementById('envSelect').value;
  const targetMakespan = BENCHMARK_DATA[env][dataset][algo].makespan;

  if (simClockTimer) clearInterval(simClockTimer);
  simClockValue = 0;
  const step = targetMakespan / 28;

  simClockTimer = setInterval(() => {
    simClockValue += step;
    if (simClockValue >= targetMakespan) {
      simClockValue = targetMakespan;
      clearInterval(simClockTimer);
    }
    const clkEl = document.getElementById('clockValue');
    if (clkEl) clkEl.innerText = `${simClockValue.toFixed(2)}s`;
  }, 45);
}

function resetEmbeddedSimulation() {
  CloudAudio.playClick();
  if (simClockTimer) clearInterval(simClockTimer);
  document.getElementById('clockValue').innerText = '0.00s';
  document.getElementById('algoSelect').value = 'aoa';
  document.getElementById('datasetSelect').value = '100';
  updateSimDashboardUI();
}

function updateSimDashboardUI() {
  const algoEl = document.getElementById('algoSelect');
  if (!algoEl) return;

  const algo = algoEl.value;
  const dataset = document.getElementById('datasetSelect').value;
  const env = document.getElementById('envSelect').value;

  const rec = BENCHMARK_DATA[env][dataset];
  const res = rec[algo];
  const base = rec['random'];
  const aoa = rec['aoa'];

  const activeTag = document.getElementById('simActiveTag');
  if (activeTag) {
    activeTag.innerText = algo === 'aoa' ? 'AOA (Teroptimasi)' : 'Random (Inefisien)';
    activeTag.style.background = algo === 'aoa' ? '#e0f2fe' : '#fee2e2';
    activeTag.style.color = algo === 'aoa' ? '#0369a1' : '#991b1b';
  }

  const msDelta = (((res.makespan - base.makespan) / base.makespan) * 100).toFixed(1);
  document.getElementById('kpiMakespan').innerText = `${res.makespan.toFixed(2)} s`;
  const msDeltaEl = document.getElementById('kpiMakespanDelta');
  msDeltaEl.innerText = algo === 'aoa' ? `${msDelta}% Lebih Cepat` : 'Baseline (Lambat)';
  msDeltaEl.className = algo === 'aoa' ? 'kpi-sub text-green' : 'kpi-sub';

  document.getElementById('kpiLBI').innerText = res.lbi.toFixed(2);
  const lbiEl = document.getElementById('kpiLBIBadge');
  lbiEl.innerText = algo === 'aoa' ? 'Seimbang & Proporsional' : 'Timpang Ekstrem';
  lbiEl.className = algo === 'aoa' ? 'kpi-sub text-green' : 'kpi-sub';

  document.getElementById('kpiThroughput').innerText = `${res.throughput.toFixed(2)} t/s`;
  const tpGain = (((aoa.throughput - base.throughput) / base.throughput) * 100).toFixed(0);
  document.getElementById('kpiThroughputSub').innerText = algo === 'aoa' ? `+${tpGain}% Kapasitas` : 'Terhambat';

  document.getElementById('kpiCost').innerText = `$${res.cost.toFixed(2)}`;
  const saved = (base.cost - aoa.cost).toFixed(2);
  document.getElementById('kpiCostDelta').innerText = algo === 'aoa' ? `Hemat $${saved}` : 'Pemborosan Biaya';

  // Datacenter Bars
  const sbyBar = document.getElementById('dcSbyBar');
  const jktBar = document.getElementById('dcJktBar');
  const yogBar = document.getElementById('dcYogBar');

  sbyBar.style.width = `${res.util.sby}%`;
  jktBar.style.width = `${res.util.jkt}%`;
  yogBar.style.width = `${res.util.yog}%`;

  sbyBar.className = algo === 'aoa' ? 'meter-fill fill-sky' : 'meter-fill fill-idle';
  jktBar.className = 'meter-fill fill-purple';
  yogBar.className = algo === 'aoa' ? 'meter-fill fill-green' : 'meter-fill fill-danger';

  document.getElementById('dcSbyLoadText').innerText = algo === 'aoa' ? `${res.util.sby}% (Optimal Heavy)` : `${res.util.sby}% (IDLE Menganggur!)`;
  document.getElementById('dcJktLoadText').innerText = `${res.util.jkt}% (Medium Load)`;
  document.getElementById('dcYogLoadText').innerText = algo === 'aoa' ? `${res.util.yog}% (Optimal Light)` : `${res.util.yog}% (OVERLOAD MACET!)`;

  const banner = document.getElementById('simStatusBanner');
  const icon = document.getElementById('simStatusIcon');
  const txt = document.getElementById('simStatusText');

  if (algo === 'aoa') {
    banner.className = 'sim-status-banner';
    icon.innerText = '✅';
    txt.innerHTML = `<strong>AOA Berhasil:</strong> Tugas berat diarahkan presisi ke Surabaya (6.000 MIPS). Beban 3 DC merata & Makespan terpangkas ${Math.abs(msDelta)}%!`;
  } else {
    banner.className = 'sim-status-banner danger';
    icon.innerText = '⚠️';
    txt.innerHTML = `<strong>Inefisiensi Fatal Random:</strong> VM kecil Yogyakarta (800 MIPS) mengalami bottleneck ${res.util.yog}%, sedangkan Surabaya menganggur (${res.util.sby}%)!`;
  }
}

// ============================================================================
// CREDITS & MENU SPLIT MODAL (Replica of Reference Image 6)
// ============================================================================
function openCreditsModal() {
  CloudAudio.playClick();
  document.getElementById('creditsModalOverlay').classList.add('active');
}

function closeCreditsModal() {
  CloudAudio.playClick();
  document.getElementById('creditsModalOverlay').classList.remove('active');
}

function switchCreditsTab(tabName, btnEl) {
  CloudAudio.playClick();
  document.querySelectorAll('.tab-sq-btn.tab-item').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  document.querySelectorAll('.credits-tab-pane').forEach(p => {
    p.style.display = p.id === `creditsTab_${tabName}` ? 'block' : 'none';
  });
}

// ============================================================================
// FULL 349-LINE PYTHON SOURCE CODE MODAL
// ============================================================================
function openFullCodeModal() {
  CloudAudio.playClick();
  document.getElementById('fullCodeModal').classList.add('active');
}

function closeFullCodeModal() {
  CloudAudio.playClick();
  document.getElementById('fullCodeModal').classList.remove('active');
}

function copyPythonCode() {
  const codeBlock = document.getElementById('fullPythonCodeBlock');
  if (!codeBlock) return;
  const raw = codeBlock.innerText.replace(/^\s*\d+\s*\|\s*/gm, '');
  navigator.clipboard.writeText(raw).then(() => {
    const btn = document.getElementById('copyCodeBtn');
    if (btn) {
      btn.innerText = '✅ Berhasil Disalin!';
      setTimeout(() => { btn.innerText = '📋 Salin Seluruh Kode'; }, 2000);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initGameEngine();
  updateSimDashboardUI();
});
