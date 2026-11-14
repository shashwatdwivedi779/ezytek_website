/* ============================================================
   EZYTEK CLEAN — HOMEPAGE JAVASCRIPT
   Version: 3.0 | Premium, Modular, High-Performance
   ============================================================ */

(function () {
  'use strict';

  /* ---- 01. SCROLL PROGRESS BAR & STICKY HEADER ---- */
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');
  const scrollProgressBar = document.querySelector('.scroll-progress-bar');

  function updateScrollState() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Progress bar width
    if (scrollProgressBar && docHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      scrollProgressBar.style.width = progress + '%';
    }

    // Header shadow
    if (header) {
      if (scrollY > 15) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Back to top button
    if (backToTop) {
      if (scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  /* Back to top click */
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- 02. MOBILE NAVIGATION ---- */
  /* Mobile drawer toggle is centrally managed by /view/nav.ejs to prevent double-event cancellation. */
  const mobileMenu = document.querySelector('.mobile-menu');
  const hamburger = document.querySelector('.nav-hamburger');

  /* Close mobile menu on desktop resize */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && mobileMenu && mobileMenu.classList.contains('open')) {
      if (hamburger) {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* ---- 03. HERO SLIDER ---- */
  const sliderTrack = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dot');
  const currentSlideEl = document.querySelector('.current-slide');
  const totalSlidesEl = document.querySelector('.total-slides');
  const progressFill = document.querySelector('.slide-progress-fill');

  let current = 0;
  let autoplayTimer = null;
  const AUTOPLAY_INTERVAL = 6000;

  if (totalSlidesEl && slides.length > 0) {
    totalSlidesEl.textContent = String(slides.length).padStart(2, '0');
  }

  function resetProgressBar() {
    if (!progressFill) return;
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    setTimeout(() => {
      progressFill.style.transition = `width ${AUTOPLAY_INTERVAL}ms linear`;
      progressFill.style.width = '100%';
    }, 50);
  }

  function goToSlide(index) {
    if (!sliderTrack || slides.length === 0) return;

    slides[current].classList.remove('active');
    if (dots[current]) {
      dots[current].classList.remove('active');
      dots[current].setAttribute('aria-selected', 'false');
    }

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    if (dots[current]) {
      dots[current].classList.add('active');
      dots[current].setAttribute('aria-selected', 'true');
    }

    sliderTrack.style.transform = `translateX(-${current * 100}%)`;

    if (currentSlideEl) {
      currentSlideEl.textContent = String(current + 1).padStart(2, '0');
    }

    resetProgressBar();
  }

  function startAutoplay() {
    if (slides.length <= 1) return;
    stopAutoplay();
    resetProgressBar();
    autoplayTimer = setInterval(() => {
      goToSlide(current + 1);
    }, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    if (progressFill) {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
    }
  }

  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopAutoplay();
      goToSlide(current - 1);
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopAutoplay();
      goToSlide(current + 1);
      startAutoplay();
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goToSlide(i);
      startAutoplay();
    });
  });

  // Touch / swipe support
  if (sliderTrack) {
    let touchStartX = 0;
    sliderTrack.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    sliderTrack.addEventListener('touchend', e => {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 45) {
        stopAutoplay();
        goToSlide(current + (delta > 0 ? 1 : -1));
        startAutoplay();
      }
    }, { passive: true });
  }

  // Pause on hover
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.addEventListener('mouseenter', stopAutoplay);
    heroSection.addEventListener('mouseleave', startAutoplay);
  }

  // Initialize first slide
  if (slides.length > 0) {
    slides[0].classList.add('active');
    if (dots[0]) dots[0].classList.add('active');
    goToSlide(0);
    startAutoplay();
  }

  /* ---- 04. STATS COUNTER ANIMATION ---- */
  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      obj.textContent = Math.floor(easeProgress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.textContent = end;
      }
    };
    window.requestAnimationFrame(step);
  }

  const statNumbers = document.querySelectorAll('.stat-count');
  let statsCounted = false;

  function runStatsCounter() {
    if (statsCounted) return;
    statsCounted = true;
    statNumbers.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      animateValue(el, 0, target, 2000);
    });
  }

  const statsSection = document.querySelector('.stats-section');
  if (statsSection && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runStatsCounter();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  } else {
    runStatsCounter();
  }

  /* ---- 05. DEALER NETWORK TABS ---- */
  const dealerTabs = document.querySelectorAll('.dealer-tab');
  const dealerPanels = document.querySelectorAll('.dealer-panel');

  dealerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      dealerTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      dealerPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const panel = document.getElementById(target);
      if (panel) {
        panel.classList.add('active');
      }
    });
  });

  /* ---- 06. SCROLL REVEAL (IntersectionObserver) ---- */
  const animEls = document.querySelectorAll('.anim-fade-up');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    animEls.forEach(el => revealObserver.observe(el));
  } else {
    animEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---- 07. SMOOTH SCROLL FOR IN-PAGE LINKS ---- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- 08. LOGO FALLBACK ERROR HANDLER ---- */
  // Gracefully handle any missing partner or government images
  window.handleLogoError = function (imgElement, acronym) {
    imgElement.style.display = 'none';
    const parent = imgElement.parentElement;
    if (parent && !parent.querySelector('.logo-emblem-fallback') && !parent.querySelector('.govt-emblem-fallback')) {
      const isGovt = parent.classList.contains('govt-logo-card');
      const badge = document.createElement('div');
      badge.className = isGovt ? 'govt-emblem-fallback' : 'logo-emblem-fallback';
      badge.textContent = acronym || 'PARTNER';
      parent.insertBefore(badge, imgElement);
    }
  };

  /* ---- 09. INFINITE MARQUEE CONTROLLER (OEM & GOVERNMENT) ---- */
  function setupInfiniteMarquee(trackId, speedPixelsPerSecond) {
    const track = document.getElementById(trackId);
    if (!track) return;

    // Explicitly disable CSS animation on this track so JS has full 60fps control
    track.style.animation = 'none';
    track.style.webkitAnimation = 'none';

    let currentX = 0;
    let isPaused = false;
    let lastTime = null;

    function getResetPoint() {
      // Find the first duplicated item (marked with aria-hidden="true")
      const duplicateItem = track.querySelector('[aria-hidden="true"]');
      if (duplicateItem && duplicateItem.offsetLeft > 0) {
        return duplicateItem.offsetLeft;
      }
      return track.scrollWidth > 0 ? track.scrollWidth / 2 : 1000;
    }

    // Hover & Touch event listeners
    track.addEventListener('mouseenter', () => { isPaused = true; });
    track.addEventListener('mouseleave', () => { isPaused = false; });
    track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
    track.addEventListener('touchend', () => { isPaused = false; }, { passive: true });

    function render(timestamp) {
      if (!lastTime) lastTime = timestamp;
      // Cap delta time to 0.1s to prevent teleportation on tab switch
      const delta = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      if (!isPaused) {
        const resetPoint = getResetPoint();
        if (resetPoint > 0) {
          currentX += speedPixelsPerSecond * delta;
          if (currentX >= resetPoint) {
            currentX = currentX % resetPoint;
          }
          track.style.transform = `translate3d(-${currentX.toFixed(2)}px, 0, 0)`;
        }
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  // Initialize both marquees (OEM at 45 px/sec, Government at 50 px/sec)
  function initAllMarquees() {
    setupInfiniteMarquee('oem-track', 45);
    setupInfiniteMarquee('govt-track', 50);
  }

  /* ---- 10. CATEGORY HORIZONTAL PRODUCT TRACK SCROLL ---- */
  window.scrollProductTrack = function (btn, direction) {
    const group = btn.closest('.live-category-group');
    if (!group) return;
    const track = group.querySelector('.live-products-track');
    if (!track) return;
    const scrollAmount = 430 * direction;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  function initTrackDrag() {
    document.querySelectorAll('.live-products-track').forEach(slider => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      slider.addEventListener('mousedown', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = '';
      });

      slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = '';
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAllMarquees();
      initTrackDrag();
    });
  } else {
    // DOM already loaded
    setTimeout(() => {
      initAllMarquees();
      initTrackDrag();
    }, 50);
  }

})();
