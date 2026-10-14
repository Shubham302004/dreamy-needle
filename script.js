document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const docEl = document.documentElement;

  /* 1. Scroll-reveal engine with sibling stagger */
  const revealElements = document.querySelectorAll('.reveal-init');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = el.parentElement ? el.parentElement.children : [];
        const idx = Math.min(Array.prototype.indexOf.call(siblings, el), 5);
        const delay = reduceMotion ? 0 : idx * 90;
        el.style.setProperty('--d', delay + 'ms');
        el.classList.add('reveal-visible');
        obs.unobserve(el);
        /* hand transitions back to the element's own styles once entrance completes */
        window.setTimeout(() => {
          el.classList.remove('reveal-init');
          el.style.removeProperty('--d');
        }, delay + 1500);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => { el.classList.add('reveal-visible'); el.classList.remove('reveal-init'); });
  }

  /* 2. Interactive FAQ accordion (aria-expanded + aria-hidden kept in sync) */
  document.querySelectorAll('.faq-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isExpanded));
      if (content) {
        const open = content.classList.toggle('is-open');
        content.setAttribute('aria-hidden', String(!open));
      }
      if (icon) icon.classList.toggle('is-open');
    });
  });

  /* 3. Category filter pills */
  const filterPills = document.querySelectorAll('.filter-pill');
  const creationCards = document.querySelectorAll('#creations-grid .creation-card');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.getAttribute('data-filter');
      filterPills.forEach(p => {
        p.setAttribute('aria-pressed', 'false');
        p.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
        p.classList.add('bg-surface-container', 'text-on-surface-variant');
      });
      pill.setAttribute('aria-pressed', 'true');
      pill.classList.remove('bg-surface-container', 'text-on-surface-variant');
      pill.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
      creationCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          /* cancel any pending hide so rapid filter switches never vanish this card */
          if (card._hideTimeout) { clearTimeout(card._hideTimeout); card._hideTimeout = null; }
          if (card._showTimeout) { clearTimeout(card._showTimeout); card._showTimeout = null; }
          card.style.display = '';
          card._showTimeout = window.setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
            card._showTimeout = null;
          }, 20);
        } else {
          if (card._showTimeout) { clearTimeout(card._showTimeout); card._showTimeout = null; }
          card.style.opacity = '0';
          card.style.transform = 'scale(0.96)';
          if (card._hideTimeout) clearTimeout(card._hideTimeout);
          card._hideTimeout = window.setTimeout(() => {
            card.style.display = 'none';
            card._hideTimeout = null;
          }, 320);
        }
      });
    });
  });

  /* 3b. Gallery nav anchor: if a filter hides the #gallery card, restore it first */
  document.querySelectorAll('a[href="#gallery"]').forEach(a => {
    a.addEventListener('click', () => {
      const g = document.getElementById('gallery');
      if (g && g.offsetParent === null) {
        const allPill = document.querySelector('.filter-pill[data-filter="all"]');
        if (allPill) allPill.click();
      }
    });
  });

  /* 4. Hero mouse tilt (fine pointers only) — targets the inner card so the
     outer .hero-hoop-float keyframe animation keeps owning its own transform */
  const heroCard = document.getElementById('hero-hoop-tilt');
  const heroWrap = document.getElementById('hero-interactive-wrap');
  const heroBadge = heroWrap ? heroWrap.querySelector('div.absolute.-bottom-4') : null;
  if (heroWrap && heroCard && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    heroWrap.addEventListener('mousemove', (e) => {
      const rect = heroWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroCard.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`;
    });
    heroWrap.addEventListener('mouseleave', () => { heroCard.style.transform = ''; });
  }

  /* 5. Mobile navigation menu */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      const icon = menuToggle.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = open ? 'close' : 'menu';
    };
    menuToggle.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  /* 6. Scroll-driven FX: thread progress, stitch connector, hero parallax, active nav */
  const threadFill = document.getElementById('thread-fill');
  const threadNeedle = document.querySelector('.thread-needle');
  const stepThread = document.getElementById('step-thread');
  const stepsGrid = document.getElementById('steps-grid');
  const heroSection = document.getElementById('hero-section');
  const heroBlobs = heroSection ? heroSection.querySelectorAll('.blur-3xl') : [];
  const heroSvg = heroSection ? heroSection.querySelector('svg') : null;
  const siteNav = document.getElementById('site-nav');
  const navActiveClasses = siteNav ? siteNav.getAttribute('data-active-classes').split(/\s+/) : [];
  const navBaseClasses = ['text-on-surface-variant', 'hover:text-on-surface'];
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('#site-nav .nav-link, #mobile-menu .mobile-link'));
  /* remember each link's own base/active class set so toggling never injects
     classes the link never had (e.g. desktop hover class onto mobile links) */
  navLinks.forEach(a => {
    a._base = navBaseClasses.filter(c => a.classList.contains(c));
    a._active = a.classList.contains('nav-link') ? navActiveClasses : ['text-primary', 'font-bold'];
  });
  const sectionIds = navLinks.map(a => (a.getAttribute('href') || '').slice(1)).filter((v, i, arr) => v && arr.indexOf(v) === i);
  let lastActive = null;
  let ticking = false;
  let heroWrapShift = 0;

  const requestTick = () => {
    if (!ticking) { window.requestAnimationFrame(updateScrollFX); ticking = true; }
  };

  function updateScrollFX() {
    ticking = false;
    const y = window.pageYOffset || docEl.scrollTop;
    const vh = window.innerHeight;
    const max = docEl.scrollHeight - vh;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

    /* A. thread progress bar + riding needle (clamped so it never clips the viewport edge) */
    if (threadFill) threadFill.style.transform = 'scaleX(' + p + ')';
    if (threadNeedle) {
      const needleX = Math.max(0, Math.min(window.innerWidth - 18, p * (window.innerWidth - 18)));
      threadNeedle.style.transform = 'translateX(' + needleX + 'px)';
    }

    /* B. self-stitching brass thread through the how-to-order steps */
    if (stepThread && stepsGrid) {
      const r = stepsGrid.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / Math.max(1, r.height * 0.7 + 80)));
      stepThread.style.setProperty('--p', prog.toFixed(3));
    }

    /* D. hero parallax layers (blobs, stitch curve, showcase card)
       The card carries an "Original" badge that hangs 16px below it, and the
       hero clips (overflow:hidden) right at its padding edge — so the card's
       shift is clamped to the room actually left below it, otherwise the badge
       gets sliced off by the next section on mobile. */
    if (!reduceMotion && heroSection && y < heroSection.offsetTop + heroSection.offsetHeight) {
      if (heroBlobs[0]) heroBlobs[0].style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
      if (heroBlobs[1]) heroBlobs[1].style.transform = 'translate3d(0,' + (y * 0.1).toFixed(1) + 'px,0)';
      if (heroSvg) heroSvg.style.transform = 'translate3d(0,' + (y * 0.07).toFixed(1) + 'px,0)';
      if (heroWrap) {
        const heroRect = heroSection.getBoundingClientRect();
        const wrapRect = heroWrap.getBoundingClientRect();
        /* the "Original" badge hangs 16px below the wrapper's own box, so the
           wrapper rect alone under-reports how far the card may travel */
        const badgeRect = heroBadge ? heroBadge.getBoundingClientRect() : null;
        const contentBottom = badgeRect ? Math.max(wrapRect.bottom, badgeRect.bottom) : wrapRect.bottom;
        /* static clearance = live gap + the shift already applied, minus room
           for the hero-hoop-float keyframes (±6px) while they swing down */
        const room = heroRect.bottom - contentBottom + heroWrapShift - 10;
        const shift = Math.max(0, Math.min(y * 0.05, room));
        heroWrapShift = shift;
        heroWrap.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
      }
    }

    /* G. active nav highlighting driven by scroll position */
    let activeId = '';
    let bestTop = -Infinity;
    for (let i = 0; i < sectionIds.length; i++) {
      const el = document.getElementById(sectionIds[i]);
      if (!el || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.top > 160) continue;
      if (el.offsetTop > bestTop) {
        bestTop = el.offsetTop;
        activeId = sectionIds[i];
      }
    }
    if (activeId !== lastActive) {
      lastActive = activeId;
      navLinks.forEach(a => {
        const isActive = a.getAttribute('href') === '#' + activeId;
        if (isActive) {
          a._base.forEach(c => a.classList.remove(c));
          a._active.forEach(c => a.classList.add(c));
          a.setAttribute('aria-current', 'true');
        } else {
          a._active.forEach(c => a.classList.remove(c));
          a._base.forEach(c => a.classList.add(c));
          a.removeAttribute('aria-current');
        }
      });
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  window.addEventListener('load', requestTick);
  updateScrollFX();
  /* ===== Upgrade 1: scroll-driven stitching thread ===== */
  const stitchSvg = document.getElementById('stitch-thread');
  if (stitchSvg) {
    const maskPath = document.getElementById('thread-mask-path');
    const maskEl = document.getElementById('thread-reveal-mask');
    const guidePath = document.getElementById('thread-guide');
    const drawPath = document.getElementById('thread-path');
    const needleEl = document.getElementById('stitch-needle');
    const knotEl = document.getElementById('thread-knot');
    const mainEl = document.querySelector('main');
    let totalLen = 1;
    let mTop = 0;
    let yStart = 0;
    let yEnd = 1;
    let maxScroll = 1;
    let targetFrac = 0;
    let curFrac = 0;
    let stitchRaf = null;
    let rebuildTimer = null;

    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    function catmullRom(pts) {
      let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i > 0 ? i - 1 : 0];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i < pts.length - 2 ? i + 1 : pts.length - 1];
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
      }
      return d;
    }

    function fracFromScroll() {
      const sy = window.pageYOffset || window.scrollY || 0;
      if (sy >= maxScroll - 1) return 1;
      const tipMain = sy + window.innerHeight * 0.55 - mTop;
      return clamp01((tipMain - yStart) / Math.max(1, yEnd - yStart));
    }

    function applyStitch() {
      const drawn = curFrac * totalLen;
      /* reads first: geometry at the tip */
      let px = 0;
      let py = 0;
      let ang = 0;
      if (drawn > 6) {
        let p1;
        let p2;
        if (drawn >= totalLen - 4) {
          /* near the end the forward sample would coincide with p1 (atan2(0,0)
             snaps to horizontal) — sample backwards to keep the tangent */
          p1 = drawPath.getPointAtLength(Math.max(0, drawn - 4));
          p2 = drawPath.getPointAtLength(drawn);
          px = p2.x;
          py = p2.y;
        } else {
          p1 = drawPath.getPointAtLength(drawn);
          p2 = drawPath.getPointAtLength(Math.min(totalLen, drawn + 4));
          px = p1.x;
          py = p1.y;
        }
        ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      }
      const nearEnd = curFrac >= 0.997;
      /* writes: transform / stroke-dashoffset / opacity only */
      maskPath.style.strokeDashoffset = String(totalLen - drawn);
      knotEl.setAttribute('opacity', nearEnd ? '1' : '0');
      if (drawn > 6) {
        /* smaller needle on narrow screens so it clears the 20px text margin */
        const sc = window.innerWidth < 768 ? 0.58 : 1;
        needleEl.setAttribute('transform', 'translate(' + px.toFixed(1) + ',' + py.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + sc + ') translate(-12,-12)');
        needleEl.setAttribute('opacity', '1');
      } else {
        needleEl.setAttribute('opacity', '0');
      }
    }

    function tickStitch() {
      stitchRaf = null;
      curFrac += (targetFrac - curFrac) * 0.16;
      if (Math.abs(targetFrac - curFrac) < 0.0005) curFrac = targetFrac;
      applyStitch();
      if (curFrac !== targetFrac) scheduleStitch();
    }

    function scheduleStitch() {
      if (stitchRaf === null) stitchRaf = window.requestAnimationFrame(tickStitch);
    }

    function onScrollStitch() {
      targetFrac = fracFromScroll();
      scheduleStitch();
    }

    function buildThread() {
      if (!mainEl || !maskPath) return;
      const rect = mainEl.getBoundingClientRect();
      const sy = window.pageYOffset || window.scrollY || 0;
      mTop = rect.top + sy;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      stitchSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      maskEl.setAttribute('x', '-40');
      maskEl.setAttribute('y', '-40');
      maskEl.setAttribute('width', String(w + 80));
      maskEl.setAttribute('height', String(h + 80));
      const logo = document.querySelector('header a[href="#hero-section"] img');
      const lRect = logo ? logo.getBoundingClientRect() : { left: 34, bottom: 56, width: 32 };
      const startX = lRect.left + lRect.width / 2;
      /* fixed header: viewport coords equal scroll-0 document coords */
      yStart = lRect.bottom - 4 - mTop;
      yEnd = Math.max(yStart + 120, h - 6);
      const vw = window.innerWidth;
      const narrow = vw < 768;
      const pad = vw >= 1024 ? 48 : 20;
      let d;
      if (narrow) {
        // Mobile seam path: smoothly connects under logo and stitches down dedicated 34px margin at x = 14px
        const xSeam = 14;
        const pts = [[startX, yStart]];
        // Smooth entry curve from logo hoop into the left margin seam
        pts.push([startX * 0.65 + xSeam * 0.35, yStart + 25]);
        pts.push([startX * 0.25 + xSeam * 0.75, yStart + 55]);
        pts.push([xSeam, yStart + 90]);

        // Hand-stitched organic wave down the mobile seam track
        const step = 200;
        let y = yStart + 90 + step;
        let k = 0;
        while (y < yEnd - 40) {
          const xWave = xSeam + Math.sin(k * 1.5) * 1.5;
          pts.push([xWave, y]);
          y += step;
          k++;
        }
        pts.push([xSeam, yEnd]);
        d = catmullRom(pts);
      } else {
        const grid = document.getElementById('creations-grid');
        let gridTop = -1;
        let gridBottom = -1;
        if (grid) {
        const g = grid.getBoundingClientRect();
        gridTop = g.top + sy - mTop;
        gridBottom = g.bottom + sy - mTop;
      }
      const xA = pad >= 48 ? 16 : 8;
      const xB = pad - (pad >= 48 ? 8 : 4);
      const xDeep = pad + (pad >= 48 ? 56 : 24);
      const step = Math.max(360, Math.min(520, h / 16));
      const pts = [[startX, yStart]];
      let y = yStart + Math.min(160, step * 0.4);
      let k = 0;
      while (y < yEnd - 40) {
        const inGrid = y > gridTop && y < gridBottom;
        let x = (k % 2 === 0) ? xA : (inGrid ? xDeep : xB);
        x += Math.sin(k * 1.7 + y * 0.002) * 4;
        pts.push([x, y]);
        y += step;
        k++;
      }
        pts.push([(k % 2 === 0) ? xA : xB, yEnd]);
        d = catmullRom(pts);
      }
      guidePath.setAttribute('d', d);
      drawPath.setAttribute('d', d);
      maskPath.setAttribute('d', d);
      totalLen = maskPath.getTotalLength() || 1;
      maskPath.style.strokeDasharray = String(totalLen);
      const endPt = maskPath.getPointAtLength(totalLen);
      knotEl.setAttribute('transform', 'translate(' + endPt.x.toFixed(1) + ',' + endPt.y.toFixed(1) + ')');
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (reduceMotion) {
        maskPath.style.strokeDashoffset = '0';
        needleEl.setAttribute('opacity', '0');
        knotEl.setAttribute('opacity', '1');
      } else {
        targetFrac = fracFromScroll();
        curFrac = targetFrac;
        applyStitch();
        scheduleStitch();
      }
    }

    function queueRebuild() {
      if (rebuildTimer) clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(buildThread, 120);
    }

    buildThread();
    if (!reduceMotion) {
      window.addEventListener('scroll', onScrollStitch, { passive: true });
    }
    window.addEventListener('resize', queueRebuild);
    window.addEventListener('load', queueRebuild);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(queueRebuild).catch(function () {});
    }
    if ('ResizeObserver' in window && mainEl) {
      new ResizeObserver(queueRebuild).observe(mainEl);
    }
  }
});