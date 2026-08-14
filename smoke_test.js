// 融合版冒烟测试：stub DOM + canvas，验证数据完整性、渲染循环、分享卡
const fs = require('fs');
const src = fs.readFileSync('_check.js', 'utf-8');

// ---- DOM stub ----
function makeEl(id) {
  const attrs = {};
  const el = {
    id, attrs, children: [], listeners: {}, style: { setProperty() {} }, dataset: {},
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k]; },
    addEventListener(ev, fn) { this.listeners[ev] = fn; },
    appendChild(c) { this.children.push(c); },
    removeChild() {},
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html || ''; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 300 }; },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    closest() { return null; },
    offsetWidth: 100,
    querySelectorAll() { return []; },
    querySelector() { return null; },
  };
  return el;
}
const els = {};
function getEl(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; }

// canvas 2d context stub
function ctxStub() {
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return {};
      if (k === 'measureText') return () => ({ width: 10 });
      return () => {};
    },
    set() { return true; }
  });
}

const stageEl = getEl('viewer');
const svgEl = getEl('bot');
const canvasEl = { getContext: () => ctxStub(), toDataURL: () => 'data:image/png;base64,test', width: 1080, height: 1440 };

global.document = {
  getElementById(id) {
    if (id === 'share-canvas') return canvasEl;
    return getEl(id);
  },
  createElement(tag) {
    const el = makeEl(tag);
    if (tag === 'a') { el.click = () => {}; el.remove = () => {}; }
    return el;
  },
  createElementNS(ns, tag) { return makeEl(tag); },
  querySelector(sel) {
    if (sel === '#share-canvas') return canvasEl;
    if (sel === '#viewer') return stageEl;
    if (sel === '#bot') return svgEl;
    return getEl(sel.replace(/[#.]/g, ''));
  },
  querySelectorAll() { return []; },
  documentElement: { style: { setProperty() {} } },
  body: makeEl('body'),
};
global.window = { open() {} };
global.requestAnimationFrame = (fn) => { global.__raf = fn; return 1; };
global.performance = { now: () => global.__now || 0 };
global.navigator = {};
global.localStorage = { getItem: () => null, setItem: () => {} };
let timerCount = 0;
global.setTimeout = (fn) => { if (timerCount++ < 30) fn(); return timerCount; };
global.clearTimeout = () => {};
global.setInterval = () => 1;
global.clearInterval = () => {};
global.Path2D = class { closePath() {} moveTo() {} lineTo() {} };

// ---- 运行 ----
try { eval(src); } catch (e) { console.log('❌ 加载失败:', e.message); process.exit(1); }

// ---- 数据完整性 ----
const DATA = global.window.GROKBOT_ORIGINAL || global.GROKBOT_ORIGINAL;
if (!DATA) { console.log('❌ GROKBOT_ORIGINAL 数据未定义'); process.exit(1); }
console.log('表情数量:', DATA.EXPRESSIONS.length, DATA.EXPRESSIONS.length === 25 ? '✅' : '❌');
const states = Object.values(DATA.GROUPS).flat();
console.log('状态总数:', states.length, states.length === 39 ? '✅' : '❌');
console.log('状态分组:', Object.keys(DATA.GROUPS).length, '组');
console.log('POOLS 覆盖:', Object.keys(DATA.POOLS).length, '/', states.length, Object.keys(DATA.POOLS).length === states.length ? '✅' : '❌');
console.log('BLINK 覆盖:', Object.keys(DATA.BLINK).length, Object.keys(DATA.BLINK).length === states.length ? '✅' : '❌');
console.log('EXPR_CADENCE 覆盖:', Object.keys(DATA.EXPR_CADENCE).length, Object.keys(DATA.EXPR_CADENCE).length === states.length ? '✅' : '❌');

// 表情数据格式：每表情 = 2 ring，每 ring 点数一致
let pointOk = true;
const p0 = DATA.EXPRESSIONS[0][0].length;
for (let i = 0; i < 25; i++) {
  const e = DATA.EXPRESSIONS[i];
  if (e.length !== 2 || e[0].length !== p0 || e[1].length !== p0) pointOk = false;
}
console.log('表情数据格式（2 ring × 点数一致）:', pointOk ? '✅' : '❌');

// ---- 渲染循环 10 帧 ----
let frames = 0, errors = [];
global.__now = 0;
while (frames < 10 && global.__raf) {
  global.__now += 16.7;
  const fn = global.__raf; global.__raf = null;
  try { fn(global.__now); frames++; } catch (e) { errors.push(`frame ${frames}: ${e.message}`); break; }
}
console.log('渲染帧数:', frames, frames === 10 ? '✅' : '❌');

const eye0 = getEl('eye-0'), eye1 = getEl('eye-1');
const d0 = eye0.attrs.d || '', d1 = eye1.attrs.d || '';
console.log('眼睛路径:', d0.length, d1.length, (d0 && d1) ? '✅' : '❌');
console.log('NaN 检查:', /NaN|undefined|null/.test(d0 + d1) ? '❌ 有' : '✅ 无');
console.log('异常:', errors.length ? errors.join(';') : '✅ 无');

// ---- 分享卡渲染测试 ----
try {
  const createWork = getEl('create-work');
  createWork.listeners.click && createWork.listeners.click();
  const shareImg = getEl('share-image');
  console.log('分享卡生成:', shareImg.src && shareImg.src.startsWith('data:image/png') ? '✅' : '❌');
} catch (e) {
  console.log('分享卡测试异常:', e.message);
}

if (DATA.EXPRESSIONS.length !== 25 || states.length !== 39 || frames !== 10 || errors.length || !d0 || !d1) {
  console.log('❌ FAIL');
  process.exit(1);
}
console.log('🎉 融合版冒烟测试 PASS');
