/* Molecule builders shared by the AR page and the no-camera viewer (A-Frame) */
(function () {
  const COLORS = { H: '#f5f5f5', O: '#e02424', Na: '#8b3fd9', Cl: '#3cb043' };
  const RAD = { H: 0.07, O: 0.11, Na: 0.09, Cl: 0.13 };

  function v(x, y, z) { return { x, y, z }; }

  function atom(parent, el, pos, scale) {
    const s = scale || 1;
    const e = document.createElement('a-sphere');
    e.setAttribute('radius', RAD[el] * s);
    e.setAttribute('color', COLORS[el]);
    e.setAttribute('segments-width', 24);
    e.setAttribute('segments-height', 16);
    e.setAttribute('material', 'roughness: 0.35; metalness: 0.05');
    e.setAttribute('position', pos);
    e.dataset.el = el;
    parent.appendChild(e);
    return e;
  }

  // cylinder between two points (in parent space)
  function bond(parent, a, b, r, offset) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const e = document.createElement('a-cylinder');
    e.setAttribute('radius', r || 0.02);
    e.setAttribute('height', len);
    e.setAttribute('color', '#9aa4b2');
    const mid = v((a.x + b.x) / 2 + (offset ? offset.x : 0), (a.y + b.y) / 2 + (offset ? offset.y : 0), (a.z + b.z) / 2);
    e.setAttribute('position', mid);
    // default cylinder axis = Y ; rotate to direction
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const eu = new THREE.Euler().setFromQuaternion(q);
    e.setAttribute('rotation', { x: THREE.MathUtils.radToDeg(eu.x), y: THREE.MathUtils.radToDeg(eu.y), z: THREE.MathUtils.radToDeg(eu.z) });
    parent.appendChild(e);
    return e;
  }

  function spinner(parent, speed) {
    const g = document.createElement('a-entity');
    g.setAttribute('animation__spin', `property: rotation; to: 0 360 0; loop: true; dur: ${speed || 9000}; easing: linear`);
    parent.appendChild(g);
    return g;
  }

  function diatomic(parent, el, double) {
    const g = spinner(parent);
    const d = RAD[el] * 1.7;
    const a = v(-d / 2, 0, 0), b = v(d / 2, 0, 0);
    if (double) {
      bond(g, a, b, 0.016, v(0, 0.03, 0));
      bond(g, a, b, 0.016, v(0, -0.03, 0));
    } else bond(g, a, b, 0.022);
    atom(g, el, a); atom(g, el, b);
    return g;
  }

  // ---- water with electrolysis animation ----
  function water(parent) {
    const root = document.createElement('a-entity');
    parent.appendChild(root);
    const spin = spinner(root, 12000);
    const single = document.createElement('a-entity');
    spin.appendChild(single);
    const ang = 104.5 / 2 * Math.PI / 180, L = 0.16;
    const O = v(0, 0.04, 0), H1 = v(-L * Math.sin(ang), 0.04 - L * Math.cos(ang), 0), H2 = v(L * Math.sin(ang), 0.04 - L * Math.cos(ang), 0);
    bond(single, O, H1); bond(single, O, H2);
    atom(single, 'O', O); atom(single, 'H', H1); atom(single, 'H', H2);

    const stage = document.createElement('a-entity');
    stage.setAttribute('visible', false);
    stage.setAttribute('scale', '0.72 0.72 0.72');
    root.appendChild(stage);

    return {
      root, reset() {
        stage.setAttribute('visible', false);
        while (stage.firstChild) stage.removeChild(stage.firstChild);
        spin.setAttribute('visible', true);
      },
      electrolysis(onDone) {
        this.reset();
        spin.setAttribute('visible', false);
        stage.setAttribute('visible', true);
        const s = 0.85;
        const mk = (cx) => ({ O: v(cx, 0.06, 0), H1: v(cx - 0.11, -0.03, 0), H2: v(cx + 0.11, -0.03, 0) });
        const w1 = mk(-0.22), w2 = mk(0.22);
        const oldBonds = [bond(stage, w1.O, w1.H1), bond(stage, w1.O, w1.H2), bond(stage, w2.O, w2.H1), bond(stage, w2.O, w2.H2)];
        const atoms = {
          o1: atom(stage, 'O', w1.O, s), o2: atom(stage, 'O', w2.O, s),
          h1: atom(stage, 'H', w1.H1, s), h2: atom(stage, 'H', w1.H2, s),
          h3: atom(stage, 'H', w2.H1, s), h4: atom(stage, 'H', w2.H2, s)
        };
        // lightning flash
        const bolt = document.createElement('a-entity');
        bolt.setAttribute('geometry', 'primitive: plane; width: 0.9; height: 0.6');
        bolt.setAttribute('material', 'color: #ffe14d; transparent: true; opacity: 0; shader: flat; side: double');
        bolt.setAttribute('position', '0 0 -0.05');
        bolt.setAttribute('animation__f', 'property: material.opacity; from: 0.0; to: 0.55; dir: alternate; loop: 4; dur: 160; delay: 900');
        stage.appendChild(bolt);
        const target = {
          h1: v(-0.38, 0.17, 0), h2: v(-0.24, 0.17, 0),
          h3: v(-0.38, -0.13, 0), h4: v(-0.24, -0.13, 0),
          o1: v(0.18, 0.02, 0), o2: v(0.36, 0.02, 0)
        };
        setTimeout(() => oldBonds.forEach(b => b.setAttribute('visible', false)), 1600);
        Object.keys(atoms).forEach(k => {
          const p = target[k];
          atoms[k].setAttribute('animation__mv', `property: position; to: ${p.x} ${p.y} ${p.z}; dur: 1400; delay: 1700; easing: easeInOutCubic`);
        });
        setTimeout(() => {
          bond(stage, target.h1, target.h2, 0.018); bond(stage, target.h3, target.h4, 0.018);
          bond(stage, target.o1, target.o2, 0.014, v(0, 0.025, 0)); bond(stage, target.o1, target.o2, 0.014, v(0, -0.025, 0));
          if (onDone) onDone();
        }, 3250);
      }
    };
  }

  // ---- NaCl: ion pair <-> crystal lattice ----
  function nacl(parent) {
    const root = document.createElement('a-entity');
    parent.appendChild(root);
    const spin = spinner(root, 14000);
    const pair = document.createElement('a-entity');
    spin.appendChild(pair);
    atom(pair, 'Na', v(-0.11, 0, 0)); atom(pair, 'Cl', v(0.12, 0, 0));
    const lat = document.createElement('a-entity');
    lat.setAttribute('visible', false);
    lat.setAttribute('rotation', '20 0 10');
    lat.setAttribute('scale', '0.75 0.75 0.75');
    spin.appendChild(lat);
    const d = 0.13;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const el = ((i + j + k) & 1) ? 'Na' : 'Cl';
      atom(lat, el, v(i * d, j * d, k * d), 0.62);
    }
    return {
      root, showLattice(on) { lat.setAttribute('visible', on); pair.setAttribute('visible', !on); }
    };
  }

  window.MOL = { diatomic, water, nacl, atom, bond };
})();
