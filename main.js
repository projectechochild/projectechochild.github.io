/* ============================================================
   ECHO CHILD — MAIN JS
   Horror transitions + interactive features
   ============================================================ */

/* ---- MOBILE NAV ---- */
const toggle = document.querySelector('.mobile-toggle');
const nav = document.querySelector('nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

/* ---- INTRO LOADER (index.html only) ---- */
const introLoader = document.getElementById('intro-loader');
if (introLoader) {
  setTimeout(() => {
    introLoader.classList.add('fade-out');
    document.body.classList.remove('loading');
    setTimeout(() => introLoader.remove(), 900);
  }, 2400);
}

/* ============================================================
   CREEPY GIRL PAGE TRANSITION
   ============================================================ */
function createTransitionOverlay() {
  const existing = document.getElementById('transition-overlay');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'transition-overlay';

  const canvas = document.createElement('canvas');
  canvas.id = 'transition-canvas';
  overlay.appendChild(canvas);

  document.body.appendChild(overlay);
  return overlay;
}

function drawGirlFrame(ctx, w, h, frame, totalFrames) {
  ctx.clearRect(0, 0, w, h);

  const progress = frame / totalFrames; // 0 → 1

  // Background — dark room/corridor
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#010103');
  bgGrad.addColorStop(0.6, '#030308');
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Floor
  ctx.fillStyle = '#08080e';
  ctx.fillRect(0, h * 0.75, w, h * 0.25);
  ctx.strokeStyle = '#1a1a2a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.lineTo(w, h * 0.75);
  ctx.stroke();

  // Perspective lines on floor
  ctx.strokeStyle = 'rgba(20,20,35,0.6)';
  ctx.lineWidth = 0.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.75);
    ctx.lineTo(w / 2 + i * w * 0.5, h);
    ctx.stroke();
  }

  // Hallway walls (perspective)
  const vp = { x: w / 2, y: h * 0.35 };
  const wallOpening = 0.35 - progress * 0.2; // door opens as progress increases

  // Left wall
  ctx.fillStyle = '#0a0a12';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(vp.x - w * wallOpening, vp.y - h * 0.2);
  ctx.lineTo(vp.x - w * wallOpening, h * 0.75);
  ctx.lineTo(0, h * 0.75);
  ctx.closePath();
  ctx.fill();

  // Right wall
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(vp.x + w * wallOpening, vp.y - h * 0.2);
  ctx.lineTo(vp.x + w * wallOpening, h * 0.75);
  ctx.lineTo(w, h * 0.75);
  ctx.closePath();
  ctx.fill();

  // Door frame at end of hallway
  const doorW = w * wallOpening * 1.8;
  const doorH = h * 0.5;
  const doorX = vp.x - doorW / 2;
  const doorY = vp.y - doorH * 0.6;

  // Door light (flickering glow behind door)
  const flickerPhase = Math.sin(frame * 0.8) * 0.5 + 0.5;
  const flickerAlpha = 0.05 + flickerPhase * 0.12 + progress * 0.08;
  const doorGlow = ctx.createRadialGradient(vp.x, vp.y, 0, vp.x, vp.y, doorW);
  doorGlow.addColorStop(0, `rgba(180,120,40,${flickerAlpha})`);
  doorGlow.addColorStop(0.5, `rgba(100,40,20,${flickerAlpha * 0.5})`);
  doorGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = doorGlow;
  ctx.fillRect(doorX - 30, doorY - 20, doorW + 60, doorH + 40);

  // Door border
  ctx.strokeStyle = '#2a2020';
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX, doorY, doorW, doorH);

  // PHASE 1 (0 → 0.45): girl walks toward door from far away
  // PHASE 2 (0.45 → 0.65): girl reaches door, opens it
  // PHASE 3 (0.65 → 0.85): girl turns and smiles
  // PHASE 4 (0.85 → 1): screen glitches and fills

  if (progress < 0.85) {
    // Figure scale — tiny far away, grows as she approaches
    let figScale, figY;

    if (progress < 0.45) {
      // Walking toward door
      figScale = 0.04 + (progress / 0.45) * 0.18;
      figY = h * 0.75;
    } else if (progress < 0.65) {
      // Reaching door / opening it
      const doorProg = (progress - 0.45) / 0.20;
      figScale = 0.22 + doorProg * 0.12;
      figY = h * 0.75;
    } else {
      // Turned around, facing viewer
      const turnProg = (progress - 0.65) / 0.20;
      figScale = 0.34 + turnProg * 0.15;
      figY = h * 0.75;
    }

    const figH = h * figScale;
    const figW = figH * 0.45;
    const figX = w / 2;
    const figBaseY = figY;
    const figTopY = figBaseY - figH;

    // Walking bob
    const walkCycle = Math.sin(frame * 0.35) * (figH * 0.015);
    const headBob = Math.sin(frame * 0.35) * (figH * 0.012);

    // Dress / body
    const dressColor = progress > 0.65 ? '#e8ddd0' : '#d0c8bc';
    ctx.fillStyle = dressColor;
    ctx.beginPath();
    ctx.moveTo(figX - figW * 0.25, figTopY + figH * 0.35);
    ctx.lineTo(figX - figW * 0.4, figBaseY + walkCycle);
    ctx.lineTo(figX + figW * 0.4, figBaseY + walkCycle);
    ctx.lineTo(figX + figW * 0.25, figTopY + figH * 0.35);
    ctx.closePath();
    ctx.fill();

    // Arms
    ctx.strokeStyle = dressColor;
    ctx.lineWidth = figH * 0.04;
    ctx.lineCap = 'round';
    const armSwing = Math.sin(frame * 0.35) * (figH * 0.08);

    // Left arm
    ctx.beginPath();
    ctx.moveTo(figX - figW * 0.25, figTopY + figH * 0.38);
    ctx.lineTo(figX - figW * 0.35 - armSwing, figTopY + figH * 0.62 + armSwing * 0.3);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(figX + figW * 0.25, figTopY + figH * 0.38);
    ctx.lineTo(figX + figW * 0.35 + armSwing, figTopY + figH * 0.62 - armSwing * 0.3);
    ctx.stroke();

    // Legs walking
    const legSwing = Math.sin(frame * 0.35) * (figH * 0.08);
    ctx.strokeStyle = '#c8b8a0';
    ctx.lineWidth = figH * 0.05;

    ctx.beginPath();
    ctx.moveTo(figX - figW * 0.1, figBaseY + walkCycle);
    ctx.lineTo(figX - figW * 0.15 - legSwing * 0.5, figBaseY + figH * 0.15 + walkCycle);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(figX + figW * 0.1, figBaseY + walkCycle);
    ctx.lineTo(figX + figW * 0.15 + legSwing * 0.5, figBaseY + figH * 0.15 + walkCycle);
    ctx.stroke();

    // Hair — long dark hair
    ctx.fillStyle = '#1a0f0a';
    if (progress <= 0.65) {
      // Back of head (walking away)
      ctx.beginPath();
      ctx.ellipse(figX, figTopY + figH * 0.12 + headBob, figW * 0.25, figW * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Long hair draping down
      ctx.beginPath();
      ctx.moveTo(figX - figW * 0.22, figTopY + figH * 0.08 + headBob);
      ctx.quadraticCurveTo(figX - figW * 0.3, figTopY + figH * 0.35 + headBob, figX - figW * 0.2, figTopY + figH * 0.45 + headBob);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(figX + figW * 0.22, figTopY + figH * 0.08 + headBob);
      ctx.quadraticCurveTo(figX + figW * 0.3, figTopY + figH * 0.35 + headBob, figX + figW * 0.2, figTopY + figH * 0.45 + headBob);
      ctx.fill();
    } else {
      // Front face — turned toward viewer
      const turnProg = (progress - 0.65) / 0.20;
      const skinTone = `rgba(220,195,170,${0.5 + turnProg * 0.5})`;

      // Head
      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.ellipse(figX, figTopY + figH * 0.13 + headBob, figW * 0.22, figW * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair framing face
      ctx.fillStyle = '#120a06';
      ctx.beginPath();
      ctx.ellipse(figX, figTopY + figH * 0.1 + headBob, figW * 0.24, figW * 0.18, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(figX - figW * 0.22, figTopY + figH * 0.08 + headBob);
      ctx.lineTo(figX - figW * 0.32, figTopY + figH * 0.45 + headBob);
      ctx.lineTo(figX - figW * 0.18, figTopY + figH * 0.42 + headBob);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(figX + figW * 0.22, figTopY + figH * 0.08 + headBob);
      ctx.lineTo(figX + figW * 0.32, figTopY + figH * 0.45 + headBob);
      ctx.lineTo(figX + figW * 0.18, figTopY + figH * 0.42 + headBob);
      ctx.closePath();
      ctx.fill();

      // EYES — dark hollow then wide
      const eyeAlpha = Math.min(1, turnProg * 2);
      const eyeSize = figW * (0.05 + turnProg * 0.04);
      const eyeY = figTopY + figH * 0.14 + headBob;

      // Whites of eyes (unsettling wide)
      ctx.fillStyle = `rgba(240,235,225,${eyeAlpha})`;
      ctx.beginPath();
      ctx.ellipse(figX - figW * 0.09, eyeY, eyeSize, eyeSize * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(figX + figW * 0.09, eyeY, eyeSize, eyeSize * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils — small, off-center (unsettling)
      ctx.fillStyle = `rgba(15,5,5,${eyeAlpha})`;
      ctx.beginPath();
      ctx.ellipse(figX - figW * 0.085, eyeY + eyeSize * 0.1, eyeSize * 0.55, eyeSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(figX + figW * 0.095, eyeY + eyeSize * 0.1, eyeSize * 0.55, eyeSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // SMILE — wide, too wide
      if (turnProg > 0.3) {
        const smileAlpha = Math.min(1, (turnProg - 0.3) / 0.4);
        const smileY = figTopY + figH * 0.18 + headBob;
        const smileWidth = figW * 0.18 * Math.min(1, (turnProg - 0.3) / 0.3);
        const smileCurve = figH * 0.03 * Math.min(1, (turnProg - 0.3) / 0.3);

        // Teeth — too many, too bright
        ctx.fillStyle = `rgba(240,238,230,${smileAlpha * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(figX - smileWidth, smileY);
        ctx.quadraticCurveTo(figX, smileY + smileCurve * 1.5, figX + smileWidth, smileY);
        ctx.quadraticCurveTo(figX, smileY + smileCurve * 0.5, figX - smileWidth, smileY);
        ctx.fill();

        // Lips
        ctx.strokeStyle = `rgba(140,60,60,${smileAlpha})`;
        ctx.lineWidth = figH * 0.012;
        ctx.beginPath();
        ctx.moveTo(figX - smileWidth, smileY);
        ctx.quadraticCurveTo(figX, smileY + smileCurve, figX + smileWidth, smileY);
        ctx.stroke();
      }
    }

    // Shadow on floor
    const shadowAlpha = 0.15 + figScale * 0.3;
    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(figX, figBaseY + 2, figW * 0.35, figH * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // GLITCH PHASE (0.85 → 1)
  if (progress > 0.85) {
    const glitchProg = (progress - 0.85) / 0.15;

    // Red noise fill
    ctx.fillStyle = `rgba(80,0,0,${glitchProg * 0.7})`;
    ctx.fillRect(0, 0, w, h);

    // Horizontal glitch bars
    const numBars = Math.floor(glitchProg * 12);
    for (let i = 0; i < numBars; i++) {
      const barY = Math.random() * h;
      const barH2 = Math.random() * 20 + 2;
      const barX = (Math.random() - 0.5) * 60;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '200,0,0' : '0,200,150'},${Math.random() * 0.8})`;
      ctx.fillRect(barX, barY, w, barH2);
    }

    // Static noise
    for (let i = 0; i < 200 * glitchProg; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const ns = Math.random() * 4;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
      ctx.fillRect(nx, ny, ns, ns);
    }

    // Final white flash
    if (glitchProg > 0.8) {
      ctx.fillStyle = `rgba(255,255,255,${(glitchProg - 0.8) / 0.2})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Film grain
  for (let i = 0; i < 300; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(gx, gy, 1, 1);
  }
}

function runPageTransition(href) {
  const overlay = createTransitionOverlay();
  const canvas = overlay.querySelector('canvas');
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  overlay.classList.add('active');

  const totalFrames = 72; // ~2.4s at 30fps
  let frame = 0;
  let rafId;
  let navigated = false;

  function animate() {
    if (frame >= totalFrames) {
      if (!navigated) {
        navigated = true;
        window.location.href = href;
      }
      return;
    }

    drawGirlFrame(ctx, w, h, frame, totalFrames);
    frame++;
    rafId = requestAnimationFrame(animate);

    // Navigate slightly before full completion for seamless feel
    if (frame > totalFrames * 0.92 && !navigated) {
      navigated = true;
      window.location.href = href;
    }
  }

  animate();
}

/* ---- INTERCEPT NAV CLICKS ---- */
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept internal .html links (not anchors, mailto, external)
    if (href && href.endsWith('.html') && !href.startsWith('http') && !href.startsWith('//')) {
      link.addEventListener('click', (e) => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (href === currentPage) return; // same page, skip
        e.preventDefault();
        runPageTransition(href);
      });
    }
  });
});

/* ============================================================
   CHARACTER CARD TOGGLE
   ============================================================ */
function toggleDetails(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.toggle('open');
}

/* ============================================================
   CAST FORM MODAL
   ============================================================ */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf8jrHPtqQFklJtPdmZYF8jahTUi7tUn__NesYb2GSIEFopaA/viewform';

function openFormModal(characterName, role) {
  const modal = document.getElementById('form-modal');
  const title = document.getElementById('modal-title');
  const iframe = document.getElementById('modal-iframe');
  if (!modal) return;
  if (title) title.textContent = `Audition — ${characterName} / ${role}`;
  if (iframe) iframe.src = FORM_URL + `?usp=pp_url&entry.character=${encodeURIComponent(characterName)}`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFormModal(e) {
  if (e.target.id === 'form-modal' || e.target.classList.contains('modal-close')) {
    const modal = document.getElementById('form-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      const iframe = document.getElementById('modal-iframe');
      if (iframe) iframe.src = '';
    }
  }
}

/* ============================================================
   STARS GENERATOR (homepage)
   ============================================================ */
function generateStars() {
  const container = document.querySelector('.hero-stars');
  if (!container) return;

  const count = 120;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    const size = Math.random() * 2.5 + 0.5;
    const x = Math.random() * 100;
    const y = Math.random() * 60;
    const delay = Math.random() * 5;
    const duration = 2 + Math.random() * 4;
    const minO = Math.random() * 0.2 + 0.05;
    const maxO = minO + Math.random() * 0.7;

    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      --d: ${duration}s;
      --min-o: ${minO};
      --max-o: ${maxO};
      animation-delay: ${delay}s;
    `;
    container.appendChild(star);
  }
}

/* ============================================================
   DATA TICKER
   ============================================================ */
function buildTicker() {
  const tracks = document.querySelectorAll('.ticker-track');
  const data = [
    'SUBJECT_7 NEURAL PATTERN: UNSTABLE',
    'ECHO FREQUENCY: 38.4 Hz',
    'GOVERNMENT FILE: CLASSIFIED',
    'REANIMATION INDEX: CRITICAL',
    'LOUISIANA LAT 30.22 / LON -91.88',
    'PROJECT ECHO CHILD — STATUS: ACTIVE',
    'BIOLOGICAL ANOMALY DETECTED',
    'CONTAINMENT PROTOCOL: FAILED',
    'DOLLHOUSE SIGNAL: BROADCASTING',
    'SUBJECT HAS LEFT THE FREEZER',
    'DNA MATCH: 99.7% — CLASSIFIED',
    'MEMORY RESIDUE: CONFIRMED',
    'OPERATIVE KOD: ON-SITE',
  ];

  tracks.forEach(track => {
    const doubled = [...data, ...data];
    track.innerHTML = doubled.map(d => `<span>${d}</span>`).join('');
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  generateStars();
  buildTicker();
});
