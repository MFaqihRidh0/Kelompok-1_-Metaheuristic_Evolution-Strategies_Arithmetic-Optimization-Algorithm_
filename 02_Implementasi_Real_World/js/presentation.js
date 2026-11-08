    // ============================================================================
    // 8. SLIDE DECK NAVIGATION
    // ============================================================================
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function updateSlide() {
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