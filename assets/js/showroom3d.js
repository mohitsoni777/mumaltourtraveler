/* =========================================================
   Mumal Tour & Travels — interactive 3D showroom (Three.js)
   Vehicles are modelled procedurally from side profiles, so no
   external 3D files are needed.
   ========================================================= */
(() => {
  'use strict';

  const THREE = window.THREE;
  const host = document.getElementById('srCanvas');
  const stageEl = document.getElementById('srStage');
  const hsLayer = document.getElementById('srHotspots');
  const loadingEl = document.getElementById('srLoading');
  if (!host) return;
  const fail = (msg) => { loadingEl.lastChild.textContent = msg; loadingEl.firstElementChild?.remove(); };
  if (!THREE) { fail('3D view unavailable.'); return; }

  const pending = { model: 'coach', lights: false, drive: false, spin: true };
  let api = null;
  window.MumalShowroom = {
    show(id) { pending.model = id; api?.show(id); },
    set(k, v) { pending[k] = v; api?.set(k, v); },
  };

  // Lazy-init when the showroom approaches the viewport
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    init();
  }, { rootMargin: '700px 0px' });
  io.observe(stageEl);

  async function init() {
    try {
      if (document.fonts) await Promise.race([document.fonts.load('700 120px "Cormorant Garamond"'), new Promise((r) => setTimeout(r, 1500))]);
    } catch (e) { /* fonts optional */ }
    try {
      api = createShowroom();
    } catch (err) {
      console.error(err);
      fail('3D view could not start on this device.');
      return;
    }
    api.set('lights', pending.lights);
    api.set('drive', pending.drive);
    api.set('spin', pending.spin);
    api.show(pending.model);
  }

  function createShowroom() {
    if (THREE.ColorManagement && 'legacyMode' in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    const gsap = window.gsap;

    /* ---------- Renderer / scene / camera ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(envTexture()).texture;

    const hemi = new THREE.HemisphereLight(0xfff2de, 0x2a1418, 0.55);
    const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
    key.position.set(10, 16, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    const rim = new THREE.DirectionalLight(0xe2b25a, 1.1);
    rim.position.set(-12, 7, -10);
    const fill = new THREE.DirectionalLight(0xb9c8ff, 0.35);
    fill.position.set(-8, 4, 12);
    scene.add(hemi, key, rim, fill);

    /* ---------- Shared materials ---------- */
    const M = {
      glass: new THREE.MeshPhysicalMaterial({ color: 0x1b2b33, metalness: 0.55, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2, emissive: 0xffb562, emissiveIntensity: 0 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x151113, roughness: 0.55, metalness: 0.35 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x0e0e0f, roughness: 0.88 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 1, roughness: 0.16 }),
      rim: new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 1, roughness: 0.26 }),
      head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3da, emissiveIntensity: 0.5, roughness: 0.15 }),
      tail: new THREE.MeshStandardMaterial({ color: 0x4a0808, emissive: 0xff2020, emissiveIntensity: 0.4, roughness: 0.3 }),
      maroon: new THREE.MeshPhysicalMaterial({ color: 0x6d1426, metalness: 0.4, roughness: 0.3, clearcoat: 1 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd6a548, metalness: 1, roughness: 0.24 }),
      ac: new THREE.MeshStandardMaterial({ color: 0xe9e5df, metalness: 0.2, roughness: 0.42 }),
      liner: new THREE.MeshStandardMaterial({ color: 0x080606, roughness: 0.95, side: THREE.DoubleSide }),
    };
    const paints = [];
    const beamMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xfff1d0) }, uOpacity: { value: 0 }, uH: { value: 7 } },
      vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; uniform float uH; varying float vY; void main(){ float t = clamp((vY + uH * 0.5) / uH, 0.0, 1.0); gl_FragColor = vec4(uColor, pow(t, 2.4) * uOpacity); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });

    /* ---------- Turntable stage ---------- */
    const stage = new THREE.Group();
    scene.add(stage);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.8, 0.3, 120), new THREE.MeshStandardMaterial({ color: 0x1d1317, metalness: 0.55, roughness: 0.4 }));
    disk.position.y = -0.15;
    disk.receiveShadow = true;
    stage.add(disk);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xd6a548, metalness: 1, roughness: 0.25, emissive: 0xd6a548, emissiveIntensity: 0.08 });
    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(9.55, 0.07, 12, 180), ringMat);
    goldRing.rotation.x = Math.PI / 2;
    stage.add(goldRing);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(18.4, 4.3), new THREE.MeshStandardMaterial({ color: 0x0c0809, roughness: 0.92, metalness: 0.05 }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.004;
    road.receiveShadow = true;
    stage.add(road);
    [-1.95, 1.95].forEach((z) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(17.6, 0.06), new THREE.MeshBasicMaterial({ color: 0xd6a548, transparent: true, opacity: 0.55 }));
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.007, z);
      stage.add(line);
    });
    const dashes = [];
    for (let i = 0; i < 9; i++) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.12), new THREE.MeshBasicMaterial({ color: 0xf1e3c4, transparent: true, opacity: 0.6 }));
      d.rotation.x = -Math.PI / 2;
      d.position.set(-8 + i * 2, 0.008, 0);
      stage.add(d);
      dashes.push(d);
    }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ map: radialTex('rgba(214,165,72,0.55)', 'rgba(214,165,72,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.32;
    scene.add(glow);
    const shadowTex = radialTex('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)');

    /* ---------- Vehicle specs (metres) ---------- */
    const SPECS = {
      coach: { type: 'coach', L: 12, H: 3.55, W: 2.55, gc: 0.42, bev: 0.07, wheelR: 0.52, tw: 0.32, arches: [{ x: -3.6, r: 0.72 }, { x: 3.4, r: 0.72 }], belt: 1.78, wsBase: 1.15, slope: 0.32, paint: 0xf4f1ec, roofAC: { len: 0.34, x: -0.1 }, mirrors: 'bus', display: 'MUMAL ✦ UDAIPUR', decal: { w: 3.4, x: -0.2, y: 1.02 } },
      minibus: { type: 'van', L: 8, H: 3.0, W: 2.2, gc: 0.36, bev: 0.06, wheelR: 0.43, tw: 0.26, arches: [{ x: -2.3, r: 0.6 }, { x: 2.45, r: 0.6 }], belt: 1.5, hoodY: 1.18, nose: 0.85, wsRun: 0.75, paint: 0xf5f3ef, roofAC: { len: 0.26, x: -0.2 }, rack: true, decal: { w: 2.6, x: 0.05, y: 0.84 } },
      urbania: { type: 'van', L: 6.9, H: 2.85, W: 2.08, gc: 0.36, bev: 0.06, wheelR: 0.4, tw: 0.24, arches: [{ x: -2.05, r: 0.55 }, { x: 2.2, r: 0.55 }], belt: 1.45, hoodY: 1.12, nose: 0.7, wsRun: 0.85, paint: 0xf7f6f3, roofAC: { len: 0.16, x: -2.3 }, decal: { w: 2.2, x: 0.05, y: 0.8 } },
    };

    /* ---------- Geometry helpers ---------- */
    function rrect(w, h, r) {
      const s = new THREE.Shape();
      const x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    function offsetLine(ax, ay, bx, by, e) {
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      return [ax + (dy / len) * e, ay + (-dx / len) * e, bx + (dy / len) * e, by + (-dx / len) * e];
    }
    const lineX = (l, y) => l[0] + ((l[2] - l[0]) * (y - l[1])) / (l[3] - l[1]);
    const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };

    function bodyShape(sp) {
      const { L, H, gc } = sp;
      const x0 = -L / 2, x1 = L / 2;
      const s = new THREE.Shape();
      s.moveTo(x0 + 0.32, gc);
      sp.arches.slice().sort((a, b) => a.x - b.x).forEach((a) => { s.lineTo(a.x - a.r, gc); s.absarc(a.x, gc, a.r, Math.PI, 0, true); });
      if (sp.type === 'coach') {
        s.lineTo(x1 - 0.25, gc);
        s.quadraticCurveTo(x1, gc, x1, gc + 0.25);
        s.lineTo(x1, sp.wsBase);
        s.lineTo(x1 - sp.slope, H - 0.45);
        s.quadraticCurveTo(x1 - sp.slope - 0.06, H, x1 - sp.slope - 0.6, H);
      } else {
        s.lineTo(x1 - 0.3, gc);
        s.quadraticCurveTo(x1, gc, x1, gc + 0.3);
        s.lineTo(x1, sp.hoodY - 0.22);
        s.quadraticCurveTo(x1, sp.hoodY, x1 - 0.32, sp.hoodY + 0.04);
        s.lineTo(x1 - sp.nose, sp.hoodY + 0.2);
        s.lineTo(x1 - sp.nose - sp.wsRun, H - 0.3);
        s.quadraticCurveTo(x1 - sp.nose - sp.wsRun - 0.12, H, x1 - sp.nose - sp.wsRun - 0.6, H);
      }
      s.lineTo(x0 + 0.4, H);
      s.quadraticCurveTo(x0, H, x0, H - 0.4);
      s.lineTo(x0, gc + 0.32);
      s.quadraticCurveTo(x0, gc, x0 + 0.32, gc);
      return s;
    }

    function glassInfo(sp) {
      const { L, H, bev, belt } = sp;
      const x0 = -L / 2, x1 = L / 2;
      const e = bev + 0.014;
      const s = new THREE.Shape();
      if (sp.type === 'coach') {
        const top = H - 0.5;
        const ws = offsetLine(x1, sp.wsBase, x1 - sp.slope, H - 0.45, e);
        const yb = sp.wsBase + 0.1;
        s.moveTo(x0 + 0.55, belt);
        s.lineTo(x1 - 1.75, belt);
        s.lineTo(x1 - 1.35, yb);
        s.lineTo(lineX(ws, yb), yb);
        s.lineTo(lineX(ws, top), top);
        s.lineTo(x0 + 0.55, top);
        return { shape: s, top, start: x0 + 0.55, end: x1 - 1.75, ws, pitch: 1.55, front: x1 - 1.55, frontLow: yb };
      }
      const top = H - 0.38;
      const ax = x1 - sp.nose, ay = sp.hoodY + 0.2;
      const ws = offsetLine(ax, ay, ax - sp.wsRun, H - 0.3, e);
      const yb = ay + 0.04;
      s.moveTo(x0 + 0.45, belt);
      s.lineTo(ax - 0.4, belt);
      s.lineTo(lineX(ws, yb), yb);
      s.lineTo(lineX(ws, top), top);
      s.lineTo(x0 + 0.45, top);
      return { shape: s, top, start: x0 + 0.45, end: ax - 0.4, ws, pitch: 1.25, front: null };
    }

    function wheel(r, tw) {
      const w = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, tw, 40), M.rubber);
      tire.rotation.x = Math.PI / 2;
      const rimM = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, tw + 0.02, 32), M.rim);
      rimM.rotation.x = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r * 0.22, tw + 0.08, 16), M.chrome);
      hub.rotation.x = Math.PI / 2;
      w.add(tire, rimM, hub);
      for (let i = 0; i < 6; i++) {
        [1, -1].forEach((side) => {
          const sp = box(r * 0.09, r * 0.95, 0.02, M.dark, 0, 0, side * (tw / 2 + 0.012));
          sp.rotation.z = (i * Math.PI) / 3;
          w.add(sp);
        });
      }
      w.userData.r = r;
      return w;
    }

    function decalTexture(dark) {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 256;
      const g = c.getContext('2d');
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      const grad = g.createLinearGradient(160, 0, 860, 0);
      grad.addColorStop(0, '#b8862f'); grad.addColorStop(0.5, '#f7e2a6'); grad.addColorStop(1, '#b8862f');
      g.fillStyle = dark ? grad : '#6d1426';
      g.font = '700 150px "Cormorant Garamond", Georgia, serif';
      const word = 'MUMAL', spacing = 34;
      const widths = [...word].map((ch) => g.measureText(ch).width);
      let x = 512 - (widths.reduce((a, b) => a + b, 0) + spacing * (word.length - 1)) / 2;
      [...word].forEach((ch, i) => { g.fillText(ch, x + widths[i] / 2, 160); x += widths[i] + spacing; });
      g.fillStyle = dark ? '#f3d68e' : '#b8862f';
      g.font = '700 30px Manrope, Arial, sans-serif';
      g.fillText('T O U R   &   T R A V E L S   ·   U D A I P U R', 512, 222);
      g.fillRect(250, 186, 524, 3);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }
    function displayTexture(text, color) {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = '#050304'; g.fillRect(0, 0, 1024, 128);
      g.fillStyle = color; g.font = '800 64px Manrope, Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = color; g.shadowBlur = 18;
      g.fillText(text, 512, 68);
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,.35)';
      for (let y = 0; y < 128; y += 6) g.fillRect(0, y, 1024, 2);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      return t;
    }

    /* ---------- Vehicle builder ---------- */
    function buildVehicle(id) {
      const sp = SPECS[id];
      const { L, H, W, gc, bev } = sp;
      const x0 = -L / 2, x1 = L / 2;
      const zs = W / 2;
      const g = new THREE.Group();
      const body = new THREE.Group();
      g.add(body);
      const ud = (g.userData = { id, spec: sp, wheels: [], hotspots: [], lastX: 0, body, spot: null });

      const paint = new THREE.MeshPhysicalMaterial({ color: sp.paint, metalness: 0.12, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
      paints.push(paint);
      const glass = M.glass;

      // Shell
      const depth = W - 2 * bev;
      const shellGeo = new THREE.ExtrudeGeometry(bodyShape(sp), { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 32, steps: 1 });
      shellGeo.translate(0, 0, -depth / 2);
      body.add(new THREE.Mesh(shellGeo, paint));

      // Glass band + windshield
      const gi = glassInfo(sp);
      const gGeo = new THREE.ExtrudeGeometry(gi.shape, { depth: W + 0.02, bevelEnabled: false });
      gGeo.translate(0, 0, -(W + 0.02) / 2);
      body.add(new THREE.Mesh(gGeo, glass));

      // Window pillars
      const pillarMat = paint;
      const n = Math.max(2, Math.round((gi.end - gi.start) / gi.pitch));
      [1, -1].forEach((side) => {
        for (let i = 1; i < n; i++) {
          const px = gi.start + ((gi.end - gi.start) * i) / n;
          body.add(box(0.12, gi.top - sp.belt + 0.02, 0.012, pillarMat, px, (sp.belt + gi.top) / 2, side * (zs + 0.016)));
        }
        if (gi.front) body.add(box(0.1, gi.top - gi.frontLow, 0.012, pillarMat, gi.front, (gi.top + gi.frontLow) / 2, side * (zs + 0.016)));
      });

      // Livery stripes
      const stripeEnd = sp.type === 'coach' ? x1 - 1.9 : x1 - sp.nose - 0.5;
      const sLen = stripeEnd - (x0 + 0.12);
      const sMid = (stripeEnd + x0 + 0.12) / 2;
      [1, -1].forEach((side) => {
        body.add(box(sLen, sp.type === 'coach' ? 0.16 : 0.1, 0.01, M.maroon, sMid, sp.belt - (sp.type === 'coach' ? 0.17 : 0.2), side * (zs + 0.006)));
        body.add(box(sLen, 0.035, 0.01, M.gold, sMid, sp.belt - (sp.type === 'coach' ? 0.32 : 0.31), side * (zs + 0.006)));
      });

      // Brand decal on both sides
      const decalMat = new THREE.MeshStandardMaterial({ map: decalTexture(false), transparent: true, roughness: 0.35, metalness: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
      [1, -1].forEach((side) => {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(sp.decal.w, sp.decal.w / 4), decalMat);
        d.position.set(sp.decal.x * side, sp.decal.y, side * (zs + 0.008));
        if (side < 0) d.rotation.y = Math.PI;
        d.userData.noShadow = true;
        body.add(d);
      });

      // Wheel-arch liners + wheels
      sp.arches.forEach((a) => {
        const liner = new THREE.Mesh(new THREE.CylinderGeometry(a.r - bev - 0.012, a.r - bev - 0.012, W - 0.05, 28, 1, true, Math.PI / 2, Math.PI), M.liner);
        liner.rotation.x = Math.PI / 2;
        liner.position.set(a.x, gc, 0);
        body.add(liner);
        [1, -1].forEach((side) => {
          const w = wheel(sp.wheelR, sp.tw);
          w.position.set(a.x, sp.wheelR, side * (zs - sp.tw / 2 - 0.02));
          g.add(w);
          ud.wheels.push(w);
        });
      });

      // Front / rear details
      let headY, headZ, headX = x1 + bev + 0.012;
      if (sp.type === 'coach') {
        headY = gc + 0.62; headZ = zs - 0.45;
        [1, -1].forEach((s) => {
          body.add(box(0.04, 0.17, 0.55, M.head, headX, headY, s * headZ));
          body.add(box(0.03, 0.03, 0.55, M.head, headX, headY + 0.16, s * headZ));
        });
        body.add(box(0.03, 0.32, W * 0.4, M.dark, headX, gc + 0.66, 0));
        body.add(box(0.035, 0.07, 0.42, M.gold, headX + 0.005, gc + 0.98, 0));
        body.add(box(0.2, 0.26, W - 0.06, M.dark, x1 + bev + 0.03, gc + 0.16, 0));
        // rear
        [1, -1].forEach((s) => body.add(box(0.04, 0.9, 0.16, M.tail, x0 - bev - 0.012, gc + 0.95, s * (zs - 0.15))));
        body.add(box(0.02, 0.85, W * 0.74, glass, x0 - bev - 0.01, H - 1.05, 0));
        body.add(box(0.16, 0.24, W - 0.06, M.dark, x0 - bev - 0.02, gc + 0.15, 0));
        // LED destination board on the windshield
        const dispMat = new THREE.MeshBasicMaterial({ map: displayTexture(sp.display, '#ffb340'), toneMapped: false });
        const dy = H - 0.66;
        const holder = new THREE.Group();
        holder.position.set(lineX(gi.ws, dy) + 0.004, dy, 0);
        holder.rotation.z = Math.atan2(sp.slope, H - 0.45 - sp.wsBase);
        const disp = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.62, 0.22), dispMat);
        disp.rotation.y = Math.PI / 2;
        holder.add(disp);
        body.add(holder);
        // wipers
        [-0.45, 0.45].forEach((z) => {
          const wpr = box(0.02, 0.02, 0.9, M.dark, lineX(gi.ws, sp.wsBase + 0.18) + 0.02, sp.wsBase + 0.18, z);
          wpr.rotation.x = z > 0 ? 0.35 : -0.35;
          body.add(wpr);
        });
      } else {
        headY = sp.hoodY - 0.36; headZ = zs - 0.3;
        [1, -1].forEach((s) => body.add(box(0.06, 0.15, 0.42, M.head, headX, headY, s * headZ)));
        body.add(box(0.03, 0.32, W * 0.42, M.dark, headX, sp.hoodY - 0.44, 0));
        [-0.08, 0, 0.08].forEach((o) => body.add(box(0.035, 0.022, W * 0.42, M.chrome, headX + 0.006, sp.hoodY - 0.44 + o, 0)));
        body.add(box(0.22, 0.3, W - 0.04, M.dark, x1 + bev + 0.03, gc + 0.22, 0));
        [1, -1].forEach((s) => body.add(box(0.04, 0.7, 0.12, M.tail, x0 - bev - 0.012, gc + 0.85, s * (zs - 0.12))));
        body.add(box(0.02, 0.7, W * 0.7, glass, x0 - bev - 0.01, H - 0.85, 0));
        body.add(box(0.16, 0.24, W - 0.04, M.dark, x0 - bev - 0.02, gc + 0.16, 0));
      }

      // Mirrors
      [1, -1].forEach((s) => {
        if (sp.mirrors === 'bus') {
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x1 - 0.15, H - 0.55, s * zs * 0.95),
            new THREE.Vector3(x1 + 0.38, H - 0.5, s * (zs + 0.05)),
            new THREE.Vector3(x1 + 0.52, H - 0.9, s * (zs + 0.16)),
          ]);
          body.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.025, 8, false), M.dark));
          body.add(box(0.07, 0.46, 0.22, M.dark, x1 + 0.53, H - 1.12, s * (zs + 0.16)));
        } else {
          const ax = x1 - sp.nose;
          body.add(box(0.2, 0.04, 0.16, M.dark, ax + 0.02, sp.hoodY + 0.32, s * (zs + 0.06)));
          body.add(box(0.1, 0.24, 0.2, M.dark, ax + 0.08, sp.hoodY + 0.42, s * (zs + 0.16)));
        }
      });

      // Roof AC unit
      if (sp.roofAC) {
        const len = Math.max(1.1, L * sp.roofAC.len);
        const acGeo = new THREE.ExtrudeGeometry(rrect(len, W * 0.72, 0.28), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
        acGeo.rotateX(-Math.PI / 2);
        const ac = new THREE.Mesh(acGeo, M.ac);
        ac.position.set(sp.roofAC.x, H + bev - 0.03, 0);
        body.add(ac);
        [-0.22, 0.22].forEach((o) => body.add(box(len * 0.32, 0.02, W * 0.5, M.dark, sp.roofAC.x + o * len, H + bev + 0.23, 0)));
        ud.hotspots.push(sp.type === 'coach'
          ? { pos: new THREE.Vector3(sp.roofAC.x, H + 0.45, 0), icon: 'snow', label: 'Roof-mounted dual AC', desc: 'Even cooling for all 45 seats — even on hill roads.' }
          : { pos: new THREE.Vector3(sp.roofAC.x, H + 0.4, 0), icon: 'snow', label: id === 'urbania' ? 'Roof AC + individual vents' : 'Roof AC with ducted vents', desc: id === 'urbania' ? 'Personal airflow at every single seat.' : 'Cool air reaches every row of the cabin.' });
      }

      // Roof rack (mini coach)
      if (sp.rack) {
        const rx0 = x0 + 0.35, rx1 = -L * 0.18;
        [1, -1].forEach((s) => {
          const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, rx1 - rx0, 10), M.chrome);
          rail.rotation.z = Math.PI / 2;
          rail.position.set((rx0 + rx1) / 2, H + bev + 0.14, s * (zs - 0.2));
          body.add(rail);
        });
        for (let i = 0; i <= 4; i++) {
          const x = rx0 + ((rx1 - rx0) * i) / 4;
          body.add(box(0.04, 0.03, W - 0.4, M.chrome, x, H + bev + 0.14, 0));
          [1, -1].forEach((s) => body.add(box(0.04, 0.14, 0.04, M.chrome, x, H + bev + 0.07, s * (zs - 0.2))));
        }
      }

      // Contact shadow
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.12, W * 1.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.75 }));
      cs.rotation.x = -Math.PI / 2;
      cs.position.y = 0.014;
      cs.userData.noShadow = true;
      g.add(cs);

      // Headlight beams + ground spotlight
      [1, -1].forEach((s) => {
        const h = 7, th = Math.PI / 2 - 0.07;
        const beam = new THREE.Mesh(new THREE.ConeGeometry(1.15, h, 32, 1, true), beamMat);
        beam.rotation.z = th;
        beam.position.set(headX + (h / 2) * Math.sin(th), headY - (h / 2) * Math.cos(th), s * headZ);
        beam.userData.noShadow = true;
        body.add(beam);
      });
      const spot = new THREE.SpotLight(0xfff0d0, 0, 18, 0.55, 0.7, 1);
      spot.position.set(x1, headY, 0);
      spot.target.position.set(x1 + 8, 0, 0);
      body.add(spot, spot.target);
      ud.spot = spot;

      // Shadows
      g.traverse((o) => {
        if (o.isMesh && !o.userData.noShadow && o.material !== glass && o.material !== beamMat) { o.castShadow = true; }
      });

      // Hotspots
      const sideZ = zs + 0.08;
      const midGlass = (sp.belt + gi.top) / 2;
      // [icon, title, description, x, y, z] — x === null means "at the headlights"
      const cards = {
        coach: [
          ['seat', '2×2 push-back recliners', 'Wide seats with armrests and generous leg room.', -1.2, midGlass],
          ['luggage', '40+ bag luggage hold', 'Under-floor bays for wedding and tour luggage.', -2.1, 0.75],
          ['light', 'LED headlamps & DRLs', 'Bright, safe night driving across Rajasthan.', null],
        ],
        minibus: [
          ['seat', 'Push-back seats', 'Relaxed seating for day trips and yatras.', -1.0, midGlass],
          ['luggage', 'Roof luggage carrier', 'Extra space for bags, gifts and supplies.', -2.5, H + 0.25, 0],
          ['route', 'Hill-ready chassis', 'Nimble on old-city lanes and Aravalli ghats.', null],
        ],
        urbania: [
          ['seat', 'Captain recliners', 'Premium individual seats with armrests.', -0.6, midGlass],
          ['camera', 'Panoramic windows', 'Big views of the lakes and Aravalli hills.', 1.0, midGlass + 0.1],
          ['shield', 'Car-like smooth ride', 'Quiet, stable monocoque body — no bus bumps.', null],
        ],
      }[id];
      cards.forEach(([icon, label, desc, x, y, z]) => {
        const pos = x === null ? new THREE.Vector3(headX + 0.1, headY, 0) : new THREE.Vector3(x, y, z === undefined ? sideZ : z);
        ud.hotspots.push({ pos, icon, label, desc });
      });

      return g;
    }

    /* ---------- Texture helpers ---------- */
    function radialTex(inner, outer) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, inner); gr.addColorStop(0.45, inner.replace(/[\d.]+\)$/, (m) => (parseFloat(m) * 0.55).toFixed(2) + ')')); gr.addColorStop(1, outer);
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      return t;
    }
    function envTexture() {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const g = c.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, 512);
      sky.addColorStop(0, '#2a1d22'); sky.addColorStop(0.3, '#6b4a42'); sky.addColorStop(0.47, '#f1d6a8'); sky.addColorStop(0.53, '#4a2c26'); sky.addColorStop(1, '#0e0809');
      g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
      const soft = (x, y, w, h, a) => { const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, `rgba(255,250,240,${a})`); gr.addColorStop(1, `rgba(255,232,196,${a * 0.75})`); g.fillStyle = gr; g.fillRect(x, y, w, h); };
      soft(90, 70, 220, 70, 1); soft(470, 40, 300, 60, 0.95); soft(830, 90, 140, 90, 0.85); soft(380, 170, 120, 40, 0.6);
      const hz = g.createRadialGradient(300, 256, 10, 300, 256, 260);
      hz.addColorStop(0, 'rgba(255,200,120,0.55)'); hz.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = hz; g.fillRect(0, 0, 1024, 512);
      const t = new THREE.CanvasTexture(c);
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.encoding = THREE.sRGBEncoding;
      return t;
    }

    /* ---------- Camera fitting ---------- */
    const cam = { dist: 22, ty: 1.3, elev: 0.2, elevTarget: 0.2 };
    function fitFor(sp) {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      const aspect = w / h;
      const vf = (camera.fov * Math.PI) / 180;
      const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
      const halfW = sp.L * 0.56 + 0.7;
      const halfH = sp.H * 0.7 + 0.9;
      return { dist: Math.max(halfW / Math.tan(hf / 2), halfH / Math.tan(vf / 2)) * 1.18, ty: sp.H * 0.34 };
    }
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (current && !tl?.isActive()) Object.assign(cam, fitFor(current.userData.spec));
    }
    new ResizeObserver(resize).observe(host);

    /* ---------- Hotspots ---------- */
    // Each hotspot is a pulsing dot with a feature card. One card is shown at a time and
    // the showroom auto-tours through the features; hovering or tapping a dot pins its card.
    let hsEls = [];
    let hsActive = 0, hsTimer = 0, hsHover = false;
    const tmpV = new THREE.Vector3(), centerV = new THREE.Vector3();
    function buildHotspots() {
      hsLayer.innerHTML = '';
      hsActive = 0; hsTimer = 0;
      hsEls = current.userData.hotspots.map((h, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hotspot';
        b.innerHTML = `<span class="hs-dot"></span><span class="hs-card"><span class="hs-ic"><svg><use href="#i-${h.icon}"/></svg></span><span class="hs-tx"><strong></strong><small></small></span></span>`;
        b.querySelector('strong').textContent = h.label;
        b.querySelector('small').textContent = h.desc;
        b.setAttribute('aria-label', `${h.label}: ${h.desc}`);
        const pin = () => { hsActive = i; hsTimer = 0; };
        b.addEventListener('pointerenter', () => { hsHover = true; pin(); });
        b.addEventListener('pointerleave', () => { hsHover = false; });
        b.addEventListener('focus', pin);
        b.addEventListener('click', pin);
        hsLayer.appendChild(b);
        const card = b.querySelector('.hs-card');
        return { el: b, card, pos: h.pos, back: false, cw: card.offsetWidth, ch: card.offsetHeight, mode: '' };
      });
      if (window.gsap) gsap.from(hsEls.map((h) => h.el.firstChild), { scale: 0, duration: 0.6, ease: 'back.out(3)', stagger: 0.1 });
    }
    // Keep each feature card fully inside the 3D frame: right of the dot, else left,
    // else centred below (or above) it.
    const GAP = 22, PAD = 10;
    function placeCard(hs, x, y, w, h) {
      const { cw, ch } = hs;
      let mode, l, t;
      if (x + GAP + cw <= w - PAD) { mode = 'right'; l = GAP; t = 0; }
      else if (x - GAP - cw >= PAD) { mode = 'left'; l = -GAP - cw; t = 0; }
      else {
        l = Math.min(Math.max(PAD - x, -cw / 2), w - PAD - cw - x);
        if (y + GAP + ch <= h - 76) { mode = 'below'; t = GAP; } else { mode = 'above'; t = -GAP - ch; }
      }
      if (mode !== hs.mode) { hs.el.classList.remove('is-' + hs.mode); hs.el.classList.add('is-' + mode); hs.mode = mode; }
      hs.card.style.left = l.toFixed(1) + 'px';
      hs.card.style.top = t.toFixed(1) + 'px';
    }
    function updateHotspots(dt) {
      if (!hsEls.length) return;
      const w = host.clientWidth, h = host.clientHeight;
      current.getWorldPosition(centerV);
      const cd = camera.position.distanceTo(centerV);
      hsEls.forEach((hs) => {
        tmpV.copy(hs.pos);
        current.localToWorld(tmpV);
        const d = camera.position.distanceTo(tmpV);
        tmpV.project(camera);
        const x = (tmpV.x * 0.5 + 0.5) * w, y = (-tmpV.y * 0.5 + 0.5) * h;
        hs.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        hs.back = d > cd + 0.35;
        hs.el.classList.toggle('is-back', hs.back);
        placeCard(hs, x, y, w, h);
      });
      // Auto-tour: advance to the next front-facing feature every few seconds
      hsTimer += dt;
      if (hsEls[hsActive]?.back || (!hsHover && hsTimer > 3.4)) {
        hsTimer = 0;
        for (let k = 1; k <= hsEls.length; k++) {
          const nIdx = (hsActive + k) % hsEls.length;
          if (!hsEls[nIdx].back) { hsActive = nIdx; break; }
        }
      }
      hsEls.forEach((hs, i) => hs.el.classList.toggle('is-active', i === hsActive && !hs.back));
    }

    /* ---------- Model switching (drive-out / drive-in) ---------- */
    const cache = {};
    let current = null, currentId = null, tl = null;
    const getModel = (id) => cache[id] || (cache[id] = buildVehicle(id));
    function spinFromMotion(g) {
      const dx = g.position.x - g.userData.lastX;
      g.userData.lastX = g.position.x;
      g.userData.wheels.forEach((w) => (w.rotation.z -= dx / w.userData.r));
    }
    function show(id) {
      if (!SPECS[id] || id === currentId) return;
      if (tl) tl.progress(1, false).kill();
      const next = getModel(id);
      const prev = current;
      currentId = id;
      hsLayer.innerHTML = '';
      hsEls = [];
      const fit = fitFor(next.userData.spec);
      if (!gsap) {
        if (prev) stage.remove(prev);
        next.position.x = 0;
        stage.add(next);
        current = next;
        Object.assign(cam, fit);
        buildHotspots();
        return;
      }
      tl = gsap.timeline();
      if (prev) {
        tl.to(prev.position, { x: 24, duration: 0.85, ease: 'power2.in', onUpdate: () => spinFromMotion(prev) });
        tl.add(() => stage.remove(prev));
      }
      tl.add(() => { next.position.x = -24; next.userData.lastX = -24; stage.add(next); current = next; });
      tl.to(next.position, { x: 0, duration: 1.4, ease: 'power3.out', onUpdate: () => spinFromMotion(next) });
      tl.to(cam, { dist: fit.dist, ty: fit.ty, duration: 1.6, ease: 'power2.inOut' }, prev ? 0.35 : 0);
      tl.add(buildHotspots);
    }

    /* ---------- Options ---------- */
    const opt = { lights: false, drive: false, spin: true };
    const night = { spot: 0 };
    function tween(obj, props) {
      if (gsap) gsap.to(obj, { ...props, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto' });
      else Object.assign(obj, props);
    }
    function set(k, v) {
      opt[k] = v;
      if (k !== 'lights') return;
      tween(key, { intensity: v ? 0.25 : 1.6 });
      tween(hemi, { intensity: v ? 0.1 : 0.55 });
      tween(rim, { intensity: v ? 0.5 : 1.1 });
      tween(fill, { intensity: v ? 0.1 : 0.35 });
      tween(M.head, { emissiveIntensity: v ? 4 : 0.5 });
      tween(M.tail, { emissiveIntensity: v ? 3 : 0.4 });
      tween(M.glass, { emissiveIntensity: v ? 0.5 : 0 });
      tween(ringMat, { emissiveIntensity: v ? 0.6 : 0.08 });
      tween(beamMat.uniforms.uOpacity, { value: v ? 0.2 : 0 });
      tween(night, { spot: v ? 3.2 : 0 });
      paints.forEach((p) => tween(p, { envMapIntensity: v ? 0.3 : 1 }));
    }

    /* ---------- Interaction ---------- */
    let rotY = -0.6, rotVel = 0, dragging = false, lastPX = 0;
    host.addEventListener('pointerdown', (e) => { dragging = true; lastPX = e.clientX; host.setPointerCapture(e.pointerId); stageEl.querySelector('.sr-hint')?.style.setProperty('opacity', '0'); });
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      cam.elevTarget = 0.2 + ((e.clientY - r.top) / r.height - 0.5) * 0.14;
      if (!dragging) return;
      const dx = e.clientX - lastPX;
      lastPX = e.clientX;
      rotY += dx * 0.009;
      rotVel = dx * 0.009;
    });
    const release = () => { dragging = false; };
    host.addEventListener('pointerup', release);
    host.addEventListener('pointercancel', release);
    host.addEventListener('pointerleave', () => { cam.elevTarget = 0.2; });

    /* ---------- Render loop (only while visible) ---------- */
    const clock = new THREE.Clock();
    let visible = true, rafId = 0, firstFrame = true;
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !rafId) { clock.getDelta(); rafId = requestAnimationFrame(frame); }
    }).observe(stageEl);

    function frame() {
      rafId = 0;
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (!dragging) {
        rotVel = rotVel * 0.95 + (opt.spin ? 0.00016 : 0);
        rotY += rotVel;
      }
      stage.rotation.y = rotY;

      cam.elev += (cam.elevTarget - cam.elev) * 0.05;
      camera.position.set(0, cam.ty + cam.dist * Math.sin(cam.elev), cam.dist * Math.cos(cam.elev));
      camera.lookAt(0, cam.ty, 0);

      if (current) {
        const ud = current.userData;
        if (opt.drive && !tl?.isActive()) {
          const speed = 9 * dt;
          ud.wheels.forEach((w) => (w.rotation.z -= speed / w.userData.r));
          dashes.forEach((d) => { d.position.x -= speed; if (d.position.x < -9) d.position.x += 18; });
          ud.body.position.y = Math.sin(t * 15) * 0.008 + Math.sin(t * 3.1) * 0.006;
        } else ud.body.position.y *= 0.9;
        if (ud.spot) ud.spot.intensity = night.spot;
      }
      dashes.forEach((d) => (d.material.opacity = 0.6 * Math.max(0, 1 - Math.pow(Math.abs(d.position.x) / 9, 4))));

      renderer.render(scene, camera);
      updateHotspots(dt);
      if (firstFrame) { firstFrame = false; loadingEl.classList.add('is-done'); }
      rafId = requestAnimationFrame(frame);
    }

    resize();
    rafId = requestAnimationFrame(frame);

    return { show, set };
  }
})();
