/* ================================================
   AI 解忧小工具 · 核心交互逻辑
   ================================================ */
(function () {
  'use strict';

  // ========== 全局状态 ==========
  const state = {
    vibrateOn: JSON.parse(localStorage.getItem('relief.vibrate') ?? 'true'),
    reliefValue: parseInt(localStorage.getItem('relief.value') || '0', 10),
    favorites: JSON.parse(localStorage.getItem('relief.favs') || '[]'),
    currentTool: 'swab',
    currentScene: 'nebula',
    currentNoises: new Set(),
    volume: 0.6,
    timerId: null,
    breathHold: null,
    breathInterval: null,
  };

  // ========== 工具函数 ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function vibrate(pattern) {
    if (!state.vibrateOn) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function addRelief(v) {
    state.reliefValue += v;
    localStorage.setItem('relief.value', String(state.reliefValue));
    $('#progress-value').textContent = state.reliefValue;
  }

  function toast(msg, ms = 1800) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), ms);
  }

  // ========== 顶栏与 Tab ==========
  function initTopbar() {
    const vibBtn = $('#vibrate-toggle');
    vibBtn.setAttribute('aria-pressed', String(state.vibrateOn));
    vibBtn.addEventListener('click', () => {
      state.vibrateOn = !state.vibrateOn;
      vibBtn.setAttribute('aria-pressed', String(state.vibrateOn));
      localStorage.setItem('relief.vibrate', JSON.stringify(state.vibrateOn));
      toast(state.vibrateOn ? '震动已开启' : '震动已关闭');
    });
    $('#progress-value').textContent = state.reliefValue;
  }

  function initTabs() {
    $$('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        $$('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        $$('.module').forEach((m) => m.classList.toggle('module-active', m.id === target));
        // 切换到非放空模块时不影响白噪音（保持后台）
        // 切离掏耳/漂流瓶：立即停止其音效
        if (target !== 'mod-ear') stopEarSound();
        if (target !== 'mod-bottle') stopSeaSound();
        if (target === 'mod-bottle') startSeaSound();
      });
    });
  }

  // ========== Web Audio 引擎 ==========
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // ---- 采耳 ASMR ----
  const earSound = { swab: null, scoop: null, brush: null, master: null };
  function stopEarSound() {
    if (earSound.master) {
      try { earSound.master.gain.setValueAtTime(0, audioCtx.currentTime); } catch (e) {}
    }
  }
  function playEarSound(tool) {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    if (!earSound.master) {
      earSound.master = ctx.createGain();
      earSound.master.gain.value = 0;
      earSound.master.connect(ctx.destination);
    }
    // 每次触发生成一个短促噪音块
    const dur = tool === 'scoop' ? 0.18 : tool === 'brush' ? 0.35 : 0.25;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // 白噪 + 采耳 shhh 感 —— 高频衰减
      const t = i / data.length;
      const envelope = Math.sin(Math.PI * t) ** 0.6;
      data[i] = (Math.random() * 2 - 1) * envelope * 0.9;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    if (tool === 'swab') { filter.frequency.value = 4200; filter.Q.value = 0.6; }
    else if (tool === 'scoop') { filter.frequency.value = 5800; filter.Q.value = 2.4; }
    else { filter.frequency.value = 2800; filter.Q.value = 0.4; }
    const g = ctx.createGain();
    g.gain.value = tool === 'scoop' ? 0.35 : tool === 'brush' ? 0.22 : 0.28;
    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  // ---- 海浪 ----
  let seaSource = null, seaGain = null;
  function startSeaSound() {
    const ctx = ensureAudio();
    if (seaSource) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // 粉红噪音近似
    let b0=0,b1=0,b2=0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.06;
    }
    seaSource = ctx.createBufferSource();
    seaSource.buffer = buf; seaSource.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 800;
    seaGain = ctx.createGain(); seaGain.gain.value = 0.25;
    // LFO 模拟浪拍
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15; lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain); lfoGain.connect(seaGain.gain);
    lfo.start();
    seaSource.connect(filter); filter.connect(seaGain); seaGain.connect(ctx.destination);
    seaSource.start();
  }
  function stopSeaSound() {
    if (seaSource) { try { seaSource.stop(); } catch(e){} seaSource.disconnect(); seaSource = null; }
    if (seaGain) { seaGain.disconnect(); seaGain = null; }
  }

  // ---- 白噪音（多路混合） ----
  const noiseNodes = {}; // key -> {src, gain, extras[]}
  function createNoise(kind) {
    const ctx = ensureAudio();
    const dur = 4;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0=0,b1=0,b2=0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765*b0 + w*0.0990460; b1 = 0.96300*b1 + w*0.2965164; b2 = 0.57000*b2 + w*1.0526913;
      data[i] = (b0+b1+b2+w*0.1848)*0.06;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain(); g.gain.value = state.volume * 0.5;
    const extras = [];

    if (kind === 'rain') { filter.type='highpass'; filter.frequency.value=1800; g.gain.value=state.volume*0.35; }
    else if (kind === 'fire') {
      filter.type='lowpass'; filter.frequency.value=600;
      g.gain.value=state.volume*0.4;
      // 加入随机噼啪
      const crackleGain = ctx.createGain(); crackleGain.gain.value = 0;
      crackleGain.connect(ctx.destination);
      const crackleTimer = setInterval(() => {
        const now = ctx.currentTime;
        const b = ctx.createBuffer(1, ctx.sampleRate*0.05, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.01));
        const s = ctx.createBufferSource(); s.buffer=b;
        const cg = ctx.createGain(); cg.gain.value = state.volume * (0.15 + Math.random()*0.2);
        s.connect(cg); cg.connect(ctx.destination); s.start(now);
      }, 350);
      extras.push({ interval: crackleTimer, node: crackleGain });
    }
    else if (kind === 'wind') { filter.type='bandpass'; filter.frequency.value=500; filter.Q.value=0.6; g.gain.value=state.volume*0.4; }
    else if (kind === 'stream') { filter.type='highpass'; filter.frequency.value=1200; g.gain.value=state.volume*0.4; }
    else if (kind === 'white') { filter.type='allpass'; filter.frequency.value=1000; g.gain.value=state.volume*0.3; }
    else if (kind === 'bug') {
      filter.type='bandpass'; filter.frequency.value=3800; filter.Q.value=6; g.gain.value=state.volume*0.25;
      // 添加短促 chirp
      const chirpTimer = setInterval(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator(); osc.type='triangle'; osc.frequency.value = 3600 + Math.random()*800;
        const og = ctx.createGain(); og.gain.value = 0;
        og.gain.setValueAtTime(0, now);
        og.gain.linearRampToValueAtTime(state.volume*0.15, now+0.02);
        og.gain.linearRampToValueAtTime(0, now+0.12);
        osc.connect(og); og.connect(ctx.destination);
        osc.start(now); osc.stop(now+0.15);
      }, 700 + Math.random()*400);
      extras.push({ interval: chirpTimer });
    }

    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    src.start();
    return { src, gain: g, extras };
  }
  function toggleNoise(kind) {
    if (noiseNodes[kind]) {
      try { noiseNodes[kind].src.stop(); } catch(e){}
      noiseNodes[kind].src.disconnect(); noiseNodes[kind].gain.disconnect();
      (noiseNodes[kind].extras||[]).forEach(x => { if(x.interval) clearInterval(x.interval); if(x.node) x.node.disconnect(); });
      delete noiseNodes[kind];
      state.currentNoises.delete(kind);
      return false;
    } else {
      // 允许最多 2 路混合
      if (state.currentNoises.size >= 2) {
        const first = state.currentNoises.values().next().value;
        toggleNoise(first);
      }
      noiseNodes[kind] = createNoise(kind);
      state.currentNoises.add(kind);
      return true;
    }
  }
  function updateNoiseVolume() {
    Object.values(noiseNodes).forEach(n => {
      if (n.gain) n.gain.gain.value = state.volume * 0.4;
    });
  }

  // ========== 模块1：掏耳朵 ==========
  const ear = {
    canvas: null, ctx: null,
    dust: [],
    floaters: [],
    completed: false,
    pointer: null,           // 当前指针位置 {x,y}
    active: false,           // 是否按下
    lastMoveTs: 0,
    rafId: null,
  };

  function initEar() {
    ear.canvas = $('#ear-canvas');
    ear.ctx = ear.canvas.getContext('2d');
    resetEar();
    startEarLoop();

    // 工具切换
    $$('.tool-btn[data-tool]').forEach((b) => {
      b.addEventListener('click', () => {
        $$('.tool-btn[data-tool]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.currentTool = b.dataset.tool;
      });
    });
    $('#ear-reset').addEventListener('click', () => {
      resetEar();
      if (ear._markDirty) ear._markDirty();
    });

    // 指针交互
    let last = null;
    const onDown = (e) => {
      last = getPos(e); ear.active = true; ear.pointer = last;
      e.preventDefault();
    };
    const onMove = (e) => {
      const p = getPos(e); if (!p) return;
      ear.pointer = p;
      if (ear.active && last) handleEarSweep(last, p);
      last = p;
      e.preventDefault();
    };
    const onUp = () => { last = null; ear.active = false; };
    const onLeave = () => { ear.pointer = null; };
    ear.canvas.addEventListener('pointerdown', onDown);
    ear.canvas.addEventListener('pointermove', onMove);
    ear.canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerup', onUp);

    function getPos(e) {
      const rect = ear.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (ear.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (ear.canvas.height / rect.height);
      return { x, y };
    }
  }

  function resetEar() {
    ear.dust = [];
    ear.floaters = [];
    ear.completed = false;
    const W = ear.canvas.width, H = ear.canvas.height;
    // 耳道口位置（画面中心偏右下）
    const cx = W * 0.52, cy = H * 0.52;
    const N = 48;
    // 只在耳道深色区域内生成小碎片
    let i = 0, guard = 0;
    while (i < N && guard < 400) {
      guard++;
      // 椭圆区域内随机
      const t = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * 100;
      const px = cx + Math.cos(t) * rr * 0.75;
      const py = cy + Math.sin(t) * rr * 1.0 - 6;
      // 排除靠中心太深的黑洞（那里视为耳道深处）
      const distCenter = Math.hypot(px - cx, (py - cy + 6) / 1.3);
      if (distCenter < 25) continue;
      const isBig = Math.random() > 0.72;
      ear.dust.push({
        x: px, y: py,
        r: isBig ? 6 + Math.random() * 6 : 2 + Math.random() * 4,
        cleared: false, big: isBig,
        hue: 30 + Math.random() * 15,
        rot: Math.random() * Math.PI,
      });
      i++;
    }
    $('#ear-glow').classList.add('hidden');
    $('#ear-tip').classList.add('hidden');
    updateEarProgress();
  }

  function handleEarSweep(p1, p2) {
    const tool = state.currentTool;
    const radius = tool === 'brush' ? 55 : tool === 'scoop' ? 22 : 32;
    let hit = false;
    for (const d of ear.dust) {
      if (d.cleared) continue;
      const dx = d.x - p2.x, dy = d.y - p2.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < radius) {
        if (tool === 'scoop' && !d.big) continue;
        d.cleared = true;
        ear.floaters.push({ x: d.x, y: d.y, r: d.r, life: 1, vx: (Math.random()-0.5)*0.5, vy: -0.6 - Math.random()*0.8 });
        hit = true;
      }
    }
    if (hit) {
      playEarSound(tool);
      if (tool === 'scoop') vibrate(35);
      else if (tool === 'swab') vibrate(12);
      else vibrate([8, 8, 8]);
      addRelief(1);
    }
    updateEarProgress();
  }

  function updateEarProgress() {
    const total = ear.dust.length;
    const cleared = ear.dust.filter(d => d.cleared).length;
    const pct = total ? Math.round(cleared * 100 / total) : 0;
    $('#ear-progress-fill').style.width = pct + '%';
    $('#ear-progress-text').textContent = pct + '%';
    if (pct >= 96 && !ear.completed) {
      ear.completed = true;
      $('#ear-glow').classList.remove('hidden');
      $('#ear-tip').classList.remove('hidden');
      addRelief(8);
    }
  }

  function renderEar() {
    const c = ear.ctx;
    const W = ear.canvas.width, H = ear.canvas.height;
    c.clearRect(0, 0, W, H);

    // ---- 精细耳朵：仰视视角，突出耳道 ----
    const cx = W * 0.52, cy = H * 0.52;

    // 皮肤底色（画布整体柔光）
    const skinBg = c.createRadialGradient(cx, cy, 20, cx, cy, W * 0.7);
    skinBg.addColorStop(0, '#f8dfc0');
    skinBg.addColorStop(0.55, '#f0c99f');
    skinBg.addColorStop(1, '#d8a373');
    c.fillStyle = skinBg;
    c.fillRect(0, 0, W, H);

    // ---- 外耳廓（helix）：像蜷曲的耳形 ----
    c.save();
    c.translate(cx, cy);

    // 耳背阴影
    c.beginPath();
    c.ellipse(-6, 4, 195, 235, -0.05, 0, Math.PI * 2);
    c.fillStyle = 'rgba(140,80,45,0.18)';
    c.fill();

    // 耳廓主体（helix + antihelix 的三层描边）
    c.beginPath();
    c.ellipse(0, 0, 175, 218, -0.05, 0, Math.PI * 2);
    const helixGrad = c.createLinearGradient(-160, -160, 160, 200);
    helixGrad.addColorStop(0, '#fbe4c5');
    helixGrad.addColorStop(0.6, '#ecc094');
    helixGrad.addColorStop(1, '#c68a5a');
    c.fillStyle = helixGrad;
    c.fill();

    // 内耳廓（antihelix）—— 中间那一圈突起
    c.beginPath();
    c.ellipse(-4, 6, 128, 168, -0.04, 0, Math.PI * 2);
    const ahGrad = c.createRadialGradient(-20, -30, 20, -4, 6, 170);
    ahGrad.addColorStop(0, '#f4d0a8');
    ahGrad.addColorStop(0.6, '#d8a978');
    ahGrad.addColorStop(1, '#a97246');
    c.fillStyle = ahGrad;
    c.fill();

    // antihelix 高光边
    c.beginPath();
    c.ellipse(-18, -30, 100, 130, -0.04, Math.PI * 0.85, Math.PI * 1.9);
    c.strokeStyle = 'rgba(255,240,220,0.5)';
    c.lineWidth = 2.5;
    c.stroke();

    // 耳屏（tragus）小凸起（左侧）
    c.beginPath();
    c.moveTo(-92, 30);
    c.quadraticCurveTo(-118, 20, -108, 68);
    c.quadraticCurveTo(-95, 74, -85, 58);
    c.closePath();
    const tragusGrad = c.createLinearGradient(-110, 20, -85, 70);
    tragusGrad.addColorStop(0, '#e8b98a');
    tragusGrad.addColorStop(1, '#a56c40');
    c.fillStyle = tragusGrad;
    c.fill();

    // 耳垂
    c.beginPath();
    c.ellipse(-20, 190, 60, 42, 0.15, 0, Math.PI * 2);
    const lobe = c.createRadialGradient(-30, 175, 8, -20, 190, 60);
    lobe.addColorStop(0, '#f4cba2');
    lobe.addColorStop(1, '#c88a5c');
    c.fillStyle = lobe;
    c.fill();

    // ---- 耳道（重点） ----
    // 耳道口椭圆凹陷
    c.beginPath();
    c.ellipse(-2, 20, 78, 108, -0.02, 0, Math.PI * 2);
    const canalOuter = c.createRadialGradient(-8, 8, 6, -2, 20, 110);
    canalOuter.addColorStop(0, '#f0c091');
    canalOuter.addColorStop(0.35, '#b17646');
    canalOuter.addColorStop(0.75, '#6d3f22');
    canalOuter.addColorStop(1, '#3a1e10');
    c.fillStyle = canalOuter;
    c.fill();

    // 耳道深处（真正的黑洞）
    c.beginPath();
    c.ellipse(0, 26, 34, 58, -0.02, 0, Math.PI * 2);
    const deepGrad = c.createRadialGradient(0, 20, 4, 0, 26, 60);
    deepGrad.addColorStop(0, '#1a0d06');
    deepGrad.addColorStop(0.6, '#2d180c');
    deepGrad.addColorStop(1, '#5a3520');
    c.fillStyle = deepGrad;
    c.fill();

    // 耳道口高光弧线
    c.beginPath();
    c.ellipse(-2, 20, 78, 108, -0.02, Math.PI * 1.15, Math.PI * 1.85);
    c.strokeStyle = 'rgba(255,240,215,0.5)';
    c.lineWidth = 2;
    c.stroke();

    c.restore();

    // ---- 耳垢 ----
    for (const d of ear.dust) {
      if (d.cleared) continue;
      c.save();
      c.translate(d.x, d.y);
      c.rotate(d.rot);
      c.beginPath();
      c.ellipse(0, 0, d.r * 1.15, d.r * 0.9, 0, 0, Math.PI * 2);
      const g = c.createRadialGradient(-d.r * 0.35, -d.r * 0.35, 1, 0, 0, d.r * 1.2);
      if (d.big) {
        g.addColorStop(0, '#e8c48a');
        g.addColorStop(0.5, '#a6763f');
        g.addColorStop(1, '#4a2c18');
      } else {
        g.addColorStop(0, '#c9a06a');
        g.addColorStop(1, '#5a3820');
      }
      c.fillStyle = g;
      c.fill();
      // 反光小点
      c.beginPath();
      c.arc(-d.r * 0.4, -d.r * 0.4, d.r * 0.22, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,240,210,0.35)';
      c.fill();
      c.restore();
    }

    // ---- 飘散光点 ----
    for (let i = ear.floaters.length - 1; i >= 0; i--) {
      const f = ear.floaters[i];
      f.life -= 0.02;
      f.y += f.vy;
      f.x += f.vx;
      f.vy *= 0.98;
      if (f.life <= 0) { ear.floaters.splice(i, 1); continue; }
      c.beginPath();
      c.arc(f.x, f.y, f.r * (0.6 + f.life * 0.9), 0, Math.PI * 2);
      const alpha = f.life * 0.75;
      c.fillStyle = `rgba(240, 220, 180, ${alpha})`;
      c.shadowColor = 'rgba(255,235,190,0.6)';
      c.shadowBlur = 8;
      c.fill();
      c.shadowBlur = 0;
    }

    // ---- 工具跟随指针 ----
    if (ear.pointer) drawTool(c, ear.pointer.x, ear.pointer.y, state.currentTool, ear.active);
  }

  function drawTool(c, x, y, tool, pressed) {
    c.save();
    c.translate(x, y);
    // 略微倾斜
    c.rotate(-0.55);

    if (tool === 'swab') {
      // 棉签：白色长杆 + 顶端棉球
      const len = 130;
      // 阴影
      c.save();
      c.translate(4, 4);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(-2, 0, 4, len);
      c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
      c.restore();
      // 杆
      const stick = c.createLinearGradient(-3, 0, 3, 0);
      stick.addColorStop(0, '#f5efe3');
      stick.addColorStop(0.5, '#ffffff');
      stick.addColorStop(1, '#d8cfbf');
      c.fillStyle = stick;
      c.fillRect(-2, 0, 4, len);
      // 棉球（拾取端）
      const cotton = c.createRadialGradient(-4, -4, 2, 0, 0, 14);
      cotton.addColorStop(0, '#ffffff');
      cotton.addColorStop(1, '#e6dcc9');
      c.fillStyle = cotton;
      c.beginPath();
      c.ellipse(0, 0, 13, 15, 0, 0, Math.PI * 2);
      c.fill();
      // 蓬松感
      c.strokeStyle = 'rgba(180,160,130,0.25)';
      c.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        c.beginPath();
        c.moveTo(Math.cos(a) * 10, Math.sin(a) * 12);
        c.lineTo(Math.cos(a) * 13, Math.sin(a) * 15);
        c.stroke();
      }
    } else if (tool === 'scoop') {
      // 金属耳勺：细杆 + 前端小勺
      const len = 140;
      c.save();
      c.translate(4, 4);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(-1.5, 0, 3, len);
      c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill();
      c.restore();
      // 杆
      const metal = c.createLinearGradient(-2, 0, 2, 0);
      metal.addColorStop(0, '#8a8f97');
      metal.addColorStop(0.5, '#dfe4ea');
      metal.addColorStop(1, '#6c7079');
      c.fillStyle = metal;
      c.fillRect(-1.5, 0, 3, len);
      // 勺头（前端）
      const head = c.createRadialGradient(-2, -2, 1, 0, 0, 10);
      head.addColorStop(0, '#f5f6f8');
      head.addColorStop(1, '#7a7f88');
      c.fillStyle = head;
      c.beginPath();
      c.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
      c.fill();
      // 勺凹陷
      c.beginPath();
      c.ellipse(0, 1, 6, 4, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(30,35,45,0.35)';
      c.fill();
      // 高光
      c.beginPath();
      c.arc(-3, -2, 2, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fill();
    } else {
      // 软毛刷：粗杆 + 前端毛刷散开
      const len = 110;
      c.save();
      c.translate(4, 4);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(-4, 0, 8, len);
      c.restore();
      // 木质杆
      const wood = c.createLinearGradient(-4, 0, 4, 0);
      wood.addColorStop(0, '#8f6540');
      wood.addColorStop(0.5, '#c99367');
      wood.addColorStop(1, '#7d5533');
      c.fillStyle = wood;
      c.fillRect(-4, 4, 8, len - 4);
      // 金属箍
      c.fillStyle = '#c9b98a';
      c.fillRect(-5, 2, 10, 6);
      // 毛刷
      c.strokeStyle = 'rgba(60,45,30,0.85)';
      c.lineWidth = 1.5;
      c.lineCap = 'round';
      const bristles = 22;
      for (let i = 0; i < bristles; i++) {
        const spread = (i / (bristles - 1) - 0.5) * 26;
        const yOff = -18 - Math.random() * 6;
        c.beginPath();
        c.moveTo(spread * 0.3, 0);
        // 按压时毛尖散开更大
        const flare = pressed ? 1.6 : 1;
        c.quadraticCurveTo(spread * 0.8, yOff * 0.5, spread * flare, yOff);
        c.stroke();
      }
      // 毛尖淡黄提亮
      c.strokeStyle = 'rgba(230,200,150,0.5)';
      c.lineWidth = 1;
      for (let i = 0; i < bristles; i += 2) {
        const spread = (i / (bristles - 1) - 0.5) * 26;
        const flare = pressed ? 1.6 : 1;
        c.beginPath();
        c.moveTo(spread * 0.8, -12);
        c.lineTo(spread * flare, -24);
        c.stroke();
      }
    }

    c.restore();
  }

  function startEarLoop() {
    let dirty = true;
    ear._markDirty = () => { dirty = true; };
    const tick = () => {
      if ($('#mod-ear').classList.contains('module-active')) {
        const need = dirty || ear.floaters.length > 0 || ear.pointer;
        if (need) {
          renderEar();
          // 只要还有粒子/指针就继续；否则本次渲染后进入等待
          dirty = ear.floaters.length > 0 || !!ear.pointer;
        }
      }
      ear.rafId = requestAnimationFrame(tick);
    };
    if (!ear.rafId) tick();
  }

  // ========== 模块2：漂流瓶 ==========
  const LETTERS = [
    // 松弛释怀 20
    '人生缓缓，自有答案，不必急着强求结果',
    '允许自己迷茫，接纳所有不完美的当下',
    '山林不向四季起誓，荣枯随缘，万事放宽心',
    '所得所不得，都不如心安理得',
    '把执念交给海风，不必紧抓不属于自己的人和事',
    '心宽一寸，烦忧便退一丈',
    '万般过往皆作清风，放下后步步从容',
    '不必逼自己事事圆满，尽力就足够',
    '人要往前走，烦恼才会慢慢往后退',
    '风雨是常态，自愈是独属于你的本事',
    '不必反复内耗，当下的平静最为珍贵',
    '看淡得失，平常心便能渡万般琐事',
    '困住你的从来不是事情，是不肯释怀的自己',
    '偶尔慢下来，不用一直追赶所有人',
    '无力掌控的事，就交给时间慢慢淡化',
    '不必事事解释，懂你的人自然明白',
    '深夜的情绪终会消散，天亮又是崭新的一天',
    '不纠结遗憾，不焦虑未来，专注此刻就好',
    '凡事看淡，少一分计较，多一分轻松',
    '所有为时已晚，其实都是恰逢其时',
    // 小确幸治愈 20
    '今天会偶遇一件不起眼的温柔小事',
    '今夜能拥有安稳无梦的好觉',
    '晚风、落日、烟火，生活藏着细碎温柔',
    '你只管好好生活，美好会慢慢奔赴你',
    '天空越黑，越能看见漫天星光',
    '一口热饮、一阵晚风，都能治愈疲惫',
    '沿途风光自有惊喜，不必急于抵达终点',
    '今天会有轻松自在、不用忙碌的片刻',
    '平凡日常里，藏着独属于你的小欢喜',
    '抬头看看云，坏心情会随风吹散',
    '往后的日子，轻松顺遂，少些疲惫',
    '会有温柔的小事，悄悄抚平你的不安',
    '三餐烟火安稳，便是最好的馈赠',
    '不必耀眼，安稳舒服地活着就很好',
    '今日烦恼随风入海，只剩轻松相伴',
    '你身上自带微光，不用借别人的光亮',
    '傍晚的微风，会带走一整天的压抑',
    '接下来会有一段松弛自在的时光',
    '好好善待自己，所有温柔都会向你靠拢',
    '山海辽阔，总有一处让你心安',
  ];

  const bottleSVG = (color) => `
    <svg viewBox="0 0 46 62" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg${color}" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${color}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <path d="M18 4 h10 v8 c3 2 5 5 5 10 v32 c0 4 -3 6 -6 6 h-8 c-3 0 -6 -2 -6 -6 v-32 c0 -5 2 -8 5 -10 z"
        fill="url(#bg${color})" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
      <ellipse cx="23" cy="4" rx="5" ry="2" fill="#8a6a44"/>
      <rect x="18" y="35" width="10" height="6" fill="#fbf6eb" opacity="0.9"/>
    </svg>`;

  function initBottle() {
    spawnBottles(6);
    $('#open-fav').addEventListener('click', openFav);
    $('#fav-close').addEventListener('click', () => $('#fav-panel').classList.add('hidden'));
    $('#btn-fav-letter').addEventListener('click', favCurrentLetter);
    $('#btn-release').addEventListener('click', releaseLetter);
    renderFavCount();
  }

  const bottleColors = ['%2393b4c1','%23b7c9d4','%23d4a97a','%23b19cd9','%238fa899'];
  let currentLetter = '';

  function spawnBottles(count) {
    const field = $('#bottle-field');
    field.innerHTML = '';
    for (let i = 0; i < count; i++) {
      spawnOneBottle();
    }
  }
  function spawnOneBottle() {
    const field = $('#bottle-field');
    const el = document.createElement('div');
    el.className = 'bottle';
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (52 + Math.random() * 30) + '%';
    el.style.animationDelay = (Math.random() * 4) + 's';
    el.style.animationDuration = (4 + Math.random() * 3) + 's';
    const color = ['#93b4c1','#b7c9d4','#d4a97a','#b19cd9','#8fa899'][Math.floor(Math.random()*5)];
    el.innerHTML = bottleSVG(color).replace(/g id="bg[^"]+"/, `g id="bg${color.replace('#','')}"`);
    el.addEventListener('click', () => openBottle(el));
    field.appendChild(el);
  }

  function openBottle(el) {
    vibrate([20, 40, 20]);
    el.style.animation = 'none';
    el.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    el.style.transform = 'translate(-50%, -50%) scale(1.4)';
    el.style.left = '50%'; el.style.top = '50%';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);

    currentLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    $('#letter-text').textContent = currentLetter;
    $('#letter-overlay').classList.remove('hidden');
    addRelief(3);
  }

  function favCurrentLetter() {
    if (!currentLetter) return;
    if (!state.favorites.includes(currentLetter)) {
      state.favorites.push(currentLetter);
      localStorage.setItem('relief.favs', JSON.stringify(state.favorites));
      renderFavCount();
      addRelief(2);
      toast('已收藏进你的信纸盒 ✧');
    } else {
      toast('这封信已经在收藏里啦');
    }
  }

  function releaseLetter() {
    $('#letter-overlay').classList.add('hidden');
    currentLetter = '';
    spawnOneBottle();
  }

  function renderFavCount() {
    $('#fav-count').textContent = state.favorites.length;
  }

  function openFav() {
    const panel = $('#fav-panel');
    const list = $('#fav-list');
    list.innerHTML = '';
    if (state.favorites.length === 0) {
      list.innerHTML = '<div class="fav-empty">还没有收藏的信纸<br>去海面上捡一封吧</div>';
    } else {
      state.favorites.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = 'fav-item';
        item.innerHTML = `<span>${t}</span><button data-i="${i}" aria-label="删除">×</button>`;
        item.querySelector('button').addEventListener('click', () => {
          state.favorites.splice(i, 1);
          localStorage.setItem('relief.favs', JSON.stringify(state.favorites));
          renderFavCount(); openFav();
        });
        list.appendChild(item);
      });
    }
    panel.classList.remove('hidden');
  }

  // ========== 模块3：放空专区 ==========
  function initVoid() {
    const stage = $('#void-stage');

    // 单击切换场景
    let pressT = 0;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#breath-guide') || e.target.closest('.breath-guide')) return;
      pressT = Date.now();
      state.breathHold = setTimeout(() => { startBreath(); state.breathHold = null; }, 3000);
    });
    stage.addEventListener('pointerup', (e) => {
      const dur = Date.now() - pressT;
      if (state.breathHold) { clearTimeout(state.breathHold); state.breathHold = null; }
      if (dur < 500 && !$('#breath-guide').classList.contains('hidden') === false) {
        // 短按且未进入引导
        cycleScene();
      }
    });
    stage.addEventListener('pointerleave', () => {
      if (state.breathHold) { clearTimeout(state.breathHold); state.breathHold = null; }
    });

    $('#breath-stop').addEventListener('click', stopBreath);

    // 白噪音按钮
    $$('.noise-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const active = toggleNoise(btn.dataset.noise);
        btn.classList.toggle('active', active);
        // 挂机也累计
        if (active) addRelief(2);
      });
    });

    // 音量
    const vol = $('#volume-slider');
    vol.addEventListener('input', () => {
      state.volume = vol.value / 100;
      updateNoiseVolume();
    });

    // 定时
    $$('.timer-btn').forEach(b => {
      b.addEventListener('click', () => {
        $$('.timer-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        if (state.timerId) { clearTimeout(state.timerId); state.timerId = null; }
        const m = parseInt(b.dataset.min, 10);
        if (m > 0) {
          state.timerId = setTimeout(() => {
            Object.keys(noiseNodes).forEach(k => toggleNoise(k));
            $$('.noise-btn').forEach(x => x.classList.remove('active'));
            toast('定时结束，白噪音已关闭');
          }, m * 60000);
          toast(`${m} 分钟后自动关闭`);
        }
      });
    });

    // 护眼模式
    const eye = $('#eye-care-toggle');
    eye.addEventListener('click', () => {
      const pressed = eye.getAttribute('aria-pressed') === 'true';
      eye.setAttribute('aria-pressed', String(!pressed));
      document.body.classList.toggle('eye-care', !pressed);
    });

    // 挂机累计（每 30 秒 +1）
    setInterval(() => {
      const active = $('#mod-void').classList.contains('module-active');
      if (active) addRelief(1);
    }, 30000);
  }

  function cycleScene() {
    const scenes = ['nebula','beach','forest'];
    const idx = scenes.indexOf(state.currentScene);
    const next = scenes[(idx + 1) % scenes.length];
    state.currentScene = next;
    $$('.scene').forEach(s => s.classList.toggle('active', s.dataset.scene === next));
  }

  function startBreath() {
    const guide = $('#breath-guide');
    guide.classList.remove('hidden');
    let phase = 0; // 0 in, 1 out
    const txt = $('#breath-text');
    txt.textContent = '吸 气';
    // 4s 吸，6s 呼
    const cycle = () => {
      phase = 1 - phase;
      txt.textContent = phase === 0 ? '吸 气' : '呼 气';
    };
    // 首个 4s 吸后开始交替
    state.breathInterval = setTimeout(function loop() {
      cycle();
      state.breathInterval = setTimeout(function loop2() {
        cycle();
        state.breathInterval = setTimeout(loop, 4000);
      }, 6000);
    }, 4000);
    vibrate([30, 60, 30]);
  }
  function stopBreath() {
    $('#breath-guide').classList.add('hidden');
    if (state.breathInterval) clearTimeout(state.breathInterval);
    state.breathInterval = null;
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', () => {
    initTopbar();
    initTabs();
    initEar();
    initBottle();
    initVoid();
  });

  // 首次交互后解锁 AudioContext
  const unlock = () => { ensureAudio(); document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock);
})();
