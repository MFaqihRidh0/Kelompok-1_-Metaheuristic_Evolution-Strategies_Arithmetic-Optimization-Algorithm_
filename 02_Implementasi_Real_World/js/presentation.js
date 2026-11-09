    // ============================================================================
    // 8. SLIDE DECK NAVIGATION
    // ============================================================================
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function updateSlide() {
      const wrapper = document.querySelector('.slides-wrapper');
      if (wrapper) wrapper.scrollTop = 0;
      slides.forEach((s, idx) => {
        s.classList.toggle('active', idx === currentSlide);
      });
      document.getElementById('counter').innerText = `Slide ${currentSlide + 1} / ${slides.length}`;
      document.getElementById('progressBar').style.width = `${((currentSlide + 1) / slides.length) * 100}%`;

      // Auto-switch 3D scene mode based on slide attribute
      const activeSlideEl = slides[currentSlide];
      const targetMode = activeSlideEl.getAttribute('data-3d-mode') || 'topology';
      set3DMode(targetMode);
    }

    function nextSlide() {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlide();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    }

    // Prevent arrow navigation while focusing on form inputs
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      }
    });

    // Start everything on DOM Load
    window.addEventListener('DOMContentLoaded', () => {
      init3D();
      updateSlide();
    });
    // ============================================================================
    // 9. INTERACTIVE CODE EXPLORER & MODAL
    // ============================================================================
    function switchCodeTab(tabId) {
      document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.code-tab-pane').forEach(p => p.classList.remove('active'));

      const btn = document.getElementById('codeTabBtn_' + tabId);
      const pane = document.getElementById('codeTabPane_' + tabId);
      if (btn) btn.classList.add('active');
      if (pane) pane.classList.add('active');
    }

    function openFullCodeModal() {
      const modal = document.getElementById('fullCodeModal');
      if (modal) modal.classList.add('active');
    }

    function closeFullCodeModal(e) {
      if (e && e.target !== e.currentTarget && e.target.id !== 'fullCodeModal') return;
      const modal = document.getElementById('fullCodeModal');
      if (modal) modal.classList.remove('active');
    }

    function copyPythonCode() {
      const codeEl = document.getElementById('fullPythonCodeBlock');
      if (!codeEl) return;
      navigator.clipboard.writeText(codeEl.innerText).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        if (btn) {
          const orig = btn.innerText;
          btn.innerText = '✅ Tersalin!';
          setTimeout(() => btn.innerText = orig, 2000);
        }
      });
    }
  