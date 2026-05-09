(function () {
  'use strict';

  const container = document.getElementById('three-bg-canvas');
  if (!container || !window.THREE) return;

  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 200 : 600;
  const SPREAD = isMobile ? 8 : 12;
  const SPEED = isMobile ? 0.15 : 0.3;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 2] = (Math.random() - 0.5) * (SPREAD * 0.5);

    velocities.push({
      x: (Math.random() - 0.5) * SPEED * 0.01,
      y: (Math.random() - 0.5) * SPEED * 0.01,
      z: (Math.random() - 0.5) * SPEED * 0.005
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x888888,
    size: isMobile ? 0.04 : 0.03,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;

  if (!isMobile) {
    document.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    targetRotY += (mouseX * 0.3 - targetRotY) * 0.02;
    targetRotX += (-mouseY * 0.2 - targetRotX) * 0.02;

    particles.rotation.y += (targetRotY - particles.rotation.y) * 0.01;
    particles.rotation.x += (targetRotX - particles.rotation.x) * 0.01;

    const pos = geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      if (Math.abs(pos[i * 3]) > SPREAD * 0.5) velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > SPREAD * 0.5) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > SPREAD * 0.25) velocities[i].z *= -1;
    }
    geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
