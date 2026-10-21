import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Vector2,
  Vector4,
} from 'three';

const MAX_RIPPLES = 8;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_res;
  uniform vec4 u_ripples[${MAX_RIPPLES}];
  uniform float u_energy;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
  float ridge(vec2 p) {
    return 1.0 - abs(noise(p) * 2.0 - 1.0);
  }

  void main() {
    float aspect = u_res.x / u_res.y;
    vec2 uv = vec2(vUv.x * aspect, vUv.y);
    float t = u_time;

    // Ripples from the cursor
    float h = 0.0;
    vec2 push = vec2(0.0);
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = u_ripples[i];
      float age = t - r.z;
      if (age > 0.0 && age < 5.0) {
        vec2 c = vec2(r.x * aspect, r.y);
        vec2 d = uv - c;
        float dist = length(d);
        float band = dist - age * 0.32;
        float env = exp(-abs(band) * 9.0) * exp(-age * 0.85) * r.w;
        float w = cos(band * 55.0) * env;
        h += w;
        push += normalize(d + 1e-5) * w;
      }
    }
    vec2 p = uv + push * 0.035;

    // Light on the pool floor
    float flow = t * (0.05 + u_energy * 0.25);
    vec2 q = p * 3.2;
    vec2 warp = vec2(fbm(q + vec2(flow, 0.0)), fbm(q + vec2(5.2, flow * 0.8)));
    q += (warp - 0.5) * 1.8;
    float c1 = ridge(q * 1.1 + vec2(flow * 2.0, -flow));
    float c2 = ridge(q * 1.7 - vec2(flow * 1.5, flow * 1.2) + 3.1);
    float caustic = clamp(pow(c1 * c2, 7.0) * 3.0, 0.0, 1.0);

    vec3 deeper = vec3(0.008, 0.082, 0.125);
    vec3 deep = vec3(0.016, 0.125, 0.180);
    vec3 aqua = vec3(0.23, 0.89, 0.83);

    vec3 col = mix(deeper, deep, smoothstep(0.0, 1.0, vUv.y * 0.8 + fbm(p * 1.2) * 0.3));
    col += aqua * caustic * 0.46;
    col += aqua * 0.07 * smoothstep(0.4, 1.0, fbm(p * 2.0 + t * 0.04));
    col += vec3(0.8, 1.0, 1.0) * pow(clamp(h, 0.0, 1.0), 2.0) * 0.55;
    col -= 0.06 * clamp(-h, 0.0, 1.0);

    vec2 vc = vUv - 0.5;
    col *= 1.0 - dot(vc, vc) * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const noop = {
  ripple() {},
  addEnergy() {},
  setActive() {},
  supported: false,
};

export function createWater(canvas, { reduced = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
    return noop;
  }

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const ripples = Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, -100, 0));
  const uniforms = {
    u_time: { value: 0 },
    u_res: { value: new Vector2(1, 1) },
    u_ripples: { value: ripples },
    u_energy: { value: 0 },
  };
  const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms });
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));

  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  let index = 0;
  let energy = 0;
  let targetEnergy = 0;
  let active = true;
  let raf = 0;

  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    const size = renderer.getDrawingBufferSize(new Vector2());
    uniforms.u_res.value.copy(size);
    if (reduced) drawStatic();
  }

  function drawStatic() {
    uniforms.u_time.value = 3.0;
    renderer.render(scene, camera);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    energy += (targetEnergy - energy) * 0.06;
    targetEnergy *= 0.92;
    uniforms.u_time.value = now();
    uniforms.u_energy.value = energy;
    renderer.render(scene, camera);
  }

  function sync() {
    const shouldRun = active && !document.hidden && !reduced;
    if (shouldRun && !raf) frame();
    if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', sync);
  resize();
  sync();

  return {
    supported: true,
    ripple(x, y, strength = 1) {
      if (!active || reduced) return;
      ripples[index].set(x / window.innerWidth, 1 - y / window.innerHeight, now(), strength);
      index = (index + 1) % MAX_RIPPLES;
    },
    addEnergy(amount) {
      targetEnergy = Math.min(targetEnergy + amount, 1.5);
    },
    setActive(value) {
      active = value;
      sync();
      if (reduced && value) drawStatic();
    },
  };
}
