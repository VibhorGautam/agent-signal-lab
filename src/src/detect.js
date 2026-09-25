/**
 * A small, explainable signal scorer. It estimates automation, not AI authorship.
 * It never sends or stores data. A host app should use it for review, not blocking.
 */
export function scoreSignals(snapshot = {}) {
  // Treat missing or malformed fields as missing evidence, not as an automation signal.
  const { navigator: rawNavigator, window: rawWindow, events: rawEvents, request: rawRequest } = snapshot ?? {};
  const navigator = rawNavigator && typeof rawNavigator === 'object' ? rawNavigator : {};
  const window = rawWindow && typeof rawWindow === 'object' ? rawWindow : {};
  const events = Array.isArray(rawEvents) ? rawEvents : [];
  const request = rawRequest && typeof rawRequest === 'object' ? rawRequest : {};
  const signals = [];
  const add = (id, weight, evidence) => signals.push({ id, weight, evidence });
  if (navigator.webdriver === true) add('webdriver', 6, 'navigator.webdriver=true');
  if (navigator.webdriverOwnProperty === true) add('webdriver-own-property', 6, 'navigator.webdriver is shadowed by an own property');
  const ua = String(navigator.userAgent ?? request.userAgent ?? '');
  if (/headlesschrome/i.test(ua)) add('headless-ua', 5, 'User-Agent says HeadlessChrome');
  if (/\b(Playwright|Puppeteer|Selenium|ClaudeBot|GPTBot|ChatGPT-User|PerplexityBot)\b/i.test(ua))
    add('declared-automation', 8, 'User-Agent declares automation');
  const globals = Array.isArray(window.globalNames) ? window.globalNames : [];
  if (globals.some(x => typeof x === 'string' && /^(__playwright|__pw_|__puppeteer|_selenium|__webdriver)/i.test(x)))
    add('automation-global', 5, 'Automation-specific global present');
  if (globals.some(x => typeof x === 'string' && /^cdc_[a-zA-Z0-9]{10,}_(?:Array|JSON|Object|Promise|Proxy|Symbol|Window)$/.test(x)))
    add('chromedriver-global', 6, 'ChromeDriver constructor alias present');
  const pointer = events.filter(e => e?.type === 'pointermove' && Number.isFinite(e.t) && Number.isFinite(e.x) && Number.isFinite(e.y))
    .sort((a,b) => a.t-b.t).slice(0, 500);
  // Strongly regular movement *alone* is not evidence enough to block a user.
  if (pointer.length >= 8) {
    const intervals = pointer.slice(1).map((e,i) => e.t - pointer[i].t).filter(v => v > 0);
    if (intervals.length >= 7) {
      const mean = intervals.reduce((a,b)=>a+b,0)/intervals.length;
      const cv = Math.sqrt(intervals.reduce((a,b)=>a+(b-mean)**2,0)/intervals.length)/mean;
      if (cv < 0.025) add('regular-pointer-timing', 2, `interval CV=${cv.toFixed(3)}`);
    }
    const steps = pointer.slice(1).map((e,i) => Math.hypot(e.x-pointer[i].x,e.y-pointer[i].y));
    const meanStep = steps.reduce((a,b)=>a+b,0)/steps.length;
    if (meanStep > 0 && steps.every(v => Math.abs(v-meanStep) < 0.03*meanStep))
      add('linear-pointer-path', 2, 'nearly constant pointer step');
  }
  // Dataset-trained behavioral signature: consecutive nearly equal step lengths plus
  // bounded short-term timing dispersion. The thresholds were chosen on the phase-1
  // training split (2020 web-bot dataset), not its held-out test split.
  // Do not interpret this as human identity, and never block on it by itself.
  if (pointer.length >= 100) {
    const dt = pointer.slice(1).map((e,i) => e.t-pointer[i].t).filter(v => v > 0 && v < 200);
    const steps = pointer.slice(1).map((e,i) => Math.hypot(e.x-pointer[i].x,e.y-pointer[i].y));
    const sameStep = steps.filter((v,i) => i > 0 && Math.abs(v-steps[i-1]) < 0.05*Math.max(v,steps[i-1],1)).length / steps.length;
    const mean = dt.reduce((a,b)=>a+b,0)/(dt.length||1);
    const cv = Math.sqrt(dt.reduce((a,b)=>a+(b-mean)**2,0)/(dt.length||1))/(mean||1);
    if (dt.length >= 80 && sameStep > 0.32 && cv < 0.8)
      add('repeated-step-trajectory', 5, `step repeat=${sameStep.toFixed(3)}, timing CV=${cv.toFixed(3)}`);
  }
  const score = signals.reduce((a,s)=>a+s.weight,0);
  const explicitAutomation = signals.some(s=>['webdriver','webdriver-own-property','headless-ua','declared-automation','automation-global','chromedriver-global'].includes(s.id));
  // Motor patterns alone are never enough to label a person automated.
  return { score, classification: explicitAutomation ? 'likely-automated' : score >= 3 ? 'review' : 'unknown', signals,
    note: 'Not proof of AI use or human identity. Missing signals are not evidence of a human.' };
}

export function browserSnapshot({ eventLimit = 500 } = {}) {
  const events = [];
  const limit = Number.isInteger(eventLimit) ? Math.min(500, Math.max(0, eventLimit)) : 500;
  const onPointer = e => {
    if (events.length < limit) events.push({ type:'pointermove', t: performance.now(), x: e.clientX, y: e.clientY });
  };
  document.addEventListener('pointermove', onPointer, { passive: true });
  return {
    finish() {
      document.removeEventListener('pointermove', onPointer);
      return { navigator: { webdriver: navigator.webdriver, webdriverOwnProperty: Object.prototype.hasOwnProperty.call(navigator, 'webdriver'), userAgent: navigator.userAgent },
        window: { globalNames: Object.getOwnPropertyNames(window).filter(x => /^(__playwright|__pw_|__puppeteer|_selenium|__webdriver|cdc_[a-zA-Z0-9]{10,}_(?:Array|JSON|Object|Promise|Proxy|Symbol|Window)$)/i.test(x)) },
        events };
    }
  };
}
