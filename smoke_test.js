// 运行时冒烟测试：stub DOM，跑 10 帧渲染循环（自动退出）
const fs = require('fs');
const src = fs.readFileSync('_check.js', 'utf-8');

function makeEl(id) {
  const attrs = {};
  const el = {
    id, attrs, children: [], listeners: {},
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k]; },
    addEventListener() {},
    appendChild() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 300 }; },
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
  };
  return el;
}
const els = {};
const getElementById = (id) => { if (!els[id]) els[id] = makeEl(id); return els[id]; };

const railEl = makeEl('exprRail');
const shapeEl = makeEl('shapeRow');
const stageEl = makeEl('stage');
const svgEl = makeEl('face');

global.document = {
  getElementById(id) {
    if (id === 'exprRail') return railEl;
    if (id === 'shapeRow') return shapeEl;
    if (id === 'stage') return stageEl;
    if (id === 'face') return svgEl;
    return getElementById(id);
  },
  createElement(tag) { return makeEl(tag); },
  createElementNS(ns, tag) { return makeEl(tag); },
  querySelector(sel) { return makeEl(sel); },
};
global.window = {};
global.requestAnimationFrame = (fn) => { global.__raf = fn; return 1; };
global.performance = { now: () => global.__now || 0 };
global.navigator = {};
global.localStorage = { getItem: () => null, setItem: () => {} };
// 让 setTimeout 立即执行但只跑一次，避免进程挂起
let timerCount = 0;
global.setTimeout = (fn, ms) => { if (timerCount++ < 5) { fn(); } return timerCount; };
global.clearTimeout = () => {};

try { eval(src); } catch (e) { console.log('❌ 加载失败:', e.message); process.exit(1); }

let frames = 0, errors = [];
global.__now = 0;
while (frames < 10 && global.__raf) {
  global.__now += 16.7;
  const fn = global.__raf;
  global.__raf = null;
  try { fn(global.__now); frames++; }
  catch (e) { errors.push(`frame ${frames}: ${e.message}`); break; }
}

const d = getElementById('bodyPath').attrs.d || '';
const ld = getElementById('leftEye').attrs.d || '';
const rd = getElementById('rightEye').attrs.d || '';
const nan = /NaN|undefined|null/.test(d + ld + rd);

console.log('帧数:', frames);
console.log('身体/左眼/右眼路径:', d.length, ld.length, rd.length, d && ld && rd ? 'OK' : '❌ 空');
console.log('NaN:', nan ? '❌ 有' : '✅ 无');
console.log('异常:', errors.length ? errors.join(';') : '✅ 无');

if (errors.length || nan || !d || !ld || !rd) { console.log('❌ FAIL'); process.exit(1); }
console.log('🎉 PASS');
