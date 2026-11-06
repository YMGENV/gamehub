/* checkers.js */
try{
(() => {
  const own = v => v ? (v <= 2 ? 0 : 1) : -1, isK = v => v && v % 2 === 0;
  const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const dirs = (v, seat) => isK(v) ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : seat ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
  function jumps(b, i, seat) {
    const r = i >> 3, c = i & 7, out = [];
    for (const [dr, dc] of dirs(b[i], seat)) { const mr = r + dr, mc = c + dc, tr = r + 2 * dr, tc = c + 2 * dc; if (inb(tr, tc) && b[mr * 8 + mc] && own(b[mr * 8 + mc]) !== seat && !b[tr * 8 + tc]) out.push({ f: i, to: tr * 8 + tc, cap: mr * 8 + mc }); }
    return out;
  }
  function steps(b, i, seat) {
    const r = i >> 3, c = i & 7, out = [];
    for (const [dr, dc] of dirs(b[i], seat)) { const tr = r + dr, tc = c + dc; if (inb(tr, tc) && !b[tr * 8 + tc]) out.push({ f: i, to: tr * 8 + tc, cap: -1 }); }
    return out;
  }
  function legal(s, seat) {
    if (s.chain >= 0) return own(s.b[s.chain]) === seat ? jumps(s.b, s.chain, seat) : [];
    let caps = [], sm = [];
    for (let i = 0; i < 64; i++) if (own(s.b[i]) === seat) { caps = caps.concat(jumps(s.b, i, seat)); if (!caps.length) sm = sm.concat(steps(s.b, i, seat)); }
    if (caps.length) return caps;
    for (let i = 0; i < 64; i++) if (own(s.b[i]) === seat) { /* sm already collected only while no caps */ }
    return caps.length ? caps : sm.length ? sm : (() => { let o = []; for (let i = 0; i < 64; i++) if (own(s.b[i]) === seat) o = o.concat(steps(s.b, i, seat)); return o; })();
  }
  const count = (b, seat) => b.reduce((n, v) => n + (own(v) === seat ? 1 : 0), 0);
  const mk = (css, render, o = {}) => (el, C) => {
    const st = document.createElement('style'); st.textContent = css; el.appendChild(st);
    const root = document.createElement('div'); root.className = o.cls || ''; el.appendChild(root);
    const ui = {}, parts = []; let S = null, prev = null;
    const paint = () => { if (!S) return; const h = render(S, C, ui); h.forEach((x, i) => { if (!parts[i]) parts[i] = { d: root.appendChild(document.createElement('div')), h: null }; if (parts[i].h !== x) { parts[i].h = x; parts[i].d.innerHTML = x; } }); };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a],[data-ui]'); if (!b || b.disabled) return;
      if (b.dataset.ui) { try { Object.assign(ui, JSON.parse(b.dataset.ui)); } catch { } paint(); }
      if (b.dataset.a) try { C.send(JSON.parse(b.dataset.a)); } catch { }
    });
    const up = s => { const p = prev; S = s; paint(); if (o.sfx && p) try { o.sfx(s, p, C); } catch { } prev = JSON.parse(JSON.stringify(s)); };
    return up;
  };
  const U = o => `data-ui='${Hub.esc(JSON.stringify(o))}'`;
  const CSS = `.ck{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(96vw,500px);margin:0 auto}.ck>div{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}
.ck-sc{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.ck-sc .score b{font-size:16px}
.ck-b{display:grid;grid-template-columns:repeat(8,1fr);width:100%;aspect-ratio:1;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px #000a,0 0 0 6px #4a3320;user-select:none;-webkit-user-select:none}
.ck-q{position:relative;display:grid;place-items:center;container-type:size}.ck-q.l{background:#ecd9b0}.ck-q.d{background:linear-gradient(135deg,#7b5535,#6a4528)}
.ck-q.lm{box-shadow:inset 0 0 0 100px #ffe36633}.ck-q.go{cursor:pointer}
.ck-p{width:78%;height:78%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff8,transparent 40%),var(--c);box-shadow:0 4px 0 #0006,inset 0 -4px 0 #0004,0 0 0 2px #0004;position:relative;display:grid;place-items:center;font-size:clamp(10px,4vw,22px);transition:transform .12s}
.ck-p::before{content:"";position:absolute;inset:16%;border-radius:50%;border:2px solid #0003}
.ck-p.mv{animation:ckmv .28s ease-out}@keyframes ckmv{from{transform:translate(calc(var(--dx)*100%),calc(var(--dy)*100%))}to{transform:none}}
.ck-p.can{cursor:pointer;animation:ckcan 1s ease-in-out infinite alternate}@keyframes ckcan{to{box-shadow:0 4px 0 #0006,0 0 0 3px #fff,0 0 14px 3px #fff9}}
.ck-p.sel{transform:scale(1.1);box-shadow:0 6px 0 #0006,0 0 0 4px var(--warn),0 0 18px 4px var(--warn)}
.ck-p i{position:relative;font-style:normal;filter:drop-shadow(0 1px 1px #0008);z-index:1}
.ck-dot{position:absolute;width:30%;height:30%;border-radius:50%;background:#3ddc97;box-shadow:0 0 12px #3ddc97;animation:ckdot .7s infinite alternate}.ck-dot.cap{background:#ff5d73;box-shadow:0 0 12px #ff5d73}@keyframes ckdot{to{transform:scale(1.25)}}
.ck-n{font-size:14px;color:var(--warn);min-height:20px;text-align:center}`;
  Hub.register({
    id: 'checkers', name: 'Checkers', cat: 'Board', icon: '🔴', blurb: 'Jump and capture — crown your kings.', min: 2, max: 2,
    how: ['Move a piece diagonally forward onto an empty dark square.', '<b>Captures are mandatory</b>: jump over an enemy piece diagonally. Keep jumping if you can!', 'Reach the far row to be crowned a <b>king 👑</b> — kings move and capture both ways.', 'Capture or block all enemy pieces to win. 40 quiet moves in a row is a draw.', 'Tap a glowing piece, then tap a highlighted square.'],
    init(P) {
      const b = Array(64).fill(0);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) { if (r < 3) b[r * 8 + c] = 3; else if (r > 4) b[r * 8 + c] = 1; }
      return { ids: P.map(p => p.id), b, turn: 0, chain: -1, last: null, n: 0, idle: 0, cap: 0 };
    },
    act(s, pid, a, H) {
      if (a.t !== 'mv' || s.over) return; const seat = s.ids.indexOf(pid); if (seat !== s.turn) return;
      const m = legal(s, seat).find(x => x.f === (a.f | 0) && x.to === (a.to | 0)); if (!m) return;
      const v = s.b[m.f], man = !isK(v); s.b[m.to] = v; s.b[m.f] = 0; if (m.cap >= 0) s.b[m.cap] = 0;
      let promo = false; if (man && ((seat === 0 && m.to >> 3 === 0) || (seat === 1 && m.to >> 3 === 7))) { s.b[m.to] = v + 1; promo = true; }
      s.last = { f: m.f, t: m.to, c: m.cap }; s.n++; s.idle = (m.cap >= 0 || man) ? 0 : s.idle + 1; s.cap = m.cap >= 0 ? 1 : 0;
      if (m.cap >= 0 && !promo && jumps(s.b, m.to, seat).length) { s.chain = m.to; return; }
      s.chain = -1; s.turn = 1 - seat;
      const fin = (title, winners) => { s.over = { title, winners, rows: s.ids.map((id, i) => ({ pid: id, text: count(s.b, i) + ' pieces' })) }; };
      if (!count(s.b, 1 - seat) || !legal(s, 1 - seat).length) fin('🏆 Victory — opponent has no moves!', [pid]);
      else if (s.idle >= 40) fin('🤝 Draw — no progress', []);
      else if (s.n >= 260) { const x = count(s.b, 0), y = count(s.b, 1); x === y ? fin('🤝 Draw — move limit', []) : fin('⏱ Move limit — most pieces wins', [s.ids[x > y ? 0 : 1]]); }
    },
    botMs: 800,
    bot(s, pid) {
      const seat = s.ids.indexOf(pid); if (s.over || seat !== s.turn) return null;
      const L = legal(s, seat); if (!L.length) return null;
      const sc = m => {
        const v = s.b[m.f], b2 = s.b.slice(); b2[m.to] = v; b2[m.f] = 0; if (m.cap >= 0) b2[m.cap] = 0;
        let v2 = Math.random() * 2; const tr = m.to >> 3;
        if (!isK(v) && (seat ? tr === 7 : tr === 0)) v2 += 4;
        if (m.cap >= 0) v2 += 3;
        v2 += (seat ? tr : 7 - tr) * .25; const col = m.to & 7; if (col === 0 || col === 7) v2 += .4;
        const t = { b: b2, chain: -1 }; if (legal(t, 1 - seat).some(x => x.cap === m.to)) v2 -= 5;
        if (isK(v) && m.cap < 0) v2 -= .2;
        return v2;
      };
      let best = L[0], bv = -99; for (const m of L) { const x = sc(m); if (x > bv) { bv = x; best = m; } }
      return { t: 'mv', f: best.f, to: best.to };
    },
    mount: mk(CSS, (s, C, ui) => {
      const me = C.seat(C.me), mine = me === s.turn && !s.over, flip = me === 1, col = i => C.pl(s.ids[i]).color;
      const L = mine ? legal(s, me) : []; let sel = s.chain >= 0 && mine ? s.chain : ui.sel; if (!L.some(m => m.f === sel)) sel = -1;
      const froms = new Set(L.map(m => m.f)), dests = new Map(L.filter(m => m.f === sel).map(m => [m.to, m]));
      const hasCap = L.some(m => m.cap >= 0);
      const sc = `<div class="ck-sc">${s.ids.map((id, i) => `<div class="score ${i === s.turn && !s.over ? 'cur' : ''}"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${col(i)};box-shadow:inset 0 -3px 0 #0004"></span>${C.chip(id)}<b>${count(s.b, i)}</b></div>`).join('')}</div>
        <div class="turn ${mine ? 'mine' : ''}">${s.over ? 'Game over' : mine ? (s.chain >= 0 ? 'Keep jumping!' : 'Your turn!') : C.esc(C.pl(s.ids[s.turn]).name) + "'s turn"}</div>`;
      let cells = '';
      for (let dr = 0; dr < 8; dr++) for (let dc = 0; dc < 8; dc++) {
        const r = flip ? 7 - dr : dr, c = flip ? 7 - dc : dc, i = r * 8 + c, v = s.b[i], dark = (r + c) % 2, lm = s.last && (s.last.f === i || s.last.t === i);
        let inner = '', attr = '', cls = dark ? 'd' : 'l';
        if (lm) cls += ' lm';
        if (v) {
          const can = froms.has(i), isSel = sel === i, anim = s.last && s.last.t === i;
          const dx = anim ? ((s.last.f & 7) - c) * (flip ? -1 : 1) : 0, dy = anim ? ((s.last.f >> 3) - r) * (flip ? -1 : 1) : 0;
          inner = `<div class="ck-p ${can ? 'can' : ''} ${isSel ? 'sel' : ''} ${anim ? 'mv' : ''}" style="--c:${col(own(v))};--dx:${dx};--dy:${dy}">${isK(v) ? '<i>👑</i>' : ''}</div>`;
          if (can && s.chain < 0) { attr = U({ sel: isSel ? -1 : i }); cls += ' go'; }
        } else if (dests.has(i)) { const m = dests.get(i); inner = `<div class="ck-dot ${m.cap >= 0 ? 'cap' : ''}"></div>`; attr = Hub.A({ t: 'mv', f: sel, to: i }) + ' ' + U({ sel: -1 }); cls += ' go'; }
        cells += `<div class="ck-q ${cls}" ${attr}>${inner}</div>`;
      }
      const note = mine && hasCap ? 'Capture is mandatory!' : s.over ? '' : mine && sel < 0 ? 'Tap a glowing piece' : '';
      return [sc, `<div class="ck-b">${cells}</div>`, `<div class="ck-n">${note}</div>`];
    }, { cls: 'ck', sfx(s, p, C) { if (s.n !== p.n) C.sfx(s.cap ? 'boom' : 'pop'); } }),
  });
})();

}catch(e){console.error('Game file checkers.js failed to load',e)}
/* chess.js */
try{
(() => {
  let Chess = null; const ld = import('./chess.mjs').then(m => { Chess = m.Chess; }); Hub.ready.push(ld);
  const SYM = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }, VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  function end(s, g, mover) {
    const rows = s.ids.map((id, k) => ({ pid: id, text: k === 0 ? 'White' : 'Black' }));
    if (g.isCheckmate()) s.over = { title: `♚ Checkmate — ${mover ? 'Black' : 'White'} wins!`, winners: [s.ids[mover]], rows };
    else if (g.isGameOver() || s.hist.length >= 200) s.over = { title: '🤝 Draw', winners: [], rows };
  }
  Hub.register({
    id: 'chess', name: 'Chess', cat: 'Board', icon: '♟️', blurb: 'The classic. Full rules, checkmate to win.', min: 2, max: 2,
    how: ['Seat 1 plays <b>White</b> and moves first, seat 2 plays <b>Black</b>.', 'Tap one of your pieces — dots show where it can legally move — then tap the destination.', 'Pawns reaching the last rank promote automatically to a queen.', 'Checkmate the enemy king to win. You can also resign with the 🏳 button.'],
    init(P) { if (!Chess) throw new Error('Chess engine still loading — try again in a second'); return { ids: P.map(p => p.id), fen: new Chess().fen(), hist: [], last: [], turn: 0 }; },
    act(s, pid, a) {
      const k = s.ids.indexOf(pid); if (k < 0) return;
      if (a.t === 'resign') { s.over = { title: `🏳 ${k ? 'Black' : 'White'} resigned — ${k ? 'White' : 'Black'} wins!`, winners: [s.ids[1 - k]], rows: s.ids.map((id, j) => ({ pid: id, text: j ? 'Black' : 'White' })) }; return; }
      if (a.t !== 'mv' || k !== s.turn) return; const g = new Chess(s.fen);
      try { const m = g.move({ from: String(a.from), to: String(a.to), promotion: 'q' }); s.fen = g.fen(); s.hist.push(m.san); s.last = [m.from, m.to]; s.turn = 1 - s.turn; end(s, g, k); } catch { }
    },
    bot(s, pid) {
      if (s.ids.indexOf(pid) !== s.turn || !Chess) return null; const g = new Chess(s.fen), ms = g.moves({ verbose: true }); if (!ms.length) return null;
      let best = null, bs = -1; for (const m of ms) { const sc = (m.captured ? VAL[m.captured] * 3 : 0) + (m.san.includes('+') ? 2 : 0) + (m.san.includes('#') ? 99 : 0) + (m.promotion ? 6 : 0) + Math.random() * 3; if (sc > bs) { bs = sc; best = m; } }
      return { t: 'mv', from: best.from, to: best.to };
    },
    mount(el, C) {
      el.innerHTML = `<style>.ch{width:min(94vw,560px);margin:0 auto;display:flex;flex-direction:column;gap:10px;align-items:center}.cb{display:grid;grid-template:repeat(8,1fr)/repeat(8,1fr);width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;box-shadow:0 10px 40px #0008;border:3px solid #3a2a1a}
.cq{position:relative;display:grid;place-items:center;font-size:clamp(26px,8.2vw,56px);cursor:pointer;user-select:none;line-height:1}.cq.l{background:#f0d9b5}.cq.d{background:#b58863}.cq.sel{background:#f7ec6a!important}.cq.lm{box-shadow:inset 0 0 0 100px #ffe14d55}.cq.chk{background:radial-gradient(circle,#ff3b3b,#ff3b3b00 75%)!important}
.cq .w{color:#fff;text-shadow:0 0 2px #000,0 0 2px #000,0 1px 3px #000}.cq .k{color:#1a1a1a;text-shadow:0 0 1px #fff8}.cq i{position:absolute;width:30%;height:30%;border-radius:50%;background:#0006}.cq i.cap{width:92%;height:92%;background:none;border:4px solid #0006}
.cq small{position:absolute;left:2px;bottom:0;font-size:9px;opacity:.6;color:#000}.hist{font-size:13px;color:var(--muted);max-width:100%;text-align:center}</style><div class="ch"><div class="scores cs"></div><div class="turn ct"></div><div class="cb"></div><div class="row"><button class="btn sm alt cr">🏳 Resign</button></div><div class="hist"></div></div>`;
      const bd = el.querySelector('.cb'); let sel = null, S = null, game = null;
      el.querySelector('.cr').onclick = () => { if (S && !S.over && C.seat(C.me) >= 0 && confirm('Resign this game?')) C.send({ t: 'resign' }); };
      bd.onclick = e => { const q = e.target.closest('.cq'); if (!q || !S || S.over) return; const sq = q.dataset.s, me = C.seat(C.me); if (me !== S.turn) return;
        if (sel && sel !== sq) { const ok = game.moves({ square: sel, verbose: true }).some(m => m.to === sq); if (ok) { C.send({ t: 'mv', from: sel, to: sq }); C.sfx('pop'); sel = null; return; } }
        const p = game.get(sq); sel = p && p.color === (me ? 'b' : 'w') ? (sel === sq ? null : sq) : null; draw(); };
      function draw() {
        const s = S, me = C.seat(C.me), flip = me === 1, bdn = game.board(), targets = sel ? game.moves({ square: sel, verbose: true }) : [], chk = game.inCheck() ? game.turn() : null; let h = '';
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const rr = flip ? 7 - r : r, cc = flip ? 7 - c : c, sq = 'abcdefgh'[cc] + (8 - rr), p = bdn[rr][cc], t = targets.find(m => m.to === sq);
          h += `<div class="cq ${(rr + cc) % 2 ? 'd' : 'l'} ${sel === sq ? 'sel' : ''} ${s.last.includes(sq) ? 'lm' : ''} ${p && p.type === 'k' && p.color === chk ? 'chk' : ''}" data-s="${sq}">${p ? `<span class="${p.color === 'w' ? 'w' : 'k'}">${SYM[p.type]}</span>` : ''}${t ? `<i class="${p || t.captured ? 'cap' : ''}"></i>` : ''}${c === 0 ? `<small>${8 - rr}</small>` : ''}</div>`; }
        bd.innerHTML = h;
      }
      return s => {
        S = s; game = new Chess(s.fen); const me = C.seat(C.me); if (me !== s.turn) sel = null;
        el.querySelector('.cs').innerHTML = s.ids.map((id, k) => `<div class="score ${s.turn === k && !s.over ? 'cur' : ''}">${k ? '⬛' : '⬜'} ${C.chip(id)}</div>`).join('');
        el.querySelector('.ct').className = 'turn ct ' + (me === s.turn && !s.over ? 'mine' : ''); el.querySelector('.ct').textContent = s.over ? 'Game over' : (me === s.turn ? 'Your move' : C.pl(s.ids[s.turn]).name + "'s move") + (game.inCheck() ? ' — CHECK!' : '');
        el.querySelector('.hist').textContent = s.hist.slice(-8).join('  '); el.querySelector('.cr').style.display = me < 0 ? 'none' : ''; draw();
      };
    },
  });
})();

}catch(e){console.error('Game file chess.js failed to load',e)}
/* colorcards.js */
try{
(() => {
  const CSS = `<style>
.cc{width:min(100%,640px);display:flex;flex-direction:column;gap:10px;align-items:center;--w:clamp(46px,13vw,72px)}
.cc-opps{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%}
.cc-o{position:relative;padding:6px 10px;border-radius:14px;background:var(--card);border:2px solid var(--line);min-width:104px;display:flex;flex-direction:column;gap:4px;align-items:center;transition:all .2s}
.cc-o.cur{border-color:var(--c);box-shadow:0 0 18px color-mix(in srgb,var(--c) 70%,transparent);transform:translateY(-2px)}
.cc-o .fan{display:flex;height:34px;align-items:center}
.cc-o .fan i{width:20px;height:30px;border-radius:5px;background:linear-gradient(145deg,#2a2d55,#12142e);border:2px solid #fff;margin-left:-12px;box-shadow:0 2px 4px #0006}
.cc-o .fan i:first-child{margin-left:0}
.cc-o b{font-size:15px}.cc-o .last{position:absolute;top:-10px;right:-6px;background:var(--bad);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;animation:ccbl .7s infinite alternate}
@keyframes ccbl{to{transform:scale(1.15)}}
.cc-tbl{display:flex;gap:clamp(14px,6vw,36px);align-items:center;justify-content:center;padding:14px 18px;border-radius:24px;background:radial-gradient(circle at 50% 40%,#1c6b4a,#0d3b2a);border:3px solid #ffffff22;box-shadow:inset 0 0 40px #0008,0 8px 30px #0006;width:100%;max-width:420px;position:relative}
.cc-tbl .dir{position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:18px;opacity:.7}
.cc-c{--c1:#333;--c2:#111;width:var(--w);aspect-ratio:2/3;border-radius:12%;background:linear-gradient(145deg,var(--c1),var(--c2));border:3px solid #fff;color:#fff;position:relative;display:grid;place-items:center;font-family:var(--font);font-weight:700;padding:0;box-shadow:0 4px 10px #0007;flex:none;transition:transform .15s,opacity .15s,box-shadow .15s;overflow:hidden;cursor:default;user-select:none}
.cc-c.R{--c1:#ff5d6e;--c2:#c4122c}.cc-c.Y{--c1:#ffd94a;--c2:#e0a200}.cc-c.G{--c1:#46e08c;--c2:#139a52}.cc-c.B{--c1:#4d96ff;--c2:#1a4fc4}
.cc-c.W{background:conic-gradient(#ff4d5e 0 25%,#ffd23f 0 50%,#3ddc84 0 75%,#3d8bff 0 100%)}
.cc-c .mid{width:74%;height:58%;border-radius:50%;background:#fff;color:var(--c2);display:grid;place-items:center;transform:rotate(-24deg);font-size:calc(var(--w)*.46);line-height:1;text-shadow:0 1px 0 #0002}
.cc-c.W .mid{background:#111;color:#fff;font-size:calc(var(--w)*.4)}
.cc-c .tl,.cc-c .br{position:absolute;font-size:calc(var(--w)*.2);line-height:1;text-shadow:0 1px 2px #0006}.cc-c .tl{top:5%;left:9%}.cc-c .br{bottom:5%;right:9%;transform:rotate(180deg)}
.cc-c.back{background:linear-gradient(145deg,#2a2d55,#12142e)}.cc-c.back .mid{background:#d62a3f;color:#ffd23f;font-size:calc(var(--w)*.3);transform:rotate(-24deg)}
button.cc-c.ok,.cc-c.ok{cursor:pointer}
.cc-c.ok.mine{box-shadow:0 0 0 2px #fff8,0 0 14px #fff6,0 4px 10px #0007}
.cc-c.ok.mine:hover{transform:translateY(-12px) scale(1.05)}
.cc-c.no.mine{opacity:.45;filter:saturate(.6)}
.cc-c.W .q{position:absolute;width:50%;height:50%;border:0;padding:0;background:transparent;cursor:pointer}
.cc-c.W .q:disabled{cursor:default}
.cc-c.W .q.q0{left:0;top:0}.cc-c.W .q.q1{right:0;top:0}.cc-c.W .q.q2{left:0;bottom:0}.cc-c.W .q.q3{right:0;bottom:0}
.cc-c.W.ok.mine .q:hover{background:#fff6}
.cc-c.W .mid{pointer-events:none;z-index:1}
.cc-top.pop{animation:ccpop .45s cubic-bezier(.2,.9,.3,1.2)}
@keyframes ccpop{0%{transform:translateY(-70px) rotate(-40deg) scale(1.5);opacity:.2}100%{transform:none;opacity:1}}
.cc-pile{display:flex;flex-direction:column;align-items:center;gap:4px}
.cc-pile .n{font-size:13px;color:#fff;text-shadow:0 1px 2px #000}
.cc-col{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;color:#fff;text-shadow:0 1px 2px #000}
.cc-col i{width:18px;height:18px;border-radius:50%;border:2px solid #fff;background:var(--c1)}
.cc-hand{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:12px 8px 8px;width:100%;border-radius:18px;background:var(--card);border:1px solid var(--line);min-height:calc(var(--w)*1.5 + 24px)}
.cc-msg{min-height:22px;font-size:15px;text-align:center}
.cc-hand.big{--w:clamp(40px,11.5vw,60px)}
</style>`;
  const CN = { R: 'Red', Y: 'Yellow', G: 'Green', B: 'Blue' };
  const CC = { R: '#ff4d5e', Y: '#ffd23f', G: '#3ddc84', B: '#3d8bff' };
  const COLORS = 'RYGB';
  const mkDeck = () => {
    const d = [];
    for (const c of COLORS) { d.push(c + '0'); for (let n = 1; n <= 9; n++) d.push(c + n, c + n); for (const k of ['S', 'R', '+']) d.push(c + k, c + k); }
    for (let i = 0; i < 4; i++) d.push('W', 'W4');
    return d;
  };
  const isW = c => c[0] === 'W';
  const val = c => isW(c) ? '' : c.slice(1);
  const ord = c => (isW(c) ? 4 : COLORS.indexOf(c[0])) * 100 + ({ S: 11, R: 12, '+': 13, '': 20, 4: 21 }[val(c)] ?? (+val(c) || 0)) + (c === 'W4' ? 1 : 0);
  const playable = (s, c) => isW(c) || c[0] === s.col || (s.val !== '' && val(c) === s.val);
  const sym = c => { const v = val(c); return c === 'W4' ? '+4' : c === 'W' ? '★' : v === 'S' ? '⊘' : v === 'R' ? '⇄' : v === '+' ? '+2' : v; };
  const step = (s, H) => {
    const n = s.ids.length; let j = s.turn;
    for (let k = 0; k < n; k++) { j = (j + s.dir + n) % n; if (H.online(s.ids[j])) return j; }
    return s.turn;
  };
  const stepFrom = (s, H, from) => { const t = s.turn; s.turn = from; const r = step(s, H); s.turn = t; return r; };
  const draw = (s, seat, k, H) => {
    let last = '';
    for (let i = 0; i < k; i++) {
      if (!s.deck.length && s.disc.length > 1) { const top = s.disc.pop(); s.deck = H.shuffle(s.disc); s.disc = [top]; }
      if (!s.deck.length) break;
      last = s.deck.pop(); s.hands[seat].push(last);
    }
    s.hands[seat].sort((a, b) => ord(a) - ord(b));
    return last;
  };
  let seen = -1;

  const G = {
    id: 'colorcards', name: 'Colour Cards', cat: 'Cards & Dice', icon: '🃏', blurb: 'Match colour or number. Be first to empty your hand!', min: 2, max: 6,
    how: ['Everyone starts with <b>7 cards</b>. Be the first to play them all.', 'Play a card that matches the <b>colour</b> or the <b>number/symbol</b> of the top card.', '<b>⊘ Skip</b> skips the next player, <b>⇄ Reverse</b> flips direction, <b>+2</b> makes the next player draw 2 and miss a turn.', '<b>Wild</b> cards go on anything: tap a coloured corner of the card to choose the new colour. <b>+4</b> also makes the next player draw 4.', 'Nothing to play? Tap the deck to draw. If the drawn card fits you may play it or pass.', 'The deck is reshuffled from the discards when it runs out.'],
    hz: 2,
    init(P, H) {
      const deck = H.shuffle(mkDeck()), hands = P.map(() => []);
      for (let r = 0; r < 7; r++) for (let i = 0; i < P.length; i++) hands[i].push(deck.pop());
      let top = deck.pop(); while (isW(top) || !/\d/.test(val(top))) { deck.unshift(top); top = deck.pop(); }
      hands.forEach(h => h.sort((a, b) => ord(a) - ord(b)));
      return { ids: P.map(p => p.id), hands, deck, disc: [top], col: top[0], val: val(top), dir: 1, turn: 0, drew: false, dcard: '', lg: null, n: 0, idle: 0 };
    },
    act(s, pid, a, H) {
      if (s.over) return;
      const seat = s.ids.indexOf(pid); if (seat < 0 || seat !== s.turn) return;
      const hand = s.hands[seat];
      const fin = () => { s.drew = false; s.dcard = ''; s.idle = 0; s.n++; };
      if (a.t === 'play') {
        const i = a.i | 0, c = hand[i];
        if (!c || !playable(s, c)) return;
        if (s.drew && c !== s.dcard) return;
        if (isW(c) && !COLORS.includes(a.c)) return;
        hand.splice(i, 1); s.disc.push(c);
        s.col = isW(c) ? a.c : c[0]; s.val = val(c);
        const lg = { pid, k: 'play', c, e: '', to: '' };
        const v = val(c);
        if (v === 'R') {
          s.dir = -s.dir; lg.e = 'R';
          if (s.ids.length === 2) { s.turn = step(s, H); s.turn = step(s, H); } else s.turn = step(s, H);
        } else if (v === 'S' || v === '+' || c === 'W4') {
          const vic = step(s, H); lg.to = s.ids[vic]; lg.e = v === 'S' ? 'S' : v === '+' ? '2' : '4';
          if (v === '+') draw(s, vic, 2, H); if (c === 'W4') draw(s, vic, 4, H);
          s.turn = stepFrom(s, H, vic);
        } else s.turn = step(s, H);
        s.lg = lg; fin();
        if (!hand.length) {
          const idx = s.ids.map((_, k) => k).sort((x, y) => s.hands[x].length - s.hands[y].length);
          s.over = { title: '🏆 First out wins!', winners: [pid], rows: idx.map(k => ({ pid: s.ids[k], text: s.hands[k].length ? s.hands[k].length + ' cards left' : 'Out of cards!' })) };
        }
      } else if (a.t === 'draw') {
        if (s.drew) return;
        const c = draw(s, seat, 1, H);
        if (!c) { s.lg = { pid, k: 'pass' }; s.turn = step(s, H); fin(); return; }
        s.lg = { pid, k: 'draw' };
        if (playable(s, c)) { fin(); s.drew = true; s.dcard = c; }
        else { s.turn = step(s, H); fin(); }
      } else if (a.t === 'pass') {
        if (!s.drew) return;
        s.lg = { pid, k: 'pass' }; s.turn = step(s, H); fin();
      }
    },
    tick(s, dt, H) {
      if (s.over) return;
      s.idle += dt;
      const pid = s.ids[s.turn];
      if ((!H.online(pid) && s.idle > 1.5) || s.idle > 40) { const a = G.bot(s, pid, H); if (a) G.act(s, pid, a, H); }
    },
    bot(s, pid) {
      const seat = s.ids.indexOf(pid); if (seat !== s.turn || s.over) return null;
      const hand = s.hands[seat];
      const pickCol = skip => { const cnt = {}; hand.forEach((c, k) => { if (k !== skip && !isW(c)) cnt[c[0]] = (cnt[c[0]] || 0) + 1; }); const b = COLORS.split('').sort((x, y) => (cnt[y] || 0) - (cnt[x] || 0)); return b[0]; };
      const opts = hand.map((c, i) => i).filter(i => playable(s, hand[i]) && (!s.drew || hand[i] === s.dcard));
      if (!opts.length) return s.drew ? { t: 'pass' } : { t: 'draw' };
      const nw = opts.filter(i => !isW(hand[i])), act = nw.filter(i => !/\d/.test(val(hand[i])));
      const i = act.length && Math.random() < .6 ? act[Math.floor(Math.random() * act.length)] : nw.length ? nw[Math.floor(Math.random() * nw.length)] : opts[0];
      return isW(hand[i]) ? { t: 'play', i, c: pickCol(i) } : { t: 'play', i };
    },
    view(s, C) {
      const me = s.ids.indexOf(C.me), mine = me === s.turn && !s.over, cur = s.ids[s.turn];
      const lg = s.lg, nm = id => C.esc(C.pl(id).name);
      if (seen !== s.n) {
        if (seen >= 0 && lg) C.sfx(lg.e === '4' || lg.e === '2' ? (lg.to === C.me ? 'bad' : 'boom') : lg.k === 'draw' ? 'pop' : 'tick');
        else if (seen >= 0) C.sfx('tick');
      }
      const anim = seen !== s.n; seen = s.n;
      const top = s.disc[s.disc.length - 1];
      let msg = '';
      if (lg) {
        const who = `<b style="color:${C.esc(C.pl(lg.pid).color)}">${nm(lg.pid)}</b>`;
        if (lg.k === 'draw') msg = `${who} drew a card`; else if (lg.k === 'pass') msg = `${who} passed`;
        else {
          msg = `${who} played ${CN[lg.c[0]] || 'a Wild'} ${sym(lg.c)}`;
          if (lg.e === 'S') msg += ` — ${nm(lg.to)} is skipped!`; else if (lg.e === 'R') msg += ' — direction reversed!';
          else if (lg.e === '2') msg += ` — ${nm(lg.to)} draws 2!`; else if (lg.e === '4') msg += ` — ${nm(lg.to)} draws 4!`;
        }
      }
      const face = (c, extra = '', inner = '') => `<div class="cc-c ${isW(c) ? 'W' : c[0]} ${extra}"><span class="tl">${sym(c)}</span><span class="mid">${sym(c)}</span><span class="br">${sym(c)}</span>${inner}</div>`;
      const opps = s.ids.map((id, i) => i).filter(i => i !== me).map(i => {
        const n = s.hands[i].length, p = C.pl(s.ids[i]);
        return `<div class="cc-o ${i === s.turn && !s.over ? 'cur' : ''}" style="--c:${C.esc(p.color)}">${n === 1 ? '<span class="last">LAST CARD!</span>' : ''}${C.chip(s.ids[i])}<div class="fan">${'<i></i>'.repeat(Math.min(n, 7))}</div><b>${n} card${n === 1 ? '' : 's'}</b></div>`;
      }).join('');
      let hand = '';
      if (me >= 0) {
        const h = s.hands[me];
        hand = h.map((c, i) => {
          const ok = mine && playable(s, c) && (!s.drew || c === s.dcard), cls = `${ok ? 'ok' : 'no'} ${mine ? 'mine' : ''}`;
          if (isW(c)) {
            const q = [...COLORS].map((k, j) => `<button class="q q${j}" title="${CN[k]}" ${ok ? Hub.A({ t: 'play', i, c: k }) : 'disabled'}></button>`).join('');
            return face(c, cls, q);
          }
          return `<button class="cc-c ${c[0]} ${cls}" ${ok ? Hub.A({ t: 'play', i }) : 'disabled'}><span class="tl">${sym(c)}</span><span class="mid">${sym(c)}</span><span class="br">${sym(c)}</span></button>`;
        }).join('');
      }
      const canDraw = mine && !s.drew;
      const status = s.over ? 'Game over' : mine ? (s.drew ? 'You drew a playable card — play it or pass' : 'Your turn! Play a card or draw') : C.spectator ? `${nm(cur)}'s turn` : `${nm(cur)}'s turn…`;
      return CSS + `<div class="cc">
        <div class="cc-opps">${opps}</div>
        <div class="cc-tbl"><span class="dir">${s.dir > 0 ? '↻' : '↺'}</span>
          <div class="cc-pile"><button class="cc-c back ${canDraw ? 'ok mine' : ''}" ${canDraw ? Hub.A({ t: 'draw' }) : 'disabled'} title="Draw"><span class="mid">DRAW</span></button><span class="n">${s.deck.length} in deck</span></div>
          <div class="cc-pile">${face(top, 'cc-top ' + (anim ? 'pop' : ''))}<span class="cc-col" style="--c1:${CC[s.col]}"><i></i>${CN[s.col]}</span></div>
        </div>
        <div class="turn ${mine ? 'mine' : ''}">${status}</div>
        <div class="cc-msg">${msg}</div>
        ${me >= 0 ? `<div class="cc-hand ${s.hands[me].length > 9 ? 'big' : ''}">${hand || '<span class="muted">No cards</span>'}</div>
        ${s.drew && mine ? `<button class="btn alt" ${Hub.A({ t: 'pass' })}>Pass ⏭</button>` : ''}` : '<div class="muted">Spectating</div>'}
      </div>`;
    },
  };
  Hub.register(G);
})();

}catch(e){console.error('Game file colorcards.js failed to load',e)}
/* connect4.js */
try{
(() => {
  const W = 7, Hh = 6;
  const mk = (css, render, o = {}) => (el, C) => {
    const st = document.createElement('style'); st.textContent = css; el.appendChild(st);
    const root = document.createElement('div'); root.className = o.cls || ''; el.appendChild(root);
    const ui = {}, parts = []; let S = null, prev = null;
    const paint = () => { if (!S) return; const h = render(S, C, ui); h.forEach((x, i) => { if (!parts[i]) parts[i] = { d: root.appendChild(document.createElement('div')), h: null }; if (parts[i].h !== x) { parts[i].h = x; parts[i].d.innerHTML = x; } }); };
    root.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; try { C.send(JSON.parse(b.dataset.a)); } catch { } });
    const up = s => { const p = prev; S = s; paint(); if (o.sfx && p) try { o.sfx(s, p, C); } catch { } prev = JSON.parse(JSON.stringify(s)); };
    return up;
  };
  const free = (b, c) => { for (let r = Hh - 1; r >= 0; r--) if (!b[r * W + c]) return r; return -1; };
  const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
  function findWin(b, who) {
    for (let r = 0; r < Hh; r++) for (let c = 0; c < W; c++) for (const [dr, dc] of DIRS) {
      const cells = []; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cn = c + dc * k; if (rr < 0 || rr >= Hh || cn < 0 || cn >= W || b[rr * W + cn] !== who) break; cells.push(rr * W + cn); }
      if (cells.length === 4) return cells;
    }
    return null;
  }
  const CSS = `.c4{display:flex;flex-direction:column;align-items:center;gap:12px;width:min(96vw,460px);margin:0 auto}.c4>div{width:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.c4-sc{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.c4-b{display:grid;grid-template-columns:repeat(7,1fr);gap:0;background:linear-gradient(#2d5bd8,#1c3fa8);padding:2.5%;border-radius:18px;box-shadow:0 10px 30px #000a,inset 0 -6px 0 #0004;width:100%;box-sizing:border-box}
.c4-col{display:flex;flex-direction:column;background:none;border:0;padding:0;margin:0;cursor:pointer;border-radius:12px;color:inherit;-webkit-tap-highlight-color:transparent}
.c4-col:disabled{cursor:default}.c4-col:not(:disabled):hover{background:#fff2}
.c4-c{aspect-ratio:1;padding:6%;box-sizing:border-box;position:relative}
.c4-h{width:100%;height:100%;border-radius:50%;background:#0b1233;box-shadow:inset 0 5px 8px #000b,0 1px 0 #fff3;position:relative;overflow:visible}
.c4-d{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7,transparent 38%),var(--c);box-shadow:inset 0 -5px 0 #0004,0 0 0 2px #0003}
.c4-d::after{content:"";position:absolute;inset:20%;border-radius:50%;border:3px solid #0003}
.c4-d.drop{animation:c4drop calc(.18s + var(--d)*.07s) cubic-bezier(.5,0,.9,.6) both}
@keyframes c4drop{0%{transform:translateY(calc(var(--d)*-112% - 120%))}80%{transform:translateY(0)}88%{transform:translateY(-9%)}100%{transform:translateY(0)}}
.c4-d.win{animation:c4win .7s ease-in-out infinite alternate;box-shadow:0 0 0 3px #fff,0 0 18px 4px #fff,inset 0 -5px 0 #0004;z-index:2}
@keyframes c4win{to{transform:scale(1.12)}}
.c4-d.last::before{content:"";position:absolute;left:36%;top:36%;width:28%;height:28%;border-radius:50%;background:#fff9}`;
  Hub.register({
    id: 'connect4', name: 'Connect Four', cat: 'Board', icon: '🔴', blurb: 'Drop discs, line up four to win.', min: 2, max: 2,
    how: ['Players take turns dropping a disc into one of the 7 columns.', 'Tap a column — your disc falls to the lowest free slot.', 'Be first to connect <b>four</b> discs in a row: across, down or diagonally.', 'If the board fills up with no line, it is a draw.'],
    init(P) { return { ids: P.map(p => p.id), b: Array(W * Hh).fill(0), turn: 0, last: -1, n: 0, win: [] }; },
    act(s, pid, a, H) {
      if (a.t !== 'drop' || s.over) return; const seat = s.ids.indexOf(pid), c = a.c | 0;
      if (seat !== s.turn || c < 0 || c >= W) return; const r = free(s.b, c); if (r < 0) return;
      s.b[r * W + c] = seat + 1; s.last = r * W + c; s.n++;
      const w = findWin(s.b, seat + 1);
      if (w) { s.win = w; s.over = { title: '🏆 Four in a row!', winners: [pid], rows: s.ids.map((id, i) => ({ pid: id, text: i === seat ? 'Winner' : '' })) }; }
      else if (s.b.every(Boolean)) s.over = { title: '🤝 Draw — board full', winners: [], rows: [] };
      else s.turn = 1 - s.turn;
    },
    botMs: 800,
    bot(s, pid) {
      const seat = s.ids.indexOf(pid); if (s.over || seat !== s.turn) return null;
      const me = seat + 1, op = 3 - me, cols = [0, 1, 2, 3, 4, 5, 6].filter(c => free(s.b, c) >= 0);
      const test = (c, who) => { const r = free(s.b, c), b = s.b.slice(); b[r * W + c] = who; return [b, r]; };
      for (const c of cols) if (findWin(test(c, me)[0], me)) return { t: 'drop', c };
      for (const c of cols) if (findWin(test(c, op)[0], op)) return { t: 'drop', c };
      const safe = cols.filter(c => { const [b, r] = test(c, me); if (r === 0) return true; const b2 = b.slice(); b2[(r - 1) * W + c] = op; return !findWin(b2, op); });
      const pool = safe.length ? safe : cols;
      const score = c => { const [b, r] = test(c, me); let v = 4 - Math.abs(c - 3); for (const [dr, dc] of DIRS) for (const sg of [1, -1]) { let k = 0, rr = r + dr * sg, cn = c + dc * sg; while (rr >= 0 && rr < Hh && cn >= 0 && cn < W && b[rr * W + cn] === me) { k++; rr += dr * sg; cn += dc * sg; } v += k * 1.5; } return v + Math.random() * 3; };
      return { t: 'drop', c: pool.reduce((a, c) => score(c) > score(a) ? c : a, pool[0]) };
    },
    mount: mk(CSS, (s, C) => {
      const me = C.seat(C.me), mine = me === s.turn && !s.over, col = i => C.pl(s.ids[i]).color;
      const sc = `<div class="c4-sc">${s.ids.map((id, i) => `<div class="score ${i === s.turn && !s.over ? 'cur' : ''}"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${col(i)};box-shadow:inset 0 -3px 0 #0004"></span>${C.chip(id)}</div>`).join('')}</div>
        <div class="turn ${mine ? 'mine' : ''}">${s.over ? (s.win.length ? C.esc(C.pl(s.ids[s.b[s.win[0]] - 1]).name) + ' wins! 🎉' : 'Draw!') : mine ? 'Your turn — drop a disc!' : C.esc(C.pl(s.ids[s.turn]).name) + "'s turn"}</div>`;
      let cols = '';
      for (let c = 0; c < W; c++) {
        let cells = ''; const full = free(s.b, c) < 0;
        for (let r = 0; r < Hh; r++) {
          const i = r * W + c, v = s.b[i]; let d = '';
          if (v) { const isLast = i === s.last, drop = isLast && !s.win.length || isLast; d = `<div class="c4-d ${isLast ? 'drop last' : ''} ${s.win.includes(i) ? 'win' : ''}" style="--c:${col(v - 1)};--d:${r}"></div>`; }
          cells += `<div class="c4-c"><div class="c4-h">${d}</div></div>`;
        }
        cols += `<button class="c4-col" aria-label="Column ${c + 1}" ${Hub.A({ t: 'drop', c })} ${mine && !full ? '' : 'disabled'}>${cells}</button>`;
      }
      return [sc, `<div class="c4-b">${cols}</div>`, `<div class="muted">Move ${s.n}</div>`];
    }, { cls: 'c4', sfx(s, p, C) { if (s.n !== p.n) C.sfx('pop'); } }),
  });
})();

}catch(e){console.error('Game file connect4.js failed to load',e)}
/* hangman.js */
try{
(() => {
  const W = { Animals: 'elephant giraffe penguin dolphin kangaroo cheetah buffalo peacock squirrel hedgehog crocodile butterfly octopus rhinoceros gorilla tortoise flamingo scorpion leopard camel'.split(' '), Food: 'pizza biryani sandwich chocolate pancake noodles samosa popcorn spaghetti pineapple watermelon cupcake icecream hamburger sandwich mango jalebi paratha lemonade broccoli strawberry'.split(' '), Places: 'mountain library airport stadium museum hospital volcano island desert waterfall temple market village beach jungle palace station harbor garden castle pyramid'.split(' '), Things: 'umbrella backpack telescope bicycle guitar football elevator pillow candle camera keyboard balloon scissors compass lantern rocket mirror blanket trophy dictionary'.split(' '), Fun: 'adventure holiday birthday festival treasure puzzle dragon wizard pirate superhero robot galaxy rainbow fireworks carnival magic jigsaw cricket kabaddi diwali'.split(' ') };
  const ORDER = 'etaoinshrdlcumwfgypbvkjxqz';
  const gal = n => `<svg viewBox="0 0 120 130" width="150" style="stroke:#fff;stroke-width:4;fill:none;stroke-linecap:round"><path d="M10 124h100M30 124V8h60v18" stroke="#c9a56a"/>${[`<circle cx="90" cy="38" r="12"/>`, `<path d="M90 50v36"/>`, `<path d="M90 60 72 76"/>`, `<path d="M90 60l18 16"/>`, `<path d="M90 86 76 108"/>`, `<path d="M90 86l14 22"/>`].slice(0, n).join('')}</svg>`;
  function pickWord(s, H) { const cat = H.pick(Object.keys(W)); s.cat = cat; s.word = H.pick(W[cat]).toUpperCase(); s.g = []; s.wr = 0; s.wait = false; s.msg = ''; }
  Hub.register({
    id: 'hangman', name: 'Hangman', cat: 'Party', icon: '🪢', blurb: 'Guess the hidden word, letter by letter.', min: 2, max: 8,
    how: ['A secret word (with a category hint) is hidden behind blanks.', 'Take turns guessing a <b>letter</b>. Correct letters earn points for each time they appear — and you keep your turn.', 'A wrong guess passes the turn and adds a body part. 6 parts and the word is lost!', 'Completing a word earns a bonus. 5 words per game — highest score wins.'],
    init(P, H) { const s = { ids: P.map(p => p.id), sc: P.map(() => 0), turn: 0, wi: 1 }; pickWord(s, H); return s; },
    act(s, pid, a, H) {
      if (a.t !== 'g' || s.wait || s.ids.indexOf(pid) !== s.turn) return; const l = String(a.l || '').toUpperCase(); if (!/^[A-Z]$/.test(l) || s.g.includes(l)) return;
      s.g.push(l); const n = [...s.word].filter(c => c === l).length;
      if (n) { s.sc[s.turn] += n; if ([...s.word].every(c => s.g.includes(c))) { s.sc[s.turn] += 3; s.msg = '🎉 Solved! +3 bonus'; nxt(s, H); } }
      else { s.wr++; if (s.wr >= 6) { s.msg = '💀 Out of tries! The word was ' + s.word; nxt(s, H); } else s.turn = H.next(s.ids.map(id => ({ id })), s.turn); }
    },
    bot(s, pid) { if (s.wait || s.ids.indexOf(pid) !== s.turn) return null; const f = [...ORDER].filter(c => !s.g.includes(c.toUpperCase())); return { t: 'g', l: Math.random() < .5 ? f[0] : f[Math.floor(Math.random() * Math.min(f.length, 6))] }; },
    view(s, C) {
      const mine = C.seat(C.me) === s.turn && !s.wait && !s.over, show = s.wait || s.over;
      return `<div class="stack"><div class="scores">${s.ids.map((id, k) => `<div class="score ${s.turn === k && !s.over ? 'cur' : ''}">${C.chip(id)} <b>${s.sc[k]}</b></div>`).join('')}</div>
      <div class="muted">Word ${s.wi}/5 · Category: <b style="color:var(--txt)">${C.esc(s.cat)}</b></div>${gal(s.wr)}
      <div class="big" style="letter-spacing:.15em;font-family:ui-monospace,monospace">${[...s.word].map(c => s.g.includes(c) ? c : show ? `<span style="color:var(--bad)">${c}</span>` : '_').join(' ')}</div>
      <div class="turn ${mine ? 'mine' : ''}">${s.msg || (mine ? 'Your turn — pick a letter' : C.esc(C.pl(s.ids[s.turn]).name) + "'s turn")}</div>
      <div class="row" style="justify-content:center;max-width:560px;gap:6px">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button class="btn sm ${s.g.includes(l) ? (s.word.includes(l) ? 'ok' : 'bad') : 'alt'}" style="min-width:42px" ${Hub.A({ t: 'g', l })} ${s.g.includes(l) || !mine ? 'disabled' : ''}>${l}</button>`).join('')}</div></div>`;
    },
  });
  function nxt(s, H) {
    s.wait = true;
    H.after(2200, () => { if (s.wi >= 5) { const m = Math.max(...s.sc); s.over = { title: '🪢 Word wizard!', winners: s.ids.filter((_, k) => s.sc[k] === m), rows: s.ids.map((id, k) => ({ pid: id, text: s.sc[k] + ' pts' })) }; return; } s.wi++; pickWord(s, H); s.turn = H.next(s.ids.map(id => ({ id })), s.turn); });
  }
})();

}catch(e){console.error('Game file hangman.js failed to load',e)}
/* hotpotato.js */
try{
(() => {
  Hub.register({
    id: 'hotpotato', name: 'Hot Potato Bomb', cat: 'Action', icon: '💣', blurb: 'Pass the ticking bomb before it blows!', min: 3, max: 10, hz: 10, botMs: 150,
    how: ['A bomb with a <b>secret fuse</b> is passed around the group.', 'If you hold it, <b>tap another player</b> to pass it on — fast!', 'You can\'t pass it straight back for half a second.', 'When it explodes, the holder is out. Last player standing wins.'],
    init(P, H) { return { ids: P.map(p => p.id), alive: P.map(() => 1), hold: H.int(P.length), fuse: 10 + H.rand() * 15, held: 0, prev: -1, bd: .8 + H.rand() * 1.5, boom: 0, bn: 0, cd: 2.5 }; },
    tick(s, dt, H) {
      if (s.cd > 0) { s.cd -= dt; return; } if (s.boom > 0) { s.boom -= dt; return; }
      s.fuse -= dt; s.held += dt;
      if (s.fuse <= 0) {
        s.alive[s.hold] = 0; s.bn++; s.boom = 1.6; const al = s.alive.map((a, i) => a ? i : -1).filter(i => i >= 0);
        if (al.length <= 1) { s.over = { title: `🏆 ${C0(s, al[0])} survives!`, winners: al.map(i => s.ids[i]), rows: s.ids.map((id, k) => ({ pid: id, text: s.alive[k] ? 'survivor' : 'boom 💥' })) }; return; }
        s.hold = H.pick(al); s.fuse = 8 + H.rand() * 14; s.held = 0; s.prev = -1; s.bd = .8 + H.rand() * 1.5;
      }
    },
    act(s, pid, a) {
      if (a.t !== 'pass' || s.cd > 0 || s.boom > 0) return; const k = s.ids.indexOf(pid), to = a.to | 0; if (k !== s.hold || !s.alive[to] || to === k || (to === s.prev && s.held < .5)) return;
      s.prev = k; s.hold = to; s.held = 0; s.bd = .6 + Math.random() * 1.4;
    },
    bot(s, pid) { const k = s.ids.indexOf(pid); if (k !== s.hold || s.cd > 0 || s.boom > 0 || s.held < s.bd) return null; const c = s.alive.map((a, i) => a && i !== k && !(i === s.prev && s.held < .5) ? i : -1).filter(i => i >= 0); return c.length ? { t: 'pass', to: c[Math.floor(Math.random() * c.length)] } : null; },
    view(s, C) {
      const me = C.seat(C.me), holding = me === s.hold && s.boom <= 0 && s.cd <= 0, lvl = s.fuse < 3 ? 3 : s.fuse < 7 ? 2 : s.fuse < 12 ? 1 : 0;
      return `<style>@keyframes hp0{50%{transform:scale(1.06)}}@keyframes hp3{50%{transform:scale(1.25) rotate(8deg)}}.bomb{font-size:clamp(70px,22vw,140px);animation:hp${lvl === 0 ? 0 : lvl === 1 ? 0 : lvl} ${[1.2, .8, .45, .18][lvl]}s infinite;filter:drop-shadow(0 0 ${10 + lvl * 12}px ${['#ffb020', '#ff8a4c', '#ff5d73', '#ff2020'][lvl]})}</style>
      <div class="stack"><div class="bomb">${s.boom > 0 ? '💥' : '💣'}</div>
      <div class="turn ${holding ? 'mine' : ''}">${s.cd > 0 ? 'Get ready…' : s.boom > 0 ? C.esc(C.pl(s.ids[s.hold]).name) + ' ... 💥' : holding ? 'YOU have the bomb — PASS IT!' : C.esc(C.pl(s.ids[s.hold]).name) + ' is holding it'}</div>
      <div class="row" style="justify-content:center;gap:12px">${s.ids.map((id, k) => `<button class="btn ${k === s.hold ? '' : 'alt'}" style="${!s.alive[k] ? 'opacity:.25;' : ''}border:3px solid ${C.pl(id).color};min-width:96px;padding:14px 18px" ${Hub.A({ t: 'pass', to: k })} ${holding && s.alive[k] && k !== me ? '' : 'disabled'}>${!s.alive[k] ? '💀 ' : k === s.hold ? '💣 ' : ''}${C.esc(C.pl(id).name.split(' ')[0])}${k === me ? ' (you)' : ''}</button>`).join('')}</div></div>`;
    },
  });
  const C0 = (s, i) => 'Player';
})();

}catch(e){console.error('Game file hotpotato.js failed to load',e)}
/* ludo.js */
try{
(() => {
  // Seat colours (fixed board colours): Red TL, Green TR, Yellow BR, Blue BL — clockwise.
  const COLS = ['#e8424a', '#2fb85a', '#f2c230', '#3b82f6'];
  const CN = ['Red', 'Green', 'Yellow', 'Blue'];
  const FIN = 56;
  const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
  const TRACK = [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6]];
  const rotP = (x, y, k) => { for (let i = 0; i < k; i++) { const t = x; x = 15 - y; y = t; } return [x, y]; };
  const BASE = [[2.1, 2.1], [3.9, 2.1], [2.1, 3.9], [3.9, 3.9]];
  function pos(col, rel, k) {
    if (rel === -1) return rotP(BASE[k][0], BASE[k][1], col);
    if (rel <= 50) { const t = TRACK[(rel + 13 * col) % 52]; return [t[0] + .5, t[1] + .5]; }
    if (rel < FIN) return rotP(rel - 50 + .5, 7.5, col);
    return rotP(6.8, 7.5 + (k - 1.5) * .3, col);
  }
  const absIdx = (col, rel) => (rel + 13 * col) % 52;
  const nxt = (s, H) => H.next(s.ids.map(id => ({ id })), s.turn);
  function legal(s, seat) {
    const d = s.dice, out = []; if (!d) return out;
    s.tok[seat].forEach((r, k) => { if (r === -1) { if (d === 6) out.push(k); } else if (r + d <= FIN) out.push(k); });
    return out;
  }
  function victims(s, seat, nr) {   // opponent tokens that a landing on rel nr would capture
    if (nr < 0 || nr > 50) return [];
    const ai = absIdx(s.cols[seat], nr); if (SAFE.has(ai)) return [];
    const out = [];
    s.ids.forEach((_, o) => { if (o === seat) return; s.tok[o].forEach((r, k) => { if (r >= 0 && r <= 50 && absIdx(s.cols[o], r) === ai) out.push([o, k]); }); });
    return out;
  }
  function endTurn(s, H, extra) {
    s.dice = 0; s.wait = false;
    if (!extra) { s.sixes = 0; s.turn = nxt(s, H); }
  }
  function doMove(s, seat, k, H) {
    const d = s.dice, r = s.tok[seat][k], nr = r === -1 ? 0 : r + d;
    s.tok[seat][k] = nr; s.wait = false;
    const v = victims(s, seat, nr);
    v.forEach(([o, kk]) => { s.tok[o][kk] = -1; });
    s.ev = { k: v.length ? 'cap' : nr === FIN ? 'home' : r === -1 ? 'out' : 'mv', a: seat, b: v.length ? v[0][0] : -1, n: ++s.evn };
    if (s.tok[seat].every(x => x === FIN)) {
      const prog = i => s.tok[i].reduce((a, b) => a + (b < 0 ? 0 : b), 0);
      const order = s.ids.map((id, i) => i).sort((a, b) => (b === seat) - (a === seat) || prog(b) - prog(a));
      s.over = { title: '🏆 ' + CN[s.cols[seat]] + ' wins Ludo!', winners: [s.ids[seat]], rows: order.map(i => ({ pid: s.ids[i], text: s.tok[i].filter(x => x === FIN).length + '/4 home' })) };
      return;
    }
    endTurn(s, H, d === 6 || v.length > 0 || nr === FIN);
  }

  const CSS = `.lu{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(96vw,540px);margin:0 auto}
.lu-hud{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.lu-p{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:14px;background:var(--card);border:2px solid transparent;font-size:14px}
.lu-p.cur{border-color:#fff;box-shadow:0 0 14px #fff5}.lu-p b{font-size:13px;opacity:.85}
.lu-sw{width:16px;height:16px;border-radius:5px;border:2px solid #fff8}
.lu-bw{width:100%;aspect-ratio:1;background:#1b2036;border-radius:18px;padding:6px;box-sizing:border-box;box-shadow:0 8px 30px #0008}
.lu-bw svg{width:100%;height:100%;display:block;touch-action:manipulation}
.lu .tk{transition:transform .11s linear;cursor:default}.lu .tk .ring{display:none}
.lu .tk.can{cursor:pointer}.lu .tk.can .ring{display:block;animation:luring .8s infinite alternate}
@keyframes luring{from{opacity:.4;transform:scale(.9)}to{opacity:1;transform:scale(1.1)}}
.lu .tk.can circle.body{animation:lubob .6s infinite alternate}
@keyframes lubob{from{transform:translateY(0)}to{transform:translateY(-.12px)}}
.lu-ctl{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap;width:100%}
.lu-die{width:64px;height:64px;border-radius:14px;background:#fff;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:9px;gap:2px;box-shadow:0 4px 14px #0007,inset 0 -4px 0 #0002;flex:none}
.lu-die i{border-radius:50%;background:transparent}.lu-die i.on{background:#222;box-shadow:inset 0 -2px 0 #000a}
.lu-die.roll{animation:luroll .55s ease-out}
@keyframes luroll{0%{transform:rotate(0) scale(.8)}50%{transform:rotate(200deg) scale(1.15)}100%{transform:rotate(360deg) scale(1)}}
.lu-die.can{cursor:pointer;outline:3px solid var(--warn);outline-offset:2px}
.lu-msg{min-height:20px;text-align:center;font-size:14px}`;
  const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  const dieHtml = v => Array.from({ length: 9 }, (_, i) => `<i class="${(PIPS[v] || []).includes(i) ? 'on' : ''}"></i>`).join('');
  const NS = 'http://www.w3.org/2000/svg';

  function boardSvg(active) {
    let o = `<svg viewBox="0 0 15 15" xmlns="${NS}"><rect width="15" height="15" rx=".6" fill="#e9edf7"/>`;
    for (let k = 0; k < 4; k++) {
      const [x, y] = rotP(0, 0, k), c = active.includes(k) ? COLS[k] : '#9aa3b8';
      const rx = [0, 9, 9, 0][k], ry = [0, 0, 9, 9][k];
      o += `<rect x="${rx}" y="${ry}" width="6" height="6" fill="${c}"/><rect x="${rx + .9}" y="${ry + .9}" width="4.2" height="4.2" rx=".7" fill="#fff" opacity=".92"/>`;
      BASE.forEach((b, i) => { const [px, py] = rotP(b[0], b[1], k); o += `<circle cx="${px}" cy="${py}" r=".5" fill="${c}" opacity=".35"/>`; });
    }
    for (let c = 0; c < 15; c++) for (let r = 0; r < 15; r++) {
      if (!((c >= 6 && c <= 8) || (r >= 6 && r <= 8))) continue;
      if (c >= 6 && c <= 8 && r >= 6 && r <= 8) continue;
      o += `<rect x="${c}" y="${r}" width="1" height="1" fill="#fff" stroke="#c5cde0" stroke-width=".05"/>`;
    }
    for (let k = 0; k < 4; k++) {
      const col = active.includes(k) ? COLS[k] : '#b6bdd0';
      for (let i = 1; i <= 5; i++) { const [x, y] = rotP(i + .5, 7.5, k); o += `<rect x="${x - .5}" y="${y - .5}" width="1" height="1" fill="${col}" stroke="#fff8" stroke-width=".05"/>`; }
      const t = TRACK[13 * k]; o += `<rect x="${t[0]}" y="${t[1]}" width="1" height="1" fill="${col}" stroke="#fff8" stroke-width=".05"/>`;
      const p = [[6, 6], [6, 9], [7.5, 7.5]].map(q => rotP(q[0], q[1], k).join(',')).join(' ');
      o += `<polygon points="${p}" fill="${col}" stroke="#fff" stroke-width=".06"/>`;
    }
    [8, 21, 34, 47].forEach(i => { const t = TRACK[i]; o += `<text x="${t[0] + .5}" y="${t[1] + .5}" font-size=".8" text-anchor="middle" dominant-baseline="central" fill="#8d97b3">★</text>`; });
    return o;
  }

  Hub.register({
    id: 'ludo', name: 'Ludo', cat: 'Board', icon: '🎲', blurb: 'Race 4 tokens home. Roll, capture, win.', min: 2, max: 4,
    how: ['Roll the die on your turn. You need a <b>6</b> to bring a token out of your base.', 'Tap a glowing token to move it forward the rolled number.', 'Landing on an opponent captures it — it goes back to its base. ⭐ and start squares are safe.', 'A <b>6</b>, a capture or a token reaching home gives you another roll (three 6s in a row loses the turn).', 'Tokens need the <b>exact</b> roll to reach the centre. First to bring all 4 home wins!'],
    init(P) {
      const n = P.length, cols = n === 2 ? [0, 2] : P.map((_, i) => i);
      return { ids: P.map(p => p.id), cols, tok: P.map(() => [-1, -1, -1, -1]), turn: 0, dice: 0, lastd: 1, roll: 0, sixes: 0, wait: false, ev: { k: '', a: -1, b: -1, n: 0 }, evn: 0 };
    },
    act(s, pid, a, H) {
      const seat = s.ids.indexOf(pid);
      if (seat < 0 || seat !== s.turn || s.wait || s.over) return;
      if (a.t === 'roll') {
        if (s.dice) return;
        const d = 1 + H.int(6); s.dice = d; s.lastd = d; s.roll++; s.ev = { k: 'roll', a: seat, b: -1, n: ++s.evn };
        if (d === 6) { s.sixes++; if (s.sixes >= 3) { s.wait = true; s.ev = { k: 'six3', a: seat, b: -1, n: ++s.evn }; H.after(1500, () => endTurn(s, H, false)); return; } }
        const L = legal(s, seat);
        if (!L.length) { s.wait = true; s.ev = { k: 'none', a: seat, b: -1, n: ++s.evn }; H.after(1200, () => endTurn(s, H, d === 6)); return; }
        if (L.length === 1) { s.wait = true; H.after(800, () => { if (!s.over && s.dice) doMove(s, seat, L[0], H); }); }
      } else if (a.t === 'move') {
        if (!s.dice) return;
        const k = a.k | 0; if (!legal(s, seat).includes(k)) return;
        doMove(s, seat, k, H);
      }
    },
    bot(s, pid) {
      const seat = s.ids.indexOf(pid);
      if (seat !== s.turn || s.wait || s.over) return null;
      if (!s.dice) return { t: 'roll' };
      const L = legal(s, seat); if (!L.length) return null;
      let best = L[0], bs = -1;
      for (const k of L) {
        const r = s.tok[seat][k], nr = r === -1 ? 0 : r + s.dice; let sc = nr / 10 + Math.random() * 3;
        if (victims(s, seat, nr).length) sc += 90; if (nr === FIN) sc += 80; if (r === -1) sc += 40;
        if (nr > 50 && nr < FIN) sc += 15; if (nr <= 50 && SAFE.has(absIdx(s.cols[seat], nr))) sc += 12;
        if (r >= 0 && r <= 50 && SAFE.has(absIdx(s.cols[seat], r))) sc -= 6;
        if (sc > bs) { bs = sc; best = k; }
      }
      return { t: 'move', k: best };
    },
    mount(el, C) {
      el.innerHTML = `<style>${CSS}</style><div class="lu"><div class="lu-hud"></div><div class="lu-bw"></div>
        <div class="lu-ctl"><div class="lu-die"></div><div style="display:flex;flex-direction:column;gap:6px;align-items:center"><div class="turn"></div><button class="btn ok big lu-roll">🎲 Roll</button></div></div><div class="lu-msg muted"></div></div>`;
      const q = x => el.querySelector(x), hud = q('.lu-hud'), bw = q('.lu-bw'), die = q('.lu-die'), turnEl = q('.turn'), rollB = q('.lu-roll'), msg = q('.lu-msg');
      let built = false, svg, tokG = {}, tks = [], lastRoll = -1, lastEv = -1, dieTimer = 0, S = null, rollTimer = 0;
      rollB.onclick = () => C.send({ t: 'roll' });
      die.onclick = () => { if (die.classList.contains('can')) C.send({ t: 'roll' }); };
      const layout = () => {
        const groups = {};
        tks.forEach(t => { if (t.shown >= 0 && t.shown < FIN) { const p = pos(t.col, t.shown, t.k), key = p[0].toFixed(2) + ',' + p[1].toFixed(2); (groups[key] = groups[key] || []).push(t); } });
        tks.forEach(t => {
          let [x, y] = pos(t.col, t.shown, t.k), sc = 1;
          const g = t.shown >= 0 && t.shown < FIN ? groups[x.toFixed(2) + ',' + y.toFixed(2)] : null;
          if (g && g.length > 1) { const i = g.indexOf(t), n = g.length; x += (i - (n - 1) / 2) * .3; y += (i % 2 ? .12 : -.12); sc = n > 2 ? .6 : .72; }
          t.el.style.transform = `translate(${x}px,${y}px) scale(${sc})`;
        });
      };
      const sync = (t, target, instant) => {
        t.target = target;
        if (instant) { clearTimeout(t.timer); t.timer = 0; t.shown = target; return; }
        if (t.timer) return;
        const run = () => {
          if (t.shown === t.target) { t.timer = 0; layout(); return; }
          if (t.target < t.shown) t.shown = t.target; else if (t.shown === -1) t.shown = 0; else { t.shown++; if (t.shown < FIN) C.sfx('tick'); }
          layout(); t.timer = setTimeout(run, 120);
        };
        run();
      };
      function build(s) {
        built = true; bw.innerHTML = boardSvg(s.cols) + '<g id="lutk"></g></svg>';
        svg = bw.firstChild; const layer = svg.querySelector('#lutk');
        s.ids.forEach((id, seat) => {
          for (let k = 0; k < 4; k++) {
            const col = s.cols[seat], g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'tk'); g.dataset.seat = seat; g.dataset.k = k;
            g.innerHTML = `<circle class="ring" r=".58" fill="none" stroke="#fff" stroke-width=".12"/><circle r=".44" cy=".06" fill="#0004"/><circle class="body" r=".4" fill="${COLS[col]}" stroke="#fff" stroke-width=".09"/><circle r=".16" fill="${C.pl(id).color}" stroke="#0006" stroke-width=".04"/>`;
            layer.appendChild(g); const t = { el: g, seat, k, col, shown: s.tok[seat][k], target: s.tok[seat][k], timer: 0 }; tks.push(t); tokG[seat + '-' + k] = t;
          }
        });
        svg.addEventListener('click', e => { const g = e.target.closest('.tk.can'); if (g) C.send({ t: 'move', k: +g.dataset.k }); });
        layout();
      }
      const evText = (s) => {
        const e = s.ev, nm = i => i >= 0 ? C.esc(C.pl(s.ids[i]).name) : '';
        switch (e.k) {
          case 'cap': return `💥 ${nm(e.a)} captured a ${CN[s.cols[e.b]]} token!`;
          case 'home': return `🏠 ${nm(e.a)} got a token home!`;
          case 'out': return `${nm(e.a)} brought a token out.`;
          case 'six3': return `${nm(e.a)} rolled three 6s — turn lost.`;
          case 'none': return `${nm(e.a)} rolled ${s.lastd} — no move.`;
          case 'roll': return `${nm(e.a)} rolled a ${s.lastd}.`;
          default: return e.k ? `${nm(e.a)} moved.` : '';
        }
      };
      function update(s) {
        S = s;
        if (!built) build(s);
        const seatMe = C.seat(C.me), mine = seatMe === s.turn && !s.over, cur = s.ids[s.turn];
        hud.innerHTML = s.ids.map((id, i) => `<div class="lu-p ${i === s.turn && !s.over ? 'cur' : ''}"><span class="lu-sw" style="background:${COLS[s.cols[i]]}"></span>${C.chip(id)}<b>${s.tok[i].filter(x => x === FIN).length}/4 🏠</b></div>`).join('');
        const L = !s.over && !s.wait && mine ? legal(s, seatMe) : [];
        tks.forEach(t => {
          const target = s.tok[t.seat][t.k];
          if (t.target !== target) { const prev = t.shown; if (target === -1 && prev >= 0) C.sfx('bad'); else if (target === FIN) C.sfx('good'); sync(t, target, false); }
          t.el.classList.toggle('can', t.seat === seatMe && L.includes(t.k));
        });
        // dice
        if (lastRoll === -1) { lastRoll = s.roll; die.innerHTML = dieHtml(s.lastd); }
        else if (s.roll !== lastRoll) {
          lastRoll = s.roll; C.sfx('roll'); die.classList.remove('roll'); void die.offsetWidth; die.classList.add('roll');
          clearInterval(dieTimer); let n = 0, fin = s.lastd;
          dieTimer = setInterval(() => { n++; if (n > 6) { clearInterval(dieTimer); die.innerHTML = dieHtml(fin); } else die.innerHTML = dieHtml(1 + Math.floor(Math.random() * 6)); }, 80);
        }
        const canRoll = mine && !s.dice && !s.wait;
        rollB.style.display = canRoll ? '' : 'none'; die.classList.toggle('can', canRoll);
        const name = C.esc(C.pl(cur).name);
        turnEl.className = 'turn' + (mine ? ' mine' : '');
        turnEl.innerHTML = s.over ? 'Game over' : mine ? (s.wait ? 'Moving…' : s.dice ? `Tap a glowing token (${s.dice})` : 'Your turn — roll!') : C.spectator || true ? `${name} ${s.dice && !s.wait ? 'is choosing…' : 'is rolling…'}` : '';
        if (s.ev.n !== lastEv) { lastEv = s.ev.n; if (s.ev.k === 'cap' || s.ev.k === 'six3') C.sfx('bad'); }
        msg.innerHTML = evText(s);
      }
      update.destroy = () => { tks.forEach(t => clearTimeout(t.timer)); clearInterval(dieTimer); };
      return update;
    },
  });
})();

}catch(e){console.error('Game file ludo.js failed to load',e)}
/* mathblitz.js */
try{
(() => {
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function prob(seed, i) {
    const r = rng(seed + i * 977), n = k => Math.floor(r() * k); let a, b, q, ans; const lv = Math.min(3, Math.floor(i / 4));
    const op = lv === 0 ? n(2) : n(3 + (lv > 1 ? 1 : 0));
    if (op === 0) { a = 2 + n(10 * (lv + 1)); b = 2 + n(10 * (lv + 1)); q = `${a} + ${b}`; ans = a + b; }
    else if (op === 1) { a = 10 + n(30 * (lv + 1)); b = 2 + n(a - 2); q = `${a} − ${b}`; ans = a - b; }
    else if (op === 2) { a = 2 + n(8 + lv * 2); b = 2 + n(8 + lv * 2); q = `${a} × ${b}`; ans = a * b; }
    else { b = 2 + n(11); ans = 2 + n(12); a = b * ans; q = `${a} ÷ ${b}`; }
    return { q, ans };
  }
  Hub.register({
    id: 'mathblitz', name: 'Math Blitz', cat: 'Party', icon: '🧮', blurb: '60 seconds of mental maths. Fastest brain wins.', min: 2, max: 10, hz: 5, botMs: 2200,
    how: ['Everyone gets the <b>same questions</b> in the same order.', 'Type the answer and press <span class="kbd">Enter</span> — a correct answer moves you to the next question.', 'A wrong answer just clears the box. Streaks of 5 earn bonus points!', 'You have <b>60 seconds</b>. Highest score wins.'],
    init(P, H) { return { ids: P.map(p => p.id), seed: H.int(1e9), t: 60, cd: 3, sc: P.map(() => 0), ix: P.map(() => 0), st: P.map(() => 0) }; },
    tick(s, dt) { if (s.cd > 0) { s.cd -= dt; return; } s.t -= dt; if (s.t <= 0) { const m = Math.max(...s.sc); s.over = { title: '🧮 Math champion!', winners: s.ids.filter((_, k) => s.sc[k] === m), rows: s.ids.map((id, k) => ({ pid: id, text: s.sc[k] + ' pts' })) }; } },
    act(s, pid, a) { if (a.t !== 'a' || s.cd > 0) return; const k = s.ids.indexOf(pid); if (k < 0) return; if (Number(a.v) === prob(s.seed, s.ix[k]).ans && String(a.v).trim() !== '') { s.st[k]++; s.sc[k] += 1 + (s.st[k] % 5 === 0 ? 2 : 0); s.ix[k]++; } else s.st[k] = 0; },
    bot(s, pid) { const k = s.ids.indexOf(pid); if (s.cd > 0) return null; const p = prob(s.seed, s.ix[k]); return { t: 'a', v: Math.random() < .85 ? p.ans : p.ans + 1 }; },
    mount(el, C) {
      el.innerHTML = `<style>.mb{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:14px;align-items:center}.mq{font-size:clamp(44px,13vw,96px);font-weight:700;min-height:1.2em}.mi{font-size:32px!important;text-align:center;width:min(80vw,260px)}.lb{width:100%;display:flex;flex-direction:column;gap:6px}.lb div{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:5px 12px;border-radius:12px;background:var(--card)}</style>
      <div class="mb"><div class="bar" style="width:100%"><i class="mt"></i></div><div class="mq"></div><input id="mbin" class="mi" inputmode="numeric" autocomplete="off" placeholder="?"><div class="muted ms"></div><div class="lb"></div></div>`;
      const inp = el.querySelector('#mbin'); let S = null, lastIx = -1, lastSc = 0;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim() !== '') { C.send({ t: 'a', v: inp.value.trim() }); inp.value = ''; } });
      if (C.spectator) inp.style.display = 'none'; else setTimeout(() => inp.focus(), 50);
      return s => {
        S = s; const k = C.seat(C.me); el.querySelector('.mt').style.width = Math.max(0, s.t / 60 * 100) + '%';
        el.querySelector('.mq').textContent = s.cd > 0 ? 'Get ready… ' + Math.ceil(s.cd) : k >= 0 ? prob(s.seed, s.ix[k]).q : '👀';
        if (k >= 0 && s.ix[k] !== lastIx) { if (lastIx >= 0) C.sfx('good'); lastIx = s.ix[k]; inp.focus(); }
        el.querySelector('.ms').textContent = k >= 0 ? `Score ${s.sc[k]} · streak ${s.st[k]}` : 'Spectating';
        el.querySelector('.lb').innerHTML = s.ids.map((id, i) => [i, id]).sort((a, b) => s.sc[b[0]] - s.sc[a[0]]).map(([i, id]) => `<div>${C.chip(id)}<b>${s.sc[i]}</b></div>`).join('');
      };
    },
  });
})();

}catch(e){console.error('Game file mathblitz.js failed to load',e)}
/* memory.js */
try{
(() => {
  const EM = ['🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐰', '🐨', '🐯', '🦄', '🐙', '🦋', '🐢', '🍎', '🍕', '🚀', '⚽', '🎸', '🌈'];
  Hub.register({
    id: 'memory', name: 'Memory Match', cat: 'Board', icon: '🧠', blurb: 'Flip cards, find pairs, remember.', min: 2, max: 6,
    how: ['On your turn flip <b>two cards</b> by tapping them.', 'Matching pair? You keep it, score a point and <b>go again</b>.', 'No match? The cards flip back — remember where they were!', 'Most pairs when the board is cleared wins.'],
    init(P, H) { const n = P.length <= 3 ? 8 : 12, f = H.shuffle(EM).slice(0, n); return { ids: P.map(p => p.id), cards: H.shuffle([...f, ...f]), up: [], own: Array(n * 2).fill(-1), turn: 0, sc: P.map(() => 0), lock: false, msg: '' }; },
    act(s, pid, a, H) {
      if (a.t !== 'f' || s.lock || s.ids.indexOf(pid) !== s.turn) return; const i = a.i | 0; if (i < 0 || i >= s.cards.length || s.own[i] >= 0 || s.up.includes(i)) return;
      s.up.push(i); if (s.up.length < 2) return; s.lock = true; const [x, y] = s.up;
      if (s.cards[x] === s.cards[y]) { H.after(700, () => { s.own[x] = s.own[y] = s.turn; s.sc[s.turn]++; s.up = []; s.lock = false; s.msg = '✨ Match!'; if (s.own.every(o => o >= 0)) { const m = Math.max(...s.sc); s.over = { title: '🏆 Memory master!', winners: s.ids.filter((_, k) => s.sc[k] === m), rows: s.ids.map((id, k) => ({ pid: id, text: s.sc[k] + ' pairs' })) }; } }); }
      else H.after(1200, () => { s.up = []; s.lock = false; s.msg = ''; s.turn = H.next(s.ids.map(id => ({ id })), s.turn); });
    },
    bot(s, pid) {
      if (s.lock || s.ids.indexOf(pid) !== s.turn) return null; const free = s.cards.map((_, i) => i).filter(i => s.own[i] < 0 && !s.up.includes(i));
      if (s.up.length === 1 && Math.random() < .45) { const m = free.find(i => s.cards[i] === s.cards[s.up[0]]); if (m != null) return { t: 'f', i: m }; }
      return { t: 'f', i: free[Math.floor(Math.random() * free.length)] };
    },
    view(s, C) {
      const mine = C.seat(C.me) === s.turn && !s.lock && !s.over, cols = s.cards.length === 16 ? 4 : 6;
      return `<div class="stack"><div class="scores">${s.ids.map((id, k) => `<div class="score ${s.turn === k && !s.over ? 'cur' : ''}">${C.chip(id)} <b>${s.sc[k]}</b></div>`).join('')}</div>
      <div class="turn ${mine ? 'mine' : ''}">${s.over ? 'Game over' : mine ? 'Your turn — flip 2 cards' : C.esc(C.pl(s.ids[s.turn]).name) + "'s turn"} ${s.msg}</div>
      <div class="board" style="grid-template-columns:repeat(${cols},1fr);width:min(94vw,${cols === 4 ? 460 : 640}px)">${s.cards.map((c, i) => { const show = s.up.includes(i) || s.own[i] >= 0, o = s.own[i] >= 0 ? C.pl(s.ids[s.own[i]]).color : null;
        return `<button class="cell" ${Hub.A({ t: 'f', i })} ${show || !mine ? 'disabled' : ''} style="background:${show ? '#fff' : 'linear-gradient(135deg,#7c5cff,#ff5cb8)'};${o ? `box-shadow:inset 0 0 0 4px ${o};` : ''}border-radius:12px;transition:transform .3s;${show ? '' : 'font-size:0'}">${show ? c : '❔'}</button>`; }).join('')}</div></div>`;
    },
  });
})();

}catch(e){console.error('Game file memory.js failed to load',e)}
/* pig.js */
try{
(() => {
  const TARGET = 100;
  const CSS = `<style>
.pg{width:min(100%,560px);display:flex;flex-direction:column;gap:12px;align-items:center}
.pg-sc{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;width:100%}
.pg-p{position:relative;padding:8px 12px;border-radius:14px;background:var(--card);border:1px solid var(--line);overflow:hidden}
.pg-p.cur{border-color:var(--c);box-shadow:0 0 18px color-mix(in srgb,var(--c) 60%,transparent)}
.pg-p b{font-size:24px;float:right}.pg-p .bar{margin-top:6px;height:8px}.pg-p .bar>i{background:var(--c)}
.pg-die{width:min(40vw,150px);aspect-ratio:1;border-radius:22%;background:linear-gradient(145deg,#fff,#d8dcf5);box-shadow:0 10px 30px #0008,inset 0 -6px 12px #0002;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:12%;gap:4%}
.pg-die i{border-radius:50%;background:transparent}.pg-die i.on{background:radial-gradient(circle at 35% 30%,#555,#111)}
.pg-die.one i.on{background:radial-gradient(circle at 35% 30%,#ff7a8a,#d0102a)}
.pg-die.roll{animation:pgroll .7s cubic-bezier(.2,.8,.3,1)}
@keyframes pgroll{0%{transform:translateY(-60px) rotate(-360deg) scale(.6);opacity:.3}60%{transform:translateY(8px) rotate(30deg) scale(1.05);opacity:1}100%{transform:none}}
.pg-die.bust{animation:pgbust .6s}@keyframes pgbust{0%,100%{transform:none}20%{transform:translateX(-14px) rotate(-8deg)}40%{transform:translateX(14px) rotate(8deg)}60%{transform:translateX(-10px)}80%{transform:translateX(10px)}}
.pg-tt{font-size:clamp(18px,5vw,26px);font-weight:600}.pg-tt b{color:var(--warn);font-size:1.4em}
.pg-msg{min-height:26px;font-weight:600;text-align:center}
</style>`;
  const nxt = (s, H) => H.next(s.ids.map(id => ({ id })), s.turn);
  const die = (v, cls) => { const on = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[v] || []; return `<div class="pg-die ${cls} ${v === 1 ? 'one' : ''}">${[...Array(9).keys()].map(i => `<i class="${on.includes(i) ? 'on' : ''}"></i>`).join('')}</div>`; };
  let seen = null;
  const finish = (s) => {
    const idx = s.ids.map((id, i) => i).sort((a, b) => s.scores[b] - s.scores[a]);
    s.over = { title: '🏆 ' + 'Pig champion!', winners: [s.ids[idx[0]]], rows: idx.map(i => ({ pid: s.ids[i], text: s.scores[i] + ' pts' })) };
  };
  Hub.register({
    id: 'pig', name: 'Pig', cat: 'Cards & Dice', icon: '🐷', blurb: 'Push your luck: roll or hold. First to 100!', min: 2, max: 6,
    how: ['On your turn, <b>roll the die</b> as many times as you like.', 'Every roll adds to your <b>turn total</b>.', 'Roll a <b>1</b> and you lose the turn total and your turn ends!', '<b>Hold</b> to bank your turn total into your score.', 'First player to reach <b>100</b> wins.'],
    hz: 2,
    init(P) { return { ids: P.map(p => p.id), turn: 0, scores: P.map(() => 0), tt: 0, die: 0, rn: 0, ev: null, idle: 0, n: 0 }; },
    act(s, pid, a, H) {
      if (s.ids[s.turn] !== pid) return;
      if (a.t === 'roll') {
        const d = 1 + H.int(6); s.die = d; s.rn++; s.idle = 0;
        if (d === 1) { s.ev = { pid, k: 'bust', n: s.tt }; s.tt = 0; s.turn = nxt(s, H); }
        else { s.tt += d; s.ev = { pid, k: 'roll', n: d }; }
      } else if (a.t === 'hold') {
        if (s.tt <= 0) return;
        s.scores[s.turn] += s.tt; s.idle = 0; s.ev = { pid, k: 'hold', n: s.tt }; s.tt = 0; s.rn++;
        if (s.scores[s.ids.indexOf(pid)] >= TARGET) return finish(s);
        s.turn = nxt(s, H);
      }
    },
    tick(s, dt, H) {
      if (s.over) return;
      s.idle += dt;
      const pid = s.ids[s.turn];
      if (!H.online(pid)) { s.tt = 0; const t = nxt(s, H); if (t !== s.turn) { s.turn = t; s.idle = 0; } return; }
      if (s.idle > 45) { s.idle = 0; this.act(s, pid, s.tt > 0 ? { t: 'hold' } : { t: 'roll' }, H); }
    },
    bot(s, pid) {
      if (s.ids[s.turn] !== pid) return null;
      const me = s.scores[s.turn];
      if (s.tt > 0 && (s.tt >= 20 || me + s.tt >= TARGET)) return { t: 'hold' };
      return { t: 'roll' };
    },
    view(s, C) {
      const mine = C.me === s.ids[s.turn], cur = s.ids[s.turn], ev = s.ev || {};
      const key = s.rn + ':' + s.turn;
      if (seen !== null && seen !== key) C.sfx(ev.k === 'bust' ? 'bad' : ev.k === 'hold' ? 'good' : 'roll'); seen = key;
      const sc = s.ids.map((id, i) => { const p = C.pl(id); return `<div class="pg-p ${i === s.turn ? 'cur' : ''}" style="--c:${C.esc(p.color)}"><b>${s.scores[i]}</b>${C.chip(id)}<div class="bar"><i style="width:${Math.min(100, s.scores[i])}%"></i></div></div>`; }).join('');
      let msg = '';
      if (ev.k === 'bust') msg = `<span style="color:var(--bad)">💥 ${C.esc(C.pl(ev.pid).name)} rolled a 1 and lost ${ev.n}!</span>`;
      else if (ev.k === 'hold') msg = `<span style="color:var(--ok)">🏦 ${C.esc(C.pl(ev.pid).name)} banked ${ev.n}</span>`;
      const status = mine ? 'Your turn — roll or hold!' : `${C.esc(C.pl(cur).name)} is playing…`;
      return CSS + `<div class="pg"><div class="pg-sc">${sc}</div>
      <div class="turn ${mine ? 'mine' : ''}">${status}</div>
      ${s.die ? die(s.die, ev.k === 'bust' ? 'bust' : 'roll') : die(0, '')}
      <div class="pg-tt">Turn total: <b>${s.tt}</b></div><div class="pg-msg">${msg}</div>
      <div class="row" style="justify-content:center"><button class="btn big" ${Hub.A({ t: 'roll' })} ${mine ? '' : 'disabled'}>🎲 Roll</button><button class="btn ok big" ${Hub.A({ t: 'hold' })} ${mine && s.tt > 0 ? '' : 'disabled'}>🏦 Hold</button></div>
      <div class="muted">First to ${TARGET} wins</div></div>`;
    },
  });
})();

}catch(e){console.error('Game file pig.js failed to load',e)}
/* pong.js */
try{
(() => {
  const W = 100, HT = 64, PH = 14, PX = [4, 96], PW = 2.4, BR = 1.7, PSP = 100, B0 = 52, BMAX = 150, WIN = 7, CAP = 240;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function launch(s, H) {
    const a = (H.rand() - .5) * 0.7;
    s.b.vx = Math.cos(a) * B0 * s.sd; s.b.vy = Math.sin(a) * B0;
  }
  function point(s, w, H) {
    s.sc[w]++; s.pt++; s.sd = w ? -1 : 1; // serve towards the player who lost the point
    s.b = { x: W / 2, y: HT / 2, vx: 0, vy: 0 }; s.sv = 1.4; s.rl = 0;
    const done = s.sc[w] >= WIN || (s.t > CAP && s.sc[0] !== s.sc[1]);
    if (done) {
      const nm = i => 'Player ' + (i + 1);
      s.over = { title: '🏆 Winner: ' + (s.names ? s.names[w] : nm(w)), winners: [s.ids[w]], rows: s.ids.map((id, i) => ({ pid: id, text: s.sc[i] + ' pts' })) };
    }
  }

  Hub.register({
    id: 'pong', name: 'Neon Pong', cat: 'Action', icon: '🏓', blurb: 'Classic paddle duel. First to 7 wins.', min: 2, max: 2, hz: 30, botMs: 70,
    how: ['Two players: left paddle vs right paddle. Ball speeds up with every hit.', '<b>Touch:</b> drag your finger up/down on the court. <b>Mouse:</b> move over the court. <b>Keyboard:</b> W/S or Arrow Up/Down.', 'Miss the ball and your opponent scores. First to <b>7 points</b> wins.'],
    init(P, H) {
      const s = { ids: P.map(p => p.id), p: [HT / 2, HT / 2], tg: [HT / 2, HT / 2], b: { x: W / 2, y: HT / 2, vx: 0, vy: 0 }, sc: [0, 0], sv: 1.8, sd: H.rand() < .5 ? 1 : -1, hit: 0, hs: 0, wl: 0, pt: 0, rl: 0, t: 0 };
      return s;
    },
    act(s, pid, a, H) {
      if (!a || a.t !== 'y') return;
      const i = s.ids.indexOf(pid), v = +a.v; if (i < 0 || !Number.isFinite(v)) return;
      s.tg[i] = clamp(Math.round(v * 10) / 10, PH / 2, HT - PH / 2);
    },
    tick(s, dt, H) {
      if (s.over) return;
      s.t += dt;
      for (let i = 0; i < 2; i++) { const d = s.tg[i] - s.p[i], m = PSP * dt; s.p[i] = Math.abs(d) <= m ? s.tg[i] : s.p[i] + Math.sign(d) * m; }
      if (s.sv > 0) { s.sv -= dt; if (s.sv <= 0) { s.sv = 0; launch(s, H); } return; }
      const b = s.b, n = 4, h = dt / n;
      for (let k = 0; k < n; k++) {
        b.x += b.vx * h; b.y += b.vy * h;
        if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy); s.wl++; }
        if (b.y > HT - BR) { b.y = HT - BR; b.vy = -Math.abs(b.vy); s.wl++; }
        for (let i = 0; i < 2; i++) {
          const face = i ? PX[1] - PW / 2 : PX[0] + PW / 2;
          const toward = i ? b.vx > 0 : b.vx < 0;
          const reach = i ? b.x + BR >= face && b.x < PX[1] + PW : b.x - BR <= face && b.x > PX[0] - PW;
          if (toward && reach && Math.abs(b.y - s.p[i]) <= PH / 2 + BR * .8) {
            const sp = Math.min(BMAX, Math.hypot(b.vx, b.vy) * 1.06 + 1.5), off = clamp((b.y - s.p[i]) / (PH / 2 + BR), -1, 1), ang = off * 0.95;
            b.vx = Math.cos(ang) * sp * (i ? -1 : 1); b.vy = Math.sin(ang) * sp;
            b.x = i ? face - BR : face + BR; s.hit++; s.hs = i; s.rl++;
          }
        }
        if (b.x < -BR * 2) { point(s, 1, H); return; }
        if (b.x > W + BR * 2) { point(s, 0, H); return; }
      }
      b.x = Math.round(b.x * 100) / 100; b.y = Math.round(b.y * 100) / 100;
    },
    bot(s, pid, H) {
      const i = s.ids.indexOf(pid); if (i < 0 || s.over) return null;
      const b = s.b, myX = PX[i], toward = i ? b.vx > 0 : b.vx < 0;
      let ty = HT / 2;
      if (s.sv <= 0 && toward && Math.abs(b.vx) > 1) {
        const tt = Math.abs((myX - b.x) / b.vx); let y = b.y + b.vy * tt;
        const per = 2 * (HT - 2 * BR); y = ((y - BR) % per + per) % per; if (y > HT - 2 * BR) y = per - y; y += BR;
        ty = y + Math.sin(s.hit * 12.9898 + s.pt * 3.1 + i * 7) * 9;
      }
      ty = clamp(ty, PH / 2, HT - PH / 2);
      return Math.abs(ty - s.tg[i]) > 1.2 ? { t: 'y', v: Math.round(ty * 10) / 10 } : null;
    },
    mount(el, C) {
      if (!document.getElementById('pong-css')) {
        const st = document.createElement('style'); st.id = 'pong-css';
        st.textContent = `.pg{display:flex;flex-direction:column;align-items:center;gap:8px;width:min(98vw,900px);margin:0 auto;user-select:none;-webkit-user-select:none}
.pg-h{display:flex;align-items:center;justify-content:center;gap:clamp(8px,3vw,28px);width:100%;font:700 clamp(13px,3.4vw,18px) system-ui;color:#fff}
.pg-h .n{display:flex;align-items:center;gap:8px;min-width:0;max-width:34%;color:var(--c);text-shadow:0 0 10px var(--c)}
.pg-h .n span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pg-h .sc{font:900 clamp(34px,9vw,60px)/1 system-ui;color:var(--c);text-shadow:0 0 18px var(--c);min-width:.8em;text-align:center;transition:transform .2s}
.pg-h .sc.pop{transform:scale(1.35)}
.pg-h .vs{opacity:.5;font-size:12px}
.pg-cv{position:relative;width:min(98vw,900px,calc((100vh - 190px)*1.5625));min-width:300px;aspect-ratio:100/64;border-radius:14px;overflow:hidden;box-shadow:0 0 0 2px #ffffff22,0 0 40px #7c5cff55;touch-action:none;cursor:ns-resize}
.pg-cv canvas{width:100%;height:100%;display:block;touch-action:none}
.pg-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font:900 clamp(24px,7vw,54px) system-ui;color:#fff;text-shadow:0 0 18px #7c5cff;text-align:center}
.pg-hint{font:13px system-ui;color:#fff9;text-align:center}`;
        document.head.appendChild(st);
      }
      el.innerHTML = `<div class="pg"><div class="pg-h"><div class="n" id="pgn0"></div><div class="sc" id="pgs0">0</div><div class="vs">first to ${WIN}</div><div class="sc" id="pgs1">0</div><div class="n" id="pgn1" style="flex-direction:row-reverse"></div></div><div class="pg-cv"><canvas></canvas><div class="pg-ov"></div></div><div class="pg-hint"></div></div>`;
      const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), ov = el.querySelector('.pg-ov'), wrap = el.querySelector('.pg-cv'), hint = el.querySelector('.pg-hint');
      const sc0 = el.querySelector('#pgs0'), sc1 = el.querySelector('#pgs1'), n0 = el.querySelector('#pgn0'), n1 = el.querySelector('#pgn1');
      let s = null, alive = true, raf = 0, bx = { x: W / 2, y: HT / 2, vx: 0, vy: 0, t: 0 }, pd = [HT / 2, HT / 2], trail = [], parts = [], shake = 0, last = { hit: 0, wl: 0, pt: 0 }, lastT = performance.now();
      let tgt = HT / 2, sentV = -1, lastSend = 0, keyDir = 0, dragging = false, lastCd = -1, scLast = [0, 0];
      const my = () => (s ? s.ids.indexOf(C.me) : -1);
      const col = i => (s ? C.pl(s.ids[i]).color : '#fff');
      function sendY(force) {
        const now = performance.now(); if (my() < 0) return;
        const v = Math.round(tgt * 2) / 2; if (v === sentV) return;
        if (!force && now - lastSend < 33) return;
        sentV = v; lastSend = now; C.send({ t: 'y', v });
      }
      let pend = 0;
      function setTargetFromPointer(e) {
        const r = cv.getBoundingClientRect(); if (my() < 0) return;
        tgt = clamp((e.clientY - r.top) / r.height * HT, PH / 2, HT - PH / 2); sendY(false);
        clearTimeout(pend); pend = setTimeout(() => sendY(true), 40);
      }
      const pdn = e => { dragging = true; try { wrap.setPointerCapture(e.pointerId); } catch { } setTargetFromPointer(e); e.preventDefault(); };
      const pmv = e => { if (dragging || e.pointerType === 'mouse') setTargetFromPointer(e); };
      const pup = () => { dragging = false; };
      wrap.addEventListener('pointerdown', pdn); wrap.addEventListener('pointermove', pmv); wrap.addEventListener('pointerup', pup); wrap.addEventListener('pointercancel', pup);
      const KD = { w: -1, W: -1, ArrowUp: -1, s: 1, S: 1, ArrowDown: 1 };
      const kd = e => { const d = KD[e.key]; if (d === undefined || e.metaKey || e.ctrlKey) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return; e.preventDefault(); keyDir = d; };
      const ku = e => { const d = KD[e.key]; if (d !== undefined && d === keyDir) keyDir = 0; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      function burst(x, y, c, n, sp) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = (.3 + Math.random()) * sp; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c }); } }
      function frame(now) {
        if (!alive) return; raf = requestAnimationFrame(frame);
        const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
        if (!s) return;
        if (keyDir && my() >= 0) { tgt = clamp(tgt + keyDir * PSP * dt, PH / 2, HT - PH / 2); sendY(false); }
        const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
        const pw = Math.max(1, Math.round(r.width * dpr)), ph = Math.max(1, Math.round(r.height * dpr));
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        const u = pw / W; ctx.setTransform(1, 0, 0, 1, 0, 0);
        const g = ctx.createLinearGradient(0, 0, 0, ph); g.addColorStop(0, '#0d0a24'); g.addColorStop(1, '#050512'); ctx.fillStyle = g; ctx.fillRect(0, 0, pw, ph);
        if (shake > .3) { ctx.translate((Math.random() - .5) * shake * dpr, (Math.random() - .5) * shake * dpr); shake *= .86; }
        // paddles (smoothed)
        const m = my();
        for (let i = 0; i < 2; i++) {
          const target = i === m ? tgt : s.p[i]; // own paddle drawn at local intent for zero-lag feel, limited speed
          const k = 1 - Math.pow(.0005, dt); pd[i] += (i === m ? clamp(target - pd[i], -PSP * dt * 1.05, PSP * dt * 1.05) : (s.p[i] - pd[i]) * k);
        }
        // court
        ctx.strokeStyle = '#ffffff26'; ctx.lineWidth = 2 * dpr; ctx.setLineDash([8 * dpr, 10 * dpr]); ctx.beginPath(); ctx.moveTo(pw / 2, 0); ctx.lineTo(pw / 2, ph); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#7c5cff88'; ctx.lineWidth = 3 * dpr; ctx.shadowColor = '#7c5cff'; ctx.shadowBlur = 12 * dpr;
        ctx.beginPath(); ctx.moveTo(0, 1.5 * dpr); ctx.lineTo(pw, 1.5 * dpr); ctx.moveTo(0, ph - 1.5 * dpr); ctx.lineTo(pw, ph - 1.5 * dpr); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.font = `900 ${ph * .5}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = .07;
        ctx.fillStyle = col(0); ctx.fillText(s.sc[0], pw * .25, ph / 2); ctx.fillStyle = col(1); ctx.fillText(s.sc[1], pw * .75, ph / 2); ctx.globalAlpha = 1;
        // ball extrapolation
        let ex = bx.x, ey = bx.y; const e = Math.min(.12, (now - bx.t) / 1000);
        if (s.sv <= 0 && !s.over) {
          ex += bx.vx * e; ey += bx.vy * e;
          if (ey < BR) ey = 2 * BR - ey; if (ey > HT - BR) ey = 2 * (HT - BR) - ey;
        }
        trail.push([ex, ey]); if (trail.length > 14) trail.shift();
        const sp = Math.min(1, Math.hypot(bx.vx, bx.vy) / BMAX), bc = `hsl(${190 - sp * 190},100%,${65}%)`;
        for (let j = 0; j < trail.length; j++) { const f = j / trail.length; ctx.globalAlpha = f * .35; ctx.fillStyle = bc; ctx.beginPath(); ctx.arc(trail[j][0] * u, trail[j][1] * u, BR * u * f, 0, 6.28); ctx.fill(); }
        ctx.globalAlpha = 1;
        ctx.shadowColor = bc; ctx.shadowBlur = 20 * dpr; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex * u, ey * u, BR * u, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
        for (let i = 0; i < 2; i++) {
          const c = col(i), x = (PX[i] - PW / 2) * u, y = (pd[i] - PH / 2) * u, w = PW * u, h = PH * u;
          ctx.shadowColor = c; ctx.shadowBlur = 22 * dpr; ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, w / 2) : ctx.rect(x, y, w, h); ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff88'; ctx.fillRect(x + w * .25, y + h * .08, w * .22, h * .84);
          if (i === m) { ctx.strokeStyle = '#fff'; ctx.globalAlpha = .6; ctx.lineWidth = 2 * dpr; ctx.strokeRect(x - 3 * dpr, y - 3 * dpr, w + 6 * dpr, h + 6 * dpr); ctx.globalAlpha = 1; }
        }
        for (let j = parts.length - 1; j >= 0; j--) {
          const p = parts[j]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt * 2.2;
          if (p.l <= 0) { parts.splice(j, 1); continue; }
          ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x * u, p.y * u, u * .55 * p.l + 1, 0, 6.28); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
      function update(ns) {
        const first = !s; s = ns;
        bx = { x: ns.b.x, y: ns.b.y, vx: ns.b.vx, vy: ns.b.vy, t: performance.now() };
        if (first) { pd = ns.p.slice(); tgt = ns.p[Math.max(0, my())] || HT / 2; last = { hit: ns.hit, wl: ns.wl, pt: ns.pt }; scLast = ns.sc.slice(); }
        if (ns.hit !== last.hit) { last.hit = ns.hit; const i = ns.hs; burst(PX[i] + (i ? -2 : 2), ns.b.y, col(i), 10, 30); shake = Math.max(shake, 3); C.sfx('pop'); }
        if (ns.wl !== last.wl) { last.wl = ns.wl; C.sfx('tick'); }
        if (ns.pt !== last.pt) { last.pt = ns.pt; const w = ns.sc[0] !== scLast[0] ? 0 : 1; burst(w ? 4 : 96, HT / 2, col(w), 30, 60); shake = 12; C.sfx(my() === w ? 'good' : 'bad'); }
        n0.style.setProperty('--c', col(0)); n1.style.setProperty('--c', col(1)); sc0.style.setProperty('--c', col(0)); sc1.style.setProperty('--c', col(1));
        const t0 = `<span>${C.esc(C.pl(ns.ids[0]).name)}${my() === 0 ? ' (you)' : ''}</span>`, t1 = `<span>${C.esc(C.pl(ns.ids[1]).name)}${my() === 1 ? ' (you)' : ''}</span>`;
        if (n0.innerHTML !== t0) n0.innerHTML = t0; if (n1.innerHTML !== t1) n1.innerHTML = t1;
        for (const [elx, i] of [[sc0, 0], [sc1, 1]]) { if (+elx.textContent !== ns.sc[i]) { elx.textContent = ns.sc[i]; elx.classList.add('pop'); setTimeout(() => elx.classList.remove('pop'), 220); } }
        scLast = ns.sc.slice();
        let msg = ''; if (!ns.over && ns.sv > 0) { const c = Math.ceil(ns.sv); msg = ns.pt === 0 && c > 1 ? 'Get ready' : ''; if (c !== lastCd) { lastCd = c; } }
        if (ov.textContent !== msg) ov.textContent = msg;
        const h = my() < 0 ? 'Spectating' : 'Drag / move on the court, or use W/S or ↑/↓';
        if (hint.textContent !== h) hint.textContent = h;
      }
      update.destroy = () => { alive = false; cancelAnimationFrame(raf); clearTimeout(pend); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
      return update;
    },
  });
})();

}catch(e){console.error('Game file pong.js failed to load',e)}
/* racecore.js */
try{
/* Shared racing engine (track, physics, bots, controls, HUD) used by racing2d.js and racing3d.js */
(() => {
  const N = 180, W = 72, LAPS = 3, VMAX = 310;
  const center = Array.from({ length: N }, (_, i) => {
    const t = i / N * Math.PI * 2, r = 1 + .26 * Math.cos(2 * t + .6) + .1 * Math.sin(3 * t + 1);
    return { x: Math.cos(t) * r * 900, y: Math.sin(t) * r * 560 };
  });
  const ang = center.map((_, i) => { const a = center[(i + N - 1) % N], b = center[(i + 1) % N]; return Math.atan2(b.y - a.y, b.x - a.x); });
  const norm = ang.map(a => ({ x: -Math.sin(a), y: Math.cos(a) }));
  const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const hash = id => { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };

  function step(c, inp, dt) {
    const accel = inp.u ? 230 : 0, brake = inp.d ? 340 : 0;
    c.v += (accel - (c.v > 0 ? brake : -brake * .5) - c.v * .35) * dt;
    if (c.v < -80) c.v = -80;
    const steer = (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
    c.a += steer * 2.3 * dt * Math.max(-1, Math.min(1, c.v / 90)) * (1 - Math.min(.45, Math.abs(c.v) / 700));
    // progress along the centreline (search a window around the previous nearest sample)
    c.x += Math.cos(c.a) * c.v * dt; c.y += Math.sin(c.a) * c.v * dt;
    let bj = c.i, bd = 1e12;
    for (let k = -3; k <= 12; k++) { const j = (c.i + k + N) % N, dx = c.x - center[j].x, dy = c.y - center[j].y, d = dx * dx + dy * dy; if (d < bd) { bd = d; bj = j; } }
    let dlt = bj - c.i; if (dlt > N / 2) dlt -= N; if (dlt < -N / 2) dlt += N;
    c.p += dlt; c.i = bj;
    if (Math.sqrt(bd) > W + 6) { c.v *= 1 - 1.9 * dt; if (c.v > 120) c.v = 120 + (c.v - 120) * (1 - 3 * dt); c.off = 1; } else c.off = 0;
  }
  const r1 = n => Math.round(n * 10) / 10;

  const base = {
    cat: 'Racing', min: 1, max: 8, hz: 25, botMs: 60,
    how: ['Race <b>3 laps</b> around the circuit. Positions are shown live.', '<b>Keyboard:</b> ↑/W gas, ↓/S brake, ←/→ or A/D steer. <b>Touch:</b> use the pedals and arrows on screen.', 'Staying on the asphalt keeps you fast — grass slows you down.', 'The race ends when everyone finishes (or 25 seconds after the winner).'],
    init(P) {
      const cars = P.map((p, k) => {
        const idx = N - 2 - 2 * Math.floor(k / 2), side = k % 2 ? 1 : -1, o = 30 * side;
        return { x: r1(center[idx].x + norm[idx].x * o), y: r1(center[idx].y + norm[idx].y * o), a: +ang[idx].toFixed(3), v: 0, i: idx, p: idx - N, f: 0, off: 0, in: { u: 0, d: 0, l: 0, r: 0 } };
      });
      return { ids: P.map(p => p.id), cars, cd: 3.4, t: 0, fin: [], endAt: 0 };
    },
    act(s, pid, a) {
      if (a.t !== 'in') return; const c = s.cars[s.ids.indexOf(pid)]; if (!c) return;
      c.in = { u: a.u ? 1 : 0, d: a.d ? 1 : 0, l: a.l ? 1 : 0, r: a.r ? 1 : 0 };
    },
    tick(s, dt, H) {
      if (s.cd > 0) { s.cd -= dt; return; }
      s.t += dt;
      s.cars.forEach((c, k) => {
        step(c, c.f ? { d: 1 } : c.in, dt);
        c.x = r1(c.x); c.y = r1(c.y); c.a = +c.a.toFixed(3); c.v = r1(c.v);
        if (!c.f && c.p >= LAPS * N) { c.f = r1(s.t); s.fin.push(k); if (!s.endAt) s.endAt = s.t + 25; }
      });
      const waiting = s.cars.some((c, k) => !c.f && H.online(s.ids[k]));
      if (!waiting || (s.endAt && s.t > s.endAt) || s.t > 200) {
        const order = s.cars.map((c, k) => k).sort((a, b) => (s.cars[b].f ? 1e6 - s.cars[b].f : s.cars[b].p) - (s.cars[a].f ? 1e6 - s.cars[a].f : s.cars[a].p));
        s.over = { title: `🏁 ${s.ids.length > 1 ? 'Race finished!' : 'Lap complete!'}`, winners: [s.ids[order[0]]], rows: order.map((k, n) => ({ pid: s.ids[k], text: `${['🥇', '🥈', '🥉'][n] || n + 1 + '.'} ${s.cars[k].f ? s.cars[k].f + 's' : 'DNF'}` })) };
      }
    },
    bot(s, pid) {
      const k = s.ids.indexOf(pid), c = s.cars[k]; if (!c || s.cd > 0 || c.f) return { t: 'in', u: 0, d: 0, l: 0, r: 0 };
      const skill = .8 + (hash(pid) % 15) / 100, look = center[(c.i + 7) % N];
      const d = wrapA(Math.atan2(look.y - c.y, look.x - c.x) - c.a);
      return { t: 'in', u: c.v < VMAX * skill * (Math.abs(d) > .5 ? .6 : 1) ? 1 : 0, d: Math.abs(d) > .7 && c.v > 170 ? 1 : 0, l: d < -.04 ? 1 : 0, r: d > .04 ? 1 : 0 };
    },
    standings(s) { return s.cars.map((c, k) => k).sort((a, b) => (s.cars[b].f ? 1e6 - s.cars[b].f : s.cars[b].p) - (s.cars[a].f ? 1e6 - s.cars[a].f : s.cars[a].p)); },
  };

  function controls(root, send) {
    const st = { u: 0, d: 0, l: 0, r: 0 }; let last = '';
    const push = () => { const k = '' + st.u + st.d + st.l + st.r; if (k !== last) { last = k; send({ t: 'in', ...st }); } };
    const map = { ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
    const kd = e => { const k = map[e.key]; if (k) { st[k] = 1; push(); e.preventDefault(); } };
    const ku = e => { const k = map[e.key]; if (k) { st[k] = 0; push(); e.preventDefault(); } };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const pad = document.createElement('div'); pad.className = 'rc-pad';
    pad.innerHTML = `<div class="rc-g"><button data-k="l">◀</button><button data-k="r">▶</button></div><div class="rc-g"><button data-k="d">⏹<small>BRAKE</small></button><button data-k="u" class="gas">▲<small>GAS</small></button></div>`;
    pad.querySelectorAll('button').forEach(b => {
      const k = b.dataset.k, on = e => { st[k] = 1; b.classList.add('on'); push(); e.preventDefault(); }, off = e => { st[k] = 0; b.classList.remove('on'); push(); };
      b.addEventListener('pointerdown', on); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, off));
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
    root.appendChild(pad);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); pad.remove(); send({ t: 'in', u: 0, d: 0, l: 0, r: 0 }); };
  }
  const CSS = `.rc{position:relative;width:100%;max-width:1100px;margin:0 auto;border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#000;user-select:none;-webkit-user-select:none}
.rc canvas{display:block;width:100%;touch-action:none}
.rc-hud{position:absolute;left:10px;top:10px;display:flex;flex-direction:column;gap:6px;pointer-events:none;font-weight:600;text-shadow:0 2px 6px #000}
.rc-hud .b{background:#0009;border-radius:12px;padding:4px 12px;font-size:15px}.rc-hud .big{font-size:28px;line-height:1}
.rc-board{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:4px;pointer-events:none;font-size:13px}
.rc-board div{background:#0009;border-radius:10px;padding:3px 10px;display:flex;gap:6px;align-items:center}.rc-board i{width:10px;height:10px;border-radius:50%;display:inline-block}
.rc-cd{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(60px,18vw,150px);font-weight:700;color:#fff;text-shadow:0 0 30px #7c5cff,0 4px 0 #0008;pointer-events:none}
.rc-pad{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:space-between;padding:0 10px;pointer-events:none}
.rc-g{display:flex;gap:10px}.rc-pad button{pointer-events:auto;width:clamp(58px,17vw,84px);height:clamp(58px,17vw,84px);border-radius:50%;border:2px solid #fff7;background:#ffffff26;color:#fff;font-size:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(4px);touch-action:none}
.rc-pad button small{font-size:9px;letter-spacing:1px}.rc-pad button.gas{background:#3ddc9755}.rc-pad button.on{background:#fff5;transform:scale(.94)}
@media(hover:hover) and (pointer:fine){.rc-pad{opacity:.55}}`;
  const hud = (s, C, hudEl, boardEl, cdEl, mine) => {
    const order = base.standings(s), me = s.ids.indexOf(C.me), c = s.cars[me];
    const pos = order.indexOf(me) + 1, lap = c ? Math.max(1, Math.min(LAPS, Math.floor(c.p / N) + 1)) : 0;
    hudEl.innerHTML = c ? `<div class="b big">${pos}<small>/${s.ids.length}</small></div><div class="b">Lap ${lap}/${LAPS}</div><div class="b">${Math.round(Math.abs(c.v) * .6)} km/h</div>` : '<div class="b">👀 Spectating</div>';
    boardEl.innerHTML = order.slice(0, 6).map((k, n) => `<div><span>${n + 1}</span><i style="background:${C.pl(s.ids[k]).color}"></i>${C.esc(C.pl(s.ids[k]).name)}${s.cars[k].f ? ' 🏁' : ''}</div>`).join('');
    cdEl.textContent = s.cd > 0 ? Math.ceil(s.cd) : (s.t < .8 ? 'GO!' : '');
  };
  window.RaceCore = { N, W, LAPS, center, ang, norm, base, controls, CSS, hud, wrapA };
})();

}catch(e){console.error('Game file racecore.js failed to load',e)}
/* racing2d.js */
try{
(() => {
  const R = RaceCore, { N, W, center, ang } = R;
  Hub.register({
    ...R.base, id: 'racing2d', name: 'Turbo Circuit 2D', icon: '🏎️', blurb: 'Top-down arcade racing, 3 laps, up to 8 cars.',
    mount(el, C) {
      el.innerHTML = `<style>${R.CSS}</style><div class="rc"><canvas></canvas><div class="rc-hud"></div><div class="rc-board"></div><div class="rc-cd"></div></div>`;
      const wrap = el.querySelector('.rc'), cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
      const hudEl = el.querySelector('.rc-hud'), boardEl = el.querySelector('.rc-board'), cdEl = el.querySelector('.rc-cd');
      const stopCtl = C.spectator ? () => { } : R.controls(wrap, C.send);
      let S = null, raf = 0, dead = false, last = performance.now(); const disp = {}; let cam = { x: 0, y: 0 };
      const resize = () => { const w = wrap.clientWidth || 800, h = Math.round(Math.max(300, Math.min(w * .62, innerHeight * .72))), d = Math.min(devicePixelRatio || 1, 2); cv.width = w * d; cv.height = h * d; cv.style.height = h + 'px'; };
      resize(); const ro = new ResizeObserver(resize); ro.observe(wrap);
      const path = () => { ctx.beginPath(); center.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); };
      const trees = Array.from({ length: 140 }, (_, i) => { const k = (i * 37) % N, s = i % 2 ? 1 : -1, o = (W + 60 + (i * 53) % 260) * s; return { x: center[k].x + R.norm[k].x * o, y: center[k].y + R.norm[k].y * o, r: 14 + (i * 7) % 12 }; });
      function frame(now) {
        if (dead) return; raf = requestAnimationFrame(frame);
        const dt = Math.min(.05, (now - last) / 1000); last = now; const s = S; if (!s) return;
        const k = 1 - Math.exp(-dt * 14);
        s.cars.forEach((c, i) => { const d = disp[i] || (disp[i] = { x: c.x, y: c.y, a: c.a }); d.x += (c.x - d.x) * k; d.y += (c.y - d.y) * k; d.a += R.wrapA(c.a - d.a) * k; });
        const me = s.ids.indexOf(C.me), W_ = cv.width, H_ = cv.height, dpr = W_ / cv.clientWidth;
        const zoom = Math.max(.42, Math.min(.95, cv.clientWidth / 1000)) * dpr * (me >= 0 ? 1 : .0 + .5);
        const tgt = me >= 0 && disp[me] ? { x: disp[me].x + Math.cos(disp[me].a) * 80, y: disp[me].y + Math.sin(disp[me].a) * 80 } : { x: 0, y: 0 };
        cam.x += (tgt.x - cam.x) * Math.min(1, dt * 8); cam.y += (tgt.y - cam.y) * Math.min(1, dt * 8);
        const z = me >= 0 ? zoom : Math.min(W_ / 2500, H_ / 1600);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#2f8f4e'; ctx.fillRect(0, 0, W_, H_);
        ctx.setTransform(z, 0, 0, z, W_ / 2 - cam.x * z, H_ / 2 - cam.y * z);
        ctx.fillStyle = '#287a42'; for (const t of trees) { ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 4, 0, 7); ctx.fillStyle = '#1f6b38'; ctx.fill(); ctx.beginPath(); ctx.arc(t.x - 2, t.y - 2, t.r, 0, 7); ctx.fillStyle = '#2a9150'; ctx.fill(); }
        ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
        path(); ctx.strokeStyle = '#d33'; ctx.lineWidth = W * 2 + 20; ctx.stroke();
        path(); ctx.strokeStyle = '#fff'; ctx.lineWidth = W * 2 + 20; ctx.setLineDash([28, 28]); ctx.stroke(); ctx.setLineDash([]);
        path(); ctx.strokeStyle = '#3a3f4f'; ctx.lineWidth = W * 2; ctx.stroke();
        path(); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 4; ctx.setLineDash([30, 40]); ctx.stroke(); ctx.setLineDash([]);
        const sp = center[0], sa = ang[0]; ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(sa);
        for (let r = 0; r < 8; r++) for (let q = 0; q < 2; q++) { ctx.fillStyle = (r + q) % 2 ? '#fff' : '#111'; ctx.fillRect(-10 + q * 10, -W + r * (W * 2 / 8), 10, W * 2 / 8); } ctx.restore();
        const order = s.cars.map((c, i) => i).sort((a, b) => (i => s.cars[i].y)(a) - (i => s.cars[i].y)(b));
        for (const i of order) {
          const d = disp[i], col = C.pl(s.ids[i]).color; if (!d) continue;
          ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
          ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.roundRect(-20, -10, 46, 26, 8); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-24, -13, 48, 26, 8); ctx.fill();
          ctx.fillStyle = '#0b0d1fcc'; ctx.beginPath(); ctx.roundRect(-6, -9, 14, 18, 4); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillRect(20, -11, 4, 6); ctx.fillRect(20, 5, 4, 6);
          if (s.cars[i].in.d) { ctx.fillStyle = '#f33'; ctx.fillRect(-26, -11, 3, 6); ctx.fillRect(-26, 5, 3, 6); }
          ctx.restore();
          if (i === me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(d.x, d.y, 34, 0, 7); ctx.stroke(); }
          ctx.fillStyle = '#fff'; ctx.font = '600 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText(C.pl(s.ids[i]).name, d.x, d.y - 30);
        }
      }
      raf = requestAnimationFrame(frame);
      const update = s => { S = s; R.hud(s, C, hudEl, boardEl, cdEl); };
      update.destroy = () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); stopCtl(); };
      return update;
    },
  });
})();

}catch(e){console.error('Game file racing2d.js failed to load',e)}
/* racing3d.js */
try{
(() => {
  const R = RaceCore, { N, W, center, ang, norm } = R;
  Hub.register({
    ...R.base, id: 'racing3d', name: 'Turbo Circuit 3D', icon: '🏁', blurb: 'Real 3D chase-cam racing, 3 laps, up to 8 cars.',
    mount(el, C) {
      el.innerHTML = `<style>${R.CSS}</style><div class="rc"><div class="rc-cv"></div><div class="rc-hud"></div><div class="rc-board"></div><div class="rc-cd"></div></div>`;
      const wrap = el.querySelector('.rc'), host = el.querySelector('.rc-cv');
      const hudEl = el.querySelector('.rc-hud'), boardEl = el.querySelector('.rc-board'), cdEl = el.querySelector('.rc-cd');
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { el.innerHTML = '<div class="panel">⚠ Your browser/device could not start 3D graphics. Try <b>Turbo Circuit 2D</b> instead.</div>'; return () => { }; }
      host.appendChild(renderer.domElement); renderer.domElement.style.cssText = 'display:block;width:100%';
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fd3ff); scene.fog = new THREE.Fog(0x8fd3ff, 700, 3200);
      const cam = new THREE.PerspectiveCamera(65, 1.6, 5, 6000);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7a4a, .85)); const sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(500, 900, 300); scene.add(sun);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshLambertMaterial({ color: 0x2f9a52 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -1; scene.add(ground);
      function ribbon(half, y, colorFn) {
        const pos = [], col = [], idx = [];
        for (let i = 0; i <= N; i++) {
          const k = i % N, p = center[k], n = norm[k], c = colorFn(i);
          pos.push(p.x - n.x * half, y, p.y - n.y * half, p.x + n.x * half, y, p.y + n.y * half); col.push(...c, ...c);
          if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
        return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      }
      scene.add(ribbon(W + 18, 0, i => (i >> 1) % 2 ? [.85, .1, .1] : [.95, .95, .95]));
      scene.add(ribbon(W, .6, i => (i % 2 ? [.23, .25, .31] : [.21, .23, .29])));
      const dash = ribbon(3, 1, i => (i % 4 < 2 ? [.9, .9, .9] : [.25, .27, .33])); scene.add(dash);
      { const p = center[0], a = ang[0]; const line = new THREE.Mesh(new THREE.PlaneGeometry(14, W * 2), new THREE.MeshBasicMaterial({ color: 0xffffff })); line.rotation.x = -Math.PI / 2; line.rotation.z = a; line.position.set(p.x, 1.4, p.y); scene.add(line);
        const gm = new THREE.MeshLambertMaterial({ color: 0x222233 }); for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(8, 130, 8), gm); post.position.set(p.x + norm[0].x * (W + 24) * s, 65, p.y + norm[0].y * (W + 24) * s); scene.add(post); }
        const bar = new THREE.Mesh(new THREE.BoxGeometry(10, 26, W * 2 + 56), new THREE.MeshLambertMaterial({ color: 0xff5cb8 })); bar.position.set(p.x, 135, p.y); bar.rotation.y = -a + Math.PI; bar.rotation.y = -(a - Math.PI / 2) + Math.PI / 2 * 0; bar.rotation.set(0, -a, 0); scene.add(bar); }
      const tMat = new THREE.MeshLambertMaterial({ color: 0x1f7a3a }), tkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
      for (let i = 0; i < 160; i++) { const k = (i * 37) % N, s = i % 2 ? 1 : -1, o = (W + 80 + (i * 53) % 420) * s; const g = new THREE.Group(); const h = 50 + (i * 11) % 50;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(26, h, 7), tMat); cone.position.y = h / 2 + 14; const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 16, 6), tkMat); trunk.position.y = 8; g.add(cone, trunk); g.position.set(center[k].x + norm[k].x * o, 0, center[k].y + norm[k].y * o); scene.add(g); }
      const carMeshes = [], wheelGeo = new THREE.CylinderGeometry(7, 7, 6, 12), wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      function makeCar(color) {
        const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(46, 11, 24), new THREE.MeshLambertMaterial({ color })); body.position.y = 11; g.add(body);
        const cab = new THREE.Mesh(new THREE.BoxGeometry(20, 9, 19), new THREE.MeshLambertMaterial({ color: 0x1a2236 })); cab.position.set(-3, 20, 0); g.add(cab);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 26), new THREE.MeshLambertMaterial({ color })); wing.position.set(-23, 20, 0); g.add(wing);
        for (const [x, z] of [[14, 13], [14, -13], [-14, 13], [-14, -13]]) { const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.x = Math.PI / 2; w.position.set(x, 7, z); g.add(w); }
        const mk = new THREE.Mesh(new THREE.ConeGeometry(7, 16, 4), new THREE.MeshBasicMaterial({ color })); mk.rotation.x = Math.PI; mk.position.y = 52; g.add(mk);
        scene.add(g); return g;
      }
      const resize = () => { const w = wrap.clientWidth || 800, h = Math.round(Math.max(320, Math.min(w * .62, innerHeight * .72))); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(w, h, false); renderer.domElement.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); };
      resize(); const ro = new ResizeObserver(resize); ro.observe(wrap);
      const stopCtl = C.spectator ? () => { } : R.controls(wrap, C.send);
      let S = null, raf = 0, dead = false, last = performance.now(); const disp = [], camPos = new THREE.Vector3(0, 800, 900); let camInit = false;
      function frame(now) {
        if (dead) return; raf = requestAnimationFrame(frame);
        const dt = Math.min(.05, (now - last) / 1000); last = now; const s = S; if (!s) return;
        const k = 1 - Math.exp(-dt * 14);
        s.cars.forEach((c, i) => {
          if (!carMeshes[i]) carMeshes[i] = makeCar(new THREE.Color(C.pl(s.ids[i]).color));
          const d = disp[i] || (disp[i] = { x: c.x, y: c.y, a: c.a }); d.x += (c.x - d.x) * k; d.y += (c.y - d.y) * k; d.a += R.wrapA(c.a - d.a) * k;
          carMeshes[i].position.set(d.x, 0, d.y); carMeshes[i].rotation.y = -d.a;
          carMeshes[i].children[0].rotation.z = (c.in.r - c.in.l) * -.04;
        });
        const me = s.ids.indexOf(C.me);
        if (me >= 0 && disp[me]) {
          const d = disp[me], fx = Math.cos(d.a), fy = Math.sin(d.a), sp = Math.min(1, Math.abs(s.cars[me].v) / 300);
          const want = new THREE.Vector3(d.x - fx * (120 + 30 * sp), 62 + 10 * sp, d.y - fy * (120 + 30 * sp));
          if (!camInit) { camPos.copy(want); camInit = true; } else camPos.lerp(want, Math.min(1, dt * 7));
          cam.position.copy(camPos); cam.lookAt(d.x + fx * 90, 18, d.y + fy * 90); cam.fov = 62 + 14 * sp; cam.updateProjectionMatrix();
        } else { const t = now / 9000; cam.position.set(Math.cos(t) * 1500, 1100, Math.sin(t) * 1000); cam.lookAt(0, 0, 0); }
        renderer.render(scene, cam);
      }
      raf = requestAnimationFrame(frame);
      const update = s => { S = s; R.hud(s, C, hudEl, boardEl, cdEl); };
      update.destroy = () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); stopCtl(); try { scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); renderer.forceContextLoss(); } catch { } };
      return update;
    },
  });
})();

}catch(e){console.error('Game file racing3d.js failed to load',e)}
/* reaction.js */
try{
(() => {
  const hash = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  Hub.register({
    id: 'reaction', name: 'Reaction Duel', cat: 'Action', icon: '⚡', blurb: 'Wait for green — tap first!', min: 2, max: 10, hz: 20, botMs: 40,
    how: ['The screen starts <b style="color:#ff5d73">red</b>. <b>Do not tap!</b>', 'When it turns <b style="color:#3ddc97">GREEN</b>, tap as fast as you can.', 'First tap scores a point. Tapping early costs you a point and locks you out of that round.', '7 rounds — most points wins.'],
    init(P, H) { return { ids: P.map(p => p.id), ph: 'wait', wt: 2 + H.rand() * 4, gt: 0, sc: P.map(() => 0), lock: P.map(() => 0), win: -1, ms: 0, rd: 1, rt: 0 }; },
    tick(s, dt, H) {
      if (s.ph === 'wait') { s.wt -= dt; if (s.wt <= 0) { s.ph = 'go'; s.gt = 0; } }
      else if (s.ph === 'go') { s.gt += dt; if (s.gt > 4) { s.ph = 'res'; s.rt = 1.8; } }
      else { s.rt -= dt; if (s.rt <= 0) { if (s.rd >= 7) { const m = Math.max(...s.sc); s.over = { title: '⚡ Fastest finger!', winners: s.ids.filter((_, k) => s.sc[k] === m), rows: s.ids.map((id, k) => ({ pid: id, text: s.sc[k] + ' pts' })) }; return; } s.rd++; s.ph = 'wait'; s.wt = 2 + H.rand() * 4; s.win = -1; s.lock = s.lock.map(() => 0); } }
    },
    act(s, pid, a) {
      if (a.t !== 'tap') return; const k = s.ids.indexOf(pid); if (k < 0 || s.lock[k]) return;
      if (s.ph === 'wait') { s.lock[k] = 1; s.sc[k]--; } else if (s.ph === 'go') { s.win = k; s.ms = Math.round(s.gt * 1000); s.sc[k]++; s.ph = 'res'; s.rt = 2; }
    },
    bot(s, pid) { return s.ph === 'go' && s.gt > .25 + (hash(pid) % 20) / 100 + Math.random() * .08 ? { t: 'tap' } : null; },
    view(s, C) {
      const me = C.seat(C.me), bg = s.ph === 'go' ? '#1fbf7a' : s.ph === 'res' ? '#3d4a8a' : '#d63a52';
      const txt = s.ph === 'wait' ? (me >= 0 && s.lock[me] ? '🚫 Too early! Wait…' : 'Wait for green…') : s.ph === 'go' ? 'TAP NOW!' : s.win >= 0 ? `${C.esc(C.pl(s.ids[s.win]).name)} — ${s.ms} ms` : 'Nobody tapped';
      return `<div class="stack"><div class="scores">${s.ids.map((id, k) => `<div class="score">${C.chip(id)} <b>${s.sc[k]}</b></div>`).join('')}</div>
      <button ${Hub.A({ t: 'tap' })} style="width:min(94vw,640px);height:min(52vh,380px);border:0;border-radius:28px;background:${bg};color:#fff;font:700 clamp(26px,6vw,48px) var(--font);cursor:pointer;box-shadow:0 10px 40px ${bg}88;transition:background .08s;touch-action:manipulation">${txt}</button><div class="muted">Round ${s.rd}/7</div></div>`;
    },
  });
})();

}catch(e){console.error('Game file reaction.js failed to load',e)}
/* reversi.js */
try{
(() => {
  const D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const flips = (b, i, pl) => { const r = i >> 3, c = i & 7, out = []; if (b[i]) return out; for (const [dr, dc] of D) { const t = []; let y = r + dr, x = c + dc; while (y >= 0 && y < 8 && x >= 0 && x < 8 && b[y * 8 + x] === 3 - pl) { t.push(y * 8 + x); y += dr; x += dc; } if (t.length && y >= 0 && y < 8 && x >= 0 && x < 8 && b[y * 8 + x] === pl) out.push(...t); } return out; };
  const legal = (b, pl) => b.map((_, i) => i).filter(i => flips(b, i, pl).length);
  const count = (b, p) => b.filter(x => x === p).length;
  function finish(s) { const a = count(s.b, 1), c = count(s.b, 2), rows = s.ids.map((id, k) => ({ pid: id, text: (k ? c : a) + ' discs' })); s.over = a === c ? { title: '🤝 It\'s a draw!', winners: [], rows } : { title: '🏆 Reversi winner!', winners: [s.ids[a > c ? 0 : 1]], rows }; }
  Hub.register({
    id: 'reversi', name: 'Reversi', cat: 'Board', icon: '⚫', blurb: 'Flank discs to flip them. Own the most.', min: 2, max: 2,
    how: ['Players alternate placing a disc; <b>⚫ goes first</b>.', 'A legal move must <b>flank</b> one or more enemy discs in a straight line — they flip to your colour.', 'Tap a highlighted square to play. If you have no legal move your turn is skipped.', 'When the board is full or nobody can move, most discs wins.'],
    init(P) { const b = Array(64).fill(0); b[27] = b[36] = 2; b[28] = b[35] = 1; return { ids: P.map(p => p.id), b, turn: 0, last: -1, msg: '' }; },
    act(s, pid, a) {
      if (a.t !== 'm' || s.ids.indexOf(pid) !== s.turn) return; const i = a.i | 0, pl = s.turn + 1; if (i < 0 || i > 63) return; const f = flips(s.b, i, pl); if (!f.length) return;
      s.b[i] = pl; f.forEach(k => s.b[k] = pl); s.last = i; s.turn = 1 - s.turn; s.msg = '';
      if (!legal(s.b, s.turn + 1).length) { if (!legal(s.b, 2 - s.turn).length) finish(s); else { s.msg = `${s.turn ? 'White' : 'Black'} has no move — turn skipped`; s.turn = 1 - s.turn; } }
    },
    bot(s, pid) {
      if (s.ids.indexOf(pid) !== s.turn) return null; const pl = s.turn + 1, L = legal(s.b, pl); if (!L.length) return null;
      let best = L[0], bs = -1; for (const i of L) { const corner = [0, 7, 56, 63].includes(i), edge = (i >> 3) % 7 === 0 || (i & 7) % 7 === 0; const sc = flips(s.b, i, pl).length + (corner ? 30 : 0) + (edge ? 3 : 0) + Math.random() * 2; if (sc > bs) { bs = sc; best = i; } }
      return { t: 'm', i: best };
    },
    view(s, C) {
      const me = C.seat(C.me), mine = me === s.turn && !s.over, L = mine ? legal(s.b, s.turn + 1) : [];
      const cells = s.b.map((v, i) => `<button class="cell" ${Hub.A({ t: 'm', i })} ${L.includes(i) ? '' : 'disabled'} style="background:${i === s.last ? '#2a8a5a' : '#1f7a4d'};border-radius:4px">${v ? `<span style="width:78%;aspect-ratio:1;border-radius:50%;background:${v === 1 ? 'radial-gradient(circle at 35% 30%,#555,#000)' : 'radial-gradient(circle at 35% 30%,#fff,#bbb)'};box-shadow:0 2px 5px #0008;animation:pop .25s"></span>` : L.includes(i) ? '<span style="width:24%;aspect-ratio:1;border-radius:50%;background:#ffffff66"></span>' : ''}</button>`).join('');
      return `<div class="stack"><div class="scores">${s.ids.map((id, k) => `<div class="score ${s.turn === k && !s.over ? 'cur' : ''}">${k ? '⚪' : '⚫'} ${C.chip(id)} <b>${count(s.b, k + 1)}</b></div>`).join('')}</div>
      <div class="turn ${mine ? 'mine' : ''}">${s.over ? 'Game over' : mine ? 'Your turn!' : C.esc(C.pl(s.ids[s.turn]).name) + "'s turn"}</div>${s.msg ? `<div class="muted">${C.esc(s.msg)}</div>` : ''}
      <div class="board" style="grid-template-columns:repeat(8,1fr);width:min(94vw,520px);background:#145c3a">${cells}</div></div>`;
    },
  });
})();

}catch(e){console.error('Game file reversi.js failed to load',e)}
/* rps.js */
try{
(() => {
  const TARGET = 5, PICK_T = 10, MAXR = 30;
  const EM = { R: '🪨', P: '📄', S: '✂️' }, NM = { R: 'Rock', P: 'Paper', S: 'Scissors' }, BEATS = { R: 'S', P: 'R', S: 'P' };
  const CSS = `<style>
.rp{width:min(100%,560px);display:flex;flex-direction:column;gap:12px;align-items:center}
.rp-sc{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;width:100%}
.rp-p{padding:8px 10px;border-radius:14px;background:var(--card);border:2px solid var(--line);display:flex;flex-direction:column;align-items:center;gap:4px;transition:all .25s;position:relative}
.rp-p.win{border-color:var(--ok);box-shadow:0 0 22px #3ddc9788;transform:translateY(-3px)}
.rp-p.lose{opacity:.55}.rp-p.off{opacity:.35}
.rp-p .hand{font-size:clamp(34px,10vw,52px);line-height:1.1;height:1.2em}
.rp-p .hand.wait{animation:rpbob 1s infinite}.rp-p .hand.fist{animation:rpshake .35s infinite}
.rp-p .hand.show{animation:rppop .5s cubic-bezier(.2,.9,.3,1.3)}
.rp-p .pts{font-size:13px;color:var(--muted)}.rp-p .pts b{color:var(--txt);font-size:17px}
.rp-p .bar{width:100%;height:8px}.rp-p .bar>i{background:var(--c)}
@keyframes rpbob{50%{transform:translateY(-5px);opacity:.6}}
@keyframes rpshake{0%,100%{transform:rotate(-12deg) translateY(0)}50%{transform:rotate(12deg) translateY(-8px)}}
@keyframes rppop{0%{transform:scale(.2) rotate(-90deg);opacity:0}100%{transform:none;opacity:1}}
.rp-ch{display:flex;gap:clamp(8px,3vw,18px);justify-content:center}
.rp-ch button{width:clamp(80px,26vw,128px);aspect-ratio:1;border-radius:26px;border:3px solid var(--line);background:var(--card);font-size:clamp(40px,12vw,64px);cursor:pointer;transition:transform .12s,border-color .12s,background .12s;display:grid;place-items:center;color:inherit;padding:0}
.rp-ch button small{font-size:13px;color:var(--muted);margin-top:-6px}
.rp-ch button:hover:not(:disabled){transform:translateY(-6px) scale(1.05);border-color:var(--a);background:var(--card2)}
.rp-ch button.sel{border-color:var(--ok);background:#3ddc9733;transform:scale(1.06)}
.rp-ch button:disabled{cursor:default}.rp-ch button:disabled:not(.sel){opacity:.45}
.rp-res{min-height:28px;font-size:clamp(16px,4.5vw,22px);font-weight:600;text-align:center}
.rp-t{width:100%;max-width:360px}.rp-t>i{background:linear-gradient(90deg,var(--warn),var(--bad))!important}
</style>`;
  let seen = '';
  const resolve = (s, H) => {
    const idx = s.ids.map((_, i) => i).filter(i => s.picks[i]);
    const kinds = [...new Set(idx.map(i => s.picks[i]))];
    s.win = []; s.k = '';
    if (kinds.length === 2) { const w = BEATS[kinds[0]] === kinds[1] ? kinds[0] : kinds[1]; s.win = idx.filter(i => s.picks[i] === w); s.k = w; s.win.forEach(i => s.scores[i]++); }
    s.phase = 'reveal'; s.rn++;
    const top = Math.max(...s.scores);
    const end = top >= TARGET || s.round >= MAXR;
    if (end) {
      H.after(2600, () => {
        const order = s.ids.map((_, i) => i).sort((a, b) => s.scores[b] - s.scores[a]);
        const ws = order.filter(i => s.scores[i] === top).map(i => s.ids[i]);
        s.over = { title: ws.length > 1 ? '🤝 It\'s a tie!' : '🏆 Rock-paper-scissors champion!', winners: ws, rows: order.map(i => ({ pid: s.ids[i], text: s.scores[i] + ' pts' })) };
      });
    } else H.after(2600, () => { s.round++; s.phase = 'pick'; s.picks = s.ids.map(() => ''); s.win = []; s.k = ''; s.t = PICK_T; });
  };
  const check = (s, H) => {
    if (s.phase !== 'pick') return;
    const need = s.ids.filter((id, i) => H.online(id));
    if (need.length && need.every(id => s.picks[s.ids.indexOf(id)])) resolve(s, H);
    else if (!need.length) { s.picks = s.ids.map(() => ''); }
  };
  const G = {
    id: 'rps', name: 'Rock Paper Scissors', cat: 'Party', icon: '✂️', blurb: 'Everyone picks in secret. First to 5 wins!', min: 2, max: 8,
    how: ['Everyone secretly picks <b>🪨 Rock, 📄 Paper or ✂️ Scissors</b> at the same time.', 'When all picks are in, they are revealed together.', 'Rock beats Scissors, Scissors beats Paper, Paper beats Rock.', 'If all three kinds appear (or everyone picks the same), the round is a <b>draw</b>.', 'Win a round = <b>+1 point</b>. First to <b>5</b> wins!', `You have ${PICK_T} seconds per round — otherwise a random pick is made.`],
    hz: 2,
    init(P) { return { ids: P.map(p => p.id), scores: P.map(() => 0), picks: P.map(() => ''), phase: 'pick', round: 1, rn: 0, win: [], k: '', t: PICK_T }; },
    act(s, pid, a, H) {
      if (s.over || s.phase !== 'pick' || a.t !== 'pick') return;
      const i = s.ids.indexOf(pid); if (i < 0 || s.picks[i] || !EM[a.v]) return;
      s.picks[i] = a.v; check(s, H);
    },
    tick(s, dt, H) {
      if (s.over || s.phase !== 'pick') return;
      s.t -= dt; check(s, H);
      if (s.phase === 'pick' && s.t <= 0) {
        s.ids.forEach((id, i) => { if (!s.picks[i] && H.online(id)) s.picks[i] = 'RPS'[H.int(3)]; });
        check(s, H);
        if (s.phase === 'pick') s.t = PICK_T;
      }
    },
    bot(s, pid, H) {
      const i = s.ids.indexOf(pid); if (i < 0 || s.over || s.phase !== 'pick' || s.picks[i]) return null;
      return { t: 'pick', v: 'RPS'[Math.floor(Math.random() * 3)] };
    },
    view(s, C) {
      const me = s.ids.indexOf(C.me), rev = s.phase === 'reveal', mine = me >= 0 ? s.picks[me] : '';
      const key = s.round + ':' + s.phase + ':' + s.rn;
      if (seen !== key) { if (rev && seen) C.sfx(me >= 0 && s.win.includes(me) ? 'good' : s.win.length ? 'bad' : 'tick'); seen = key; }
      const cards = s.ids.map((id, i) => {
        const p = C.pl(id), pk = s.picks[i];
        let hand, cls = '';
        if (rev) { hand = pk ? `<div class="hand show">${EM[pk]}</div>` : '<div class="hand">💤</div>'; cls = !pk ? 'off' : s.win.includes(i) ? 'win' : s.win.length ? 'lose' : ''; }
        else hand = pk ? '<div class="hand fist">✊</div>' : `<div class="hand wait">${p.online === false ? '💤' : '🤔'}</div>`;
        return `<div class="rp-p ${cls}" style="--c:${C.esc(p.color)}">${C.chip(id)}${hand}<div class="pts"><b>${s.scores[i]}</b> / ${TARGET}</div><div class="bar"><i style="width:${Math.min(100, s.scores[i] / TARGET * 100)}%"></i></div></div>`;
      }).join('');
      let res = '';
      if (rev) res = s.win.length ? `${EM[s.k]} ${NM[s.k]} wins! ${s.win.map(i => C.chip(s.ids[i])).join(' ')} +1` : 'Draw — nobody scores 🤝';
      else if (me < 0) res = 'Waiting for picks…';
      else if (mine) res = `You picked ${EM[mine]} — waiting for others (${s.picks.filter(Boolean).length}/${s.ids.length})`;
      else res = 'Pick your move!';
      const btns = ['R', 'P', 'S'].map(k => `<button ${Hub.A({ t: 'pick', v: k })} class="${mine === k || (rev && me >= 0 && s.picks[me] === k) ? 'sel' : ''}" ${me < 0 || mine || rev ? 'disabled' : ''}>${EM[k]}<small>${NM[k]}</small></button>`).join('');
      return CSS + `<div class="rp"><div class="rp-sc">${cards}</div>
        <div class="turn ${me >= 0 && !mine && !rev ? 'mine' : ''}">${rev ? 'Reveal!' : me >= 0 && !mine ? 'Your pick!' : 'Round ' + s.round}</div>
        ${rev ? '' : `<div class="bar rp-t"><i style="width:${Math.max(0, s.t / PICK_T * 100)}%"></i></div>`}
        <div class="rp-res">${res}</div><div class="rp-ch">${btns}</div>
        <div class="muted">Round ${s.round} · first to ${TARGET}</div></div>`;
    },
  };
  Hub.register(G);
})();

}catch(e){console.error('Game file rps.js failed to load',e)}
/* snake.js */
try{
(() => {
  const W = 36, HT = 24, STEP = 0.115, ROUND = 90, MAXLEN = 70;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const cell = (x, y) => y * W + x;

  function occ(s, skipGhost = true) {
    const o = new Int8Array(W * HT).fill(-1);
    s.sn.forEach((q, i) => { if (!q.a || (skipGhost && q.v > 0)) return; for (let k = 0; k < q.b.length; k++) o[q.b[k]] = i; });
    return o;
  }
  function spawn(s, i, H) {
    const o = occ(s, false), q = s.sn[i];
    for (let tr = 0; tr < 80; tr++) {
      const x = 4 + H.int(W - 8), y = 3 + H.int(HT - 6);
      const dx = W / 2 - x, dy = HT / 2 - y;
      const d = Math.abs(dx) * .6 > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
      let ok = true; const b = [];
      for (let k = -2; k <= 5 && ok; k++) {
        const cx = x + DX[d] * k, cy = y + DY[d] * k;
        if (cx < 1 || cy < 1 || cx >= W - 1 || cy >= HT - 1 || o[cell(cx, cy)] >= 0) ok = false;
        else if (k <= 0) b.unshift(cell(cx, cy));
      }
      if (!ok) continue;
      b.reverse(); // head first: k=0 head, k=-1,-2 behind
      q.b = [cell(x, y), cell(x - DX[d], y - DY[d]), cell(x - 2 * DX[d], y - 2 * DY[d])];
      q.d = d; q.q = []; q.a = 1; q.v = 2; q.g = 0; q.r = 0; q.m = Math.max(q.m, 3);
      return true;
    }
    return false;
  }
  function refill(s, H) {
    const o = occ(s, false), target = Math.min(20, 4 + s.ids.length);
    let guard = 0;
    while (s.f.length < target && guard++ < 60) {
      const c = H.int(W * HT), x = c % W, y = (c / W) | 0;
      if (o[c] < 0 && !s.f.includes(c) && x > 0 && y > 0 && x < W - 1 && y < HT - 1) s.f.push(c);
    }
  }
  function finish(s) {
    const order = s.ids.map((id, i) => i).sort((a, b) => s.sn[b].m - s.sn[a].m || s.sn[b].k - s.sn[a].k || s.sn[a].x - s.sn[b].x);
    const top = order[0], tie = order.length > 1 && s.sn[order[1]].m === s.sn[top].m && s.sn[order[1]].k === s.sn[top].k;
    s.over = {
      title: tie ? '🐍 Tie at the top!' : '🏆 Longest snake wins!',
      winners: order.filter(i => s.sn[i].m === s.sn[top].m && s.sn[i].k === s.sn[top].k).map(i => s.ids[i]),
      rows: order.map(i => ({ pid: s.ids[i], text: `${s.sn[i].m} long · ${s.sn[i].k} kills` })),
    };
  }
  function step(s, H) {
    s.st++; s.ev = [];
    const n = s.sn.length;
    for (let i = 0; i < n; i++) {
      const q = s.sn[i]; if (!q.a) continue;
      while (q.q.length) { const nd = q.q.shift(); if (nd !== q.d && nd !== (q.d + 2) % 4) { q.d = nd; break; } }
      const h = q.b[0], x = h % W + DX[q.d], y = ((h / W) | 0) + DY[q.d];
      if (x < 0 || y < 0 || x >= W || y >= HT) { q.dead = 1; continue; }
      q.b.unshift(cell(x, y));
      if (q.g > 0) q.g--; else q.b.pop();
      const fi = s.f.indexOf(cell(x, y));
      if (fi >= 0) { s.f.splice(fi, 1); if (q.b.length + q.g < MAXLEN) q.g++; s.ev.push([0, cell(x, y), i]); }
      if (q.b.length > q.m) q.m = q.b.length;
    }
    // collisions
    const o = new Int8Array(W * HT).fill(-1);
    s.sn.forEach((q, i) => { if (q.a && !q.dead && !(q.v > 0)) for (let k = 1; k < q.b.length; k++) o[q.b[k]] = i; });
    const killer = {};
    for (let i = 0; i < n; i++) {
      const q = s.sn[i]; if (!q.a || q.dead || q.v > 0) continue;
      const h = q.b[0];
      if (o[h] >= 0) { q.dead = 1; if (o[h] !== i) killer[i] = o[h]; continue; }
      for (let j = 0; j < n; j++) if (j !== i) { const p = s.sn[j]; if (p.a && !p.dead && !(p.v > 0) && p.b[0] === h) q.dead = 1; }
    }
    for (let i = 0; i < n; i++) {
      const q = s.sn[i]; if (!q.dead) continue;
      q.dead = 0; q.a = 0; q.r = 3; q.dd++;
      if (killer[i] !== undefined) s.sn[killer[i]].k++;
      for (let k = 2; k < q.b.length && s.f.length < 28; k += 3) s.f.push(q.b[k]);
      s.ev.push([1, q.b[0], i]);
      q.b = [];
    }
    refill(s, H);
  }

  Hub.register({
    id: 'snake', name: 'Snake Arena', cat: 'Action', icon: '🐍', blurb: 'Eat, grow, crash rivals. Longest snake wins.', min: 2, max: 8, hz: 24, botMs: 90,
    how: ['Steer your snake to eat glowing food and grow.', '<b>Touch:</b> swipe on the arena or use the on-screen d-pad. <b>Keyboard:</b> arrows or WASD.', 'Hitting a wall or any snake (even yourself) crashes you; you respawn after 3s with brief invulnerability.', 'Crashed snakes drop food. After 90 seconds the longest snake reached wins.'],
    init(P, H) {
      const s = { ids: P.map(p => p.id), sn: P.map(() => ({ b: [], d: 1, q: [], a: 0, r: 0, v: 0, g: 0, m: 3, k: 0, dd: 0, x: 0 })), f: [], t: ROUND, cd: 3, acc: 0, st: 0, ev: [] };
      s.sn.forEach((q, i) => { q.x = i; spawn(s, i, H); q.v = 0; });
      refill(s, H);
      return s;
    },
    act(s, pid, a, H) {
      if (!a || a.t !== 'd') return;
      const i = s.ids.indexOf(pid), d = a.d | 0; if (i < 0 || d < 0 || d > 3 || a.d !== d) return;
      const q = s.sn[i]; if (!q.a || q.q.length >= 2) return;
      const last = q.q.length ? q.q[q.q.length - 1] : q.d;
      if (d === last || d === (last + 2) % 4) return;
      q.q.push(d);
    },
    tick(s, dt, H) {
      if (s.over) return;
      if (s.cd > 0) { s.cd = Math.max(0, s.cd - dt); return; }
      s.t -= dt;
      if (s.t <= 0) { s.t = 0; finish(s); return; }
      s.sn.forEach((q, i) => {
        if (q.v > 0) q.v = Math.max(0, q.v - dt);
        if (!q.a) { q.r -= dt; if (q.r <= 0 && H.online(s.ids[i])) spawn(s, i, H); }
      });
      s.acc += dt;
      let g = 0; while (s.acc >= STEP && g++ < 3) { s.acc -= STEP; step(s, H); }
    },
    bot(s, pid, H) {
      const i = s.ids.indexOf(pid), q = s.sn[i]; if (!q || !q.a || s.cd > 0) return null;
      const o = occ(s, true), cur = q.q.length ? q.q[q.q.length - 1] : q.d, h = q.b[0], hx = h % W, hy = (h / W) | 0;
      const danger = new Set();
      s.sn.forEach((p, j) => { if (j !== i && p.a) { const ph = p.b[0]; for (let d = 0; d < 4; d++) danger.add((ph % W + DX[d]) + ',' + (((ph / W) | 0) + DY[d])); } });
      let best = -1, bs = -1e9;
      for (let d = 0; d < 4; d++) {
        if (d === (cur + 2) % 4) continue;
        const x = hx + DX[d], y = hy + DY[d];
        let sc = 0;
        if (x < 0 || y < 0 || x >= W || y >= HT || (q.v <= 0 && o[cell(x, y)] >= 0)) sc = -1000;
        else {
          // flood fill
          const seen = new Set([cell(x, y)]), qu = [[x, y]]; let cnt = 0;
          while (qu.length && cnt < 45) {
            const [cx, cy] = qu.shift(); cnt++;
            for (let e = 0; e < 4; e++) {
              const nx = cx + DX[e], ny = cy + DY[e], c = cell(nx, ny);
              if (nx < 0 || ny < 0 || nx >= W || ny >= HT || seen.has(c) || o[c] >= 0) continue;
              seen.add(c); qu.push([nx, ny]);
            }
          }
          sc = cnt >= 40 ? 100 : cnt * 2;
          let fd = 99; for (const f of s.f) fd = Math.min(fd, Math.abs(f % W - x) + Math.abs(((f / W) | 0) - y));
          sc -= fd * 1.2;
          if (danger.has(x + ',' + y)) sc -= 25;
          if (x === 0 || y === 0 || x === W - 1 || y === HT - 1) sc -= 6;
          if (d === cur) sc += 2;
          sc += Math.random() * 3;
        }
        if (sc > bs) { bs = sc; best = d; }
      }
      return best >= 0 && best !== cur ? { t: 'd', d: best } : null;
    },
    mount(el, C) {
      if (!document.getElementById('snake-css')) {
        const st = document.createElement('style'); st.id = 'snake-css';
        st.textContent = `.sn{display:flex;flex-direction:column;align-items:center;gap:8px;width:min(98vw,920px);margin:0 auto;user-select:none;-webkit-user-select:none}
.sn-top{display:flex;align-items:center;gap:8px;width:100%;justify-content:center;flex-wrap:wrap}
.sn-t{font:800 clamp(26px,6vw,38px)/1 system-ui;min-width:90px;text-align:center;color:#fff;text-shadow:0 0 16px #7c5cff}
.sn-t.low{color:#ff5d73;text-shadow:0 0 16px #ff5d73}
.sn-ps{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}
.sn-p{display:flex;align-items:center;gap:5px;padding:3px 9px 3px 5px;border-radius:12px;background:#ffffff12;border:2px solid transparent;font:600 13px system-ui;color:#fff;white-space:nowrap;max-width:140px}
.sn-p i{width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c);flex:none}
.sn-p span{overflow:hidden;text-overflow:ellipsis}
.sn-p.me{border-color:var(--c)}.sn-p.dead{opacity:.45}.sn-p b{font-size:15px}
.sn-cv{position:relative;width:min(98vw,920px,calc((100vh - 230px)*1.5));min-width:300px;aspect-ratio:3/2;border-radius:14px;overflow:hidden;box-shadow:0 0 0 2px #ffffff22,0 10px 40px #000a;touch-action:none;background:#0b0e1d}
.sn-cv canvas{width:100%;height:100%;display:block;touch-action:none}
.sn-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font:900 clamp(22px,6vw,48px) system-ui;color:#fff;text-shadow:0 0 20px #000,0 0 30px var(--c,#7c5cff);text-align:center;padding:10px}
.sn-pad{display:none;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,58px);gap:6px;margin-top:2px}
.sn-pad button{border:0;border-radius:16px;background:#ffffff1f;color:#fff;font-size:26px;touch-action:none;box-shadow:inset 0 -3px 0 #0005}
.sn-pad button:active{background:#7c5cff}
@media (pointer:coarse),(max-width:700px){.sn-pad{display:grid}}`;
        document.head.appendChild(st);
      }
      el.innerHTML = `<div class="sn"><div class="sn-top"><div class="sn-t">90</div><div class="sn-ps"></div></div><div class="sn-cv"><canvas></canvas><div class="sn-ov"></div></div><div class="sn-pad"><span></span><button data-d="0">▲</button><span></span><button data-d="3">◀</button><button data-d="2">▼</button><button data-d="1">▶</button></div></div>`;
      const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), ov = el.querySelector('.sn-ov'), tEl = el.querySelector('.sn-t'), psEl = el.querySelector('.sn-ps'), wrap = el.querySelector('.sn-cv');
      let s = null, alive = true, raf = 0, lastPs = '', prevB = [], curB = [], tStep = 0, lastSt = -1, parts = [], shake = 0, lastSecBeep = -1, lastCd = -1;
      const me = () => (s ? s.ids.indexOf(C.me) : -1);
      const send = d => { C.send({ t: 'd', d }); };
      const onKey = e => {
        const k = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 }[e.key];
        if (k === undefined || e.metaKey || e.ctrlKey || e.altKey) return;
        const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
        e.preventDefault(); if (!e.repeat) send(k);
      };
      window.addEventListener('keydown', onKey);
      let tx = 0, ty = 0, tOn = false;
      const ts = e => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; tOn = true; };
      const tm = e => {
        if (!tOn) return; e.preventDefault(); const t = e.touches[0], dx = t.clientX - tx, dy = t.clientY - ty;
        if (Math.hypot(dx, dy) > 18) { send(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0)); tx = t.clientX; ty = t.clientY; }
      };
      wrap.addEventListener('touchstart', ts, { passive: true }); wrap.addEventListener('touchmove', tm, { passive: false }); wrap.addEventListener('touchend', () => { tOn = false; });
      el.querySelectorAll('.sn-pad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); send(+b.dataset.d); }));

      const col = i => C.pl(s.ids[i]).color;
      function burst(c, color, n, sp) {
        const x = c % W + .5, y = ((c / W) | 0) + .5;
        for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = (.3 + Math.random()) * sp; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c: color }); }
      }
      function onStep(ns) {
        prevB = curB.length === ns.sn.length ? curB : ns.sn.map(q => q.b.slice());
        curB = ns.sn.map(q => q.b.slice()); tStep = performance.now();
        const m = me();
        for (const [k, c, i] of ns.ev || []) {
          if (k === 0) { burst(c, '#ffd166', 6, 5); if (i === m) C.sfx('pop'); }
          else {
            const body = prevB[i] || [];
            for (let j = 0; j < body.length; j += 2) burst(body[j], col(i), 3, 8);
            if (i === m) { C.sfx('bad'); shake = 14; } else if (body.length) { shake = Math.max(shake, 4); }
          }
        }
      }
      function frame(now) {
        if (!alive) return; raf = requestAnimationFrame(frame);
        if (!s) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
        const pw = Math.max(1, Math.round(r.width * dpr)), ph = Math.max(1, Math.round(r.height * dpr));
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        const cs = pw / W, k = Math.min(1, (now - tStep) / (STEP * 1000 * 1.05));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const g = ctx.createRadialGradient(pw / 2, ph / 2, ph * .1, pw / 2, ph / 2, pw * .7); g.addColorStop(0, '#15193a'); g.addColorStop(1, '#080a18');
        ctx.fillStyle = g; ctx.fillRect(0, 0, pw, ph);
        if (shake > .3) { ctx.translate((Math.random() - .5) * shake * dpr, (Math.random() - .5) * shake * dpr); shake *= .88; }
        // grid dots
        ctx.fillStyle = '#ffffff12';
        for (let y = 0; y < HT; y++) for (let x = 0; x < W; x++) { ctx.fillRect((x + .5) * cs - 1, (y + .5) * cs - 1, 2, 2); }
        ctx.strokeStyle = '#7c5cff66'; ctx.lineWidth = 3 * dpr; ctx.strokeRect(1.5 * dpr, 1.5 * dpr, pw - 3 * dpr, ph - 3 * dpr);
        // food
        const pul = .75 + .25 * Math.sin(now / 180);
        for (const f of s.f) {
          const x = (f % W + .5) * cs, y = (((f / W) | 0) + .5) * cs, rr = cs * .32 * (.85 + pul * .3);
          const fg = ctx.createRadialGradient(x, y, 0, x, y, rr * 2.6); fg.addColorStop(0, '#fff3b0'); fg.addColorStop(.35, '#ffb703'); fg.addColorStop(1, '#ffb70300');
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, rr * 2.6, 0, 6.28); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, rr * .7, 0, 6.28); ctx.fill();
        }
        // snakes
        const m = me();
        s.sn.forEach((q, i) => {
          const cb = curB[i], pb = prevB[i]; if (!q.a || !cb || !cb.length) return;
          const pts = cb.map((c, j) => {
            let cx = c % W + .5, cy = ((c / W) | 0) + .5;
            const pc = pb && pb.length ? pb[Math.min(j, pb.length - 1)] : c;
            const px = pc % W + .5, py = ((pc / W) | 0) + .5;
            if (Math.abs(px - cx) + Math.abs(py - cy) <= 1.6) { cx = px + (cx - px) * k; cy = py + (cy - py) * k; }
            return [cx * cs, cy * cs];
          });
          const color = col(i), ghost = q.v > 0, a = ghost ? (Math.sin(now / 60) > 0 ? .85 : .3) : 1;
          ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const path = () => { ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (pts.length === 1) ctx.lineTo(pts[0][0] + .01, pts[0][1]); };
          ctx.shadowColor = color; ctx.shadowBlur = cs * .9; ctx.strokeStyle = color; ctx.lineWidth = cs * .78; path(); ctx.stroke();
          ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = cs * .3; ctx.translate(0, -cs * .08); path(); ctx.stroke(); ctx.translate(0, cs * .08);
          const hd = pts[0], d = q.d;
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(hd[0], hd[1], cs * .46, 0, 6.28); ctx.fill();
          const ex = -DY[d], ey = DX[d];
          for (const sg of [-1, 1]) {
            const px = hd[0] + DX[d] * cs * .14 + ex * sg * cs * .22, py = hd[1] + DY[d] * cs * .14 + ey * sg * cs * .22;
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, cs * .15, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(px + DX[d] * cs * .05, py + DY[d] * cs * .05, cs * .07, 0, 6.28); ctx.fill();
          }
          if (i === m) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.globalAlpha = .5 + .4 * Math.sin(now / 150); ctx.beginPath(); ctx.arc(hd[0], hd[1], cs * (.8 + .1 * Math.sin(now / 150)), 0, 6.28); ctx.stroke(); }
          ctx.globalAlpha = 1;
        });
        // particles
        for (let j = parts.length - 1; j >= 0; j--) {
          const p = parts[j]; p.x += p.vx * .016; p.y += p.vy * .016; p.l -= .03; p.vx *= .96; p.vy *= .96;
          if (p.l <= 0) { parts.splice(j, 1); continue; }
          ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x * cs, p.y * cs, cs * .18 * p.l + 1, 0, 6.28); ctx.fill();
        }
        ctx.globalAlpha = 1; if (parts.length > 400) parts.splice(0, parts.length - 400);
      }
      raf = requestAnimationFrame(frame);

      function update(ns) {
        s = ns;
        if (ns.st !== lastSt) { lastSt = ns.st; onStep(ns); }
        else if (!curB.length) { curB = ns.sn.map(q => q.b.slice()); prevB = curB; }
        const m = me(), my = m >= 0 ? ns.sn[m] : null;
        const secs = Math.ceil(ns.t);
        tEl.textContent = secs + 's'; tEl.classList.toggle('low', secs <= 10);
        if (!ns.over && ns.cd <= 0 && secs <= 5 && secs !== lastSecBeep) { lastSecBeep = secs; C.sfx('tick'); }
        const html = ns.sn.map((q, i) => `<div class="sn-p ${i === m ? 'me' : ''} ${q.a ? '' : 'dead'}" style="--c:${C.esc(col(i))}"><i></i><span>${C.esc(C.pl(ns.ids[i]).name)}</span><b>${q.a ? q.b.length : '✖'}</b></div>`).join('');
        if (html !== lastPs) { lastPs = html; psEl.innerHTML = html; }
        let msg = '';
        if (ns.over) msg = '';
        else if (ns.cd > 0) { const c = Math.ceil(ns.cd); msg = c + (m < 0 ? '<br><small>spectating</small>' : ''); if (c !== lastCd) { lastCd = c; C.sfx('tick'); } }
        else if (my && !my.a) msg = 'Respawn in ' + Math.max(1, Math.ceil(my.r));
        else if (m < 0) msg = '';
        if (ov.innerHTML !== msg) ov.innerHTML = msg;
        if (my) ov.style.setProperty('--c', col(m));
      }
      update.destroy = () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
      return update;
    },
  });
})();

}catch(e){console.error('Game file snake.js failed to load',e)}
/* snakes.js */
try{
(() => {
  const SN = { 16: 6, 47: 26, 49: 11, 56: 33, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
  const LD = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
  const cc = n => { const r = Math.floor((n - 1) / 10); let c = (n - 1) % 10; if (r % 2) c = 9 - c; return [c * 10 + 5, (9 - r) * 10 + 5]; };
  const spot = (n, k) => n > 0 ? cc(n) : [10 + k * 13, 105];
  const OFF = [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4], [0, -3.4], [0, 3.4]];
  const SC = ['#2fb85a', '#e8424a', '#f2c230', '#a35cff', '#2ec7d6', '#ff8a3d', '#4f8cff', '#e0509d', '#7bd33a', '#ffd34d'];
  const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  const dieHtml = v => Array.from({ length: 9 }, (_, i) => `<i class="${(PIPS[v] || []).includes(i) ? 'on' : ''}"></i>`).join('');
  const f1 = x => Math.round(x * 10) / 10;

  const mk = (css, render, o = {}) => (el, C) => {
    const st = document.createElement('style'); st.textContent = css; el.appendChild(st);
    const root = document.createElement('div'); root.className = o.cls || ''; el.appendChild(root);
    const ui = { repaint: null }, parts = []; let S = null, prev = null;
    const paint = () => { if (!S) return; const h = render(S, C, ui); h.forEach((x, i) => { if (!parts[i]) parts[i] = { d: root.appendChild(document.createElement('div')), h: null }; if (parts[i].h !== x) { parts[i].h = x; parts[i].d.innerHTML = x; } }); };
    ui.repaint = paint;
    root.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; try { C.send(JSON.parse(b.dataset.a)); } catch { } });
    const up = s => { const p = prev; S = s; if (o.pre) o.pre(s, p, C, ui); paint(); if (o.sfx && p) try { o.sfx(s, p, C); } catch { } prev = JSON.parse(JSON.stringify(s)); };
    up.destroy = () => { if (o.destroy) o.destroy(ui); };
    return up;
  };

  let STATIC = null;
  function boardStatic() {
    if (STATIC) return STATIC;
    let o = `<rect width="100" height="110" rx="3" fill="#1b2036"/><rect x="0" y="0" width="100" height="100" fill="#1b2036"/>`;
    for (let n = 1; n <= 100; n++) {
      const [x, y] = cc(n), alt = (Math.floor((n - 1) / 10) + (n - 1)) % 2;
      o += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${n === 100 ? '#ffd34d' : alt ? '#f3e7c9' : '#d9efd2'}" stroke="#0002" stroke-width=".2"/><text x="${x - 4.4}" y="${y - 2.8}" font-size="2.6" fill="#0007" font-weight="700">${n}</text>`;
    }
    o += `<text x="95" y="9" font-size="5" text-anchor="middle">👑</text>`;
    Object.entries(LD).forEach(([a, b]) => {
      const [x1, y1] = cc(+a), [x2, y2] = cc(b), L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * 1.5, ny = ux * 1.5;
      o += `<g opacity=".95"><path d="M${f1(x1 + nx)} ${f1(y1 + ny)}L${f1(x2 + nx)} ${f1(y2 + ny)}M${f1(x1 - nx)} ${f1(y1 - ny)}L${f1(x2 - nx)} ${f1(y2 - ny)}" stroke="#7a4a1e" stroke-width="1.5" stroke-linecap="round"/><path d="M${f1(x1 + nx)} ${f1(y1 + ny)}L${f1(x2 + nx)} ${f1(y2 + ny)}M${f1(x1 - nx)} ${f1(y1 - ny)}L${f1(x2 - nx)} ${f1(y2 - ny)}" stroke="#e0a458" stroke-width=".8" stroke-linecap="round"/>`;
      for (let d = 3; d < L - 1; d += 4.2) { const px = x1 + ux * d, py = y1 + uy * d; o += `<path d="M${f1(px + nx)} ${f1(py + ny)}L${f1(px - nx)} ${f1(py - ny)}" stroke="#b9772e" stroke-width="1" stroke-linecap="round"/>`; }
      o += `</g>`;
    });
    Object.entries(SN).forEach(([a, b], i) => {
      const [x1, y1] = cc(+a), [x2, y2] = cc(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, k = Math.max(2, Math.round(L / 13)), col = SC[i % 5 === 0 ? 0 : i % 5];
      let d = ''; for (let t = 0; t <= 1.0001; t += .03) { const w = Math.sin(t * Math.PI * 2 * k / 2 * 1) * 3.2 * (1 - t * .4); d += (d ? 'L' : 'M') + f1(x1 + dx * t + nx * w) + ' ' + f1(y1 + dy * t + ny * w); }
      const dir = Math.atan2(dy, dx) * 180 / Math.PI;
      o += `<g><path d="${d}" fill="none" stroke="#0006" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#0004" stroke-width="1.2" stroke-dasharray="1.2 2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <g transform="translate(${f1(x1)} ${f1(y1)}) rotate(${f1(dir + 180)})"><ellipse cx="0" cy="0" rx="3.3" ry="2.7" fill="${col}" stroke="#0006" stroke-width=".4"/><circle cx="-.4" cy="-1.3" r=".8" fill="#fff"/><circle cx="-.4" cy="1.3" r=".8" fill="#fff"/><circle cx="-.6" cy="-1.3" r=".4" fill="#111"/><circle cx="-.6" cy="1.3" r=".4" fill="#111"/><path d="M-3.2 0L-5.2 0M-5.2 0L-6.2 -.9M-5.2 0L-6.2 .9" stroke="#e8424a" stroke-width=".4" fill="none"/></g></g>`;
    });
    return STATIC = o;
  }

  const CSS = `.sl{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(96vw,520px);margin:0 auto}
.sl-hud{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.sl-p{display:flex;align-items:center;gap:6px;padding:3px 10px 3px 5px;border-radius:14px;background:var(--card);border:2px solid transparent;font-size:14px}
.sl-p.cur{border-color:#fff;box-shadow:0 0 14px #fff5}.sl-p i{width:16px;height:16px;border-radius:50%;background:var(--c);border:2px solid #fff;display:inline-block}.sl-p b{opacity:.85;font-size:13px}
.sl>div{width:100%}.sl svg{width:100%;height:auto;display:block;border-radius:14px;box-shadow:0 8px 30px #0008;touch-action:manipulation}
.sl-ctl{display:flex;align-items:center;gap:16px;justify-content:center;flex-wrap:wrap;width:100%}
.sl-die{width:64px;height:64px;border-radius:14px;background:#fff;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:9px;gap:2px;box-shadow:0 4px 14px #0007,inset 0 -4px 0 #0002;flex:none}
.sl-die i{border-radius:50%;background:transparent}.sl-die i.on{background:#222}
.sl-die.roll{animation:slroll .6s ease-out}
@keyframes slroll{0%{transform:rotate(0) scale(.7) translateY(-20px)}50%{transform:rotate(200deg) scale(1.2)}100%{transform:rotate(360deg) scale(1)}}
.sl-msg{min-height:22px;text-align:center;font-size:15px;max-width:420px}`;

  Hub.register({
    id: 'snakes', name: 'Snakes & Ladders', cat: 'Board', icon: '🐍', blurb: 'Race to 100 — ladders up, snakes down!', min: 2, max: 6,
    how: ['Take turns rolling the die and moving your token that many squares.', 'Land at the foot of a <b>ladder</b> 🪜 to climb up; land on a snake\'s <b>head</b> 🐍 and slide down.', 'Roll a <b>6</b> to take another turn (three 6s in a row ends your turn).', 'You must roll the <b>exact number</b> to land on 100 — too high and you stay put.', 'First to reach 100 wins!'],
    init(P) { return { ids: P.map(p => p.id), pos: P.map(() => 0), turn: 0, die: 0, rn: 0, evn: 0, busy: false, ev: null, sixes: 0, rounds: 1 }; },
    act(s, pid, a, H) {
      if (a.t !== 'roll' || s.busy || s.over) return;
      const seat = s.ids.indexOf(pid); if (seat !== s.turn) return;
      const d = 1 + H.int(6), from = s.pos[seat]; let mid = from + d, kind = 'mv';
      if (mid > 100) { mid = from; kind = 'exact'; }
      let to = mid;
      if (kind === 'mv') { if (SN[mid]) { to = SN[mid]; kind = 'snake'; } else if (LD[mid]) { to = LD[mid]; kind = 'ladder'; } else if (mid === 100) kind = 'win'; if (to === 100) kind = 'win'; }
      s.die = d; s.rn++; s.pos[seat] = to; s.busy = true; s.sixes = d === 6 ? s.sixes + 1 : 0;
      s.ev = { n: ++s.evn, seat, d, from, mid, to, kind };
      const ms = 600 + (mid - from) * 150 + (to !== mid ? 1000 : 0) + 250;
      H.after(ms, () => {
        s.busy = false;
        if (to === 100) {
          const order = s.ids.map((id, i) => i).sort((x, y) => (y === seat) - (x === seat) || s.pos[y] - s.pos[x]);
          s.over = { title: '🏆 Winner!', winners: [pid], rows: order.map(i => ({ pid: s.ids[i], text: s.pos[i] >= 100 ? 'Reached 100' : 'Square ' + s.pos[i] })) }; return;
        }
        if (d === 6 && s.sixes < 3) return;
        s.sixes = 0;
        const nx = H.next(s.ids.map(id => ({ id })), s.turn); if (nx <= s.turn) s.rounds++; s.turn = nx;
        if (s.rounds > 120) {
          const best = Math.max(...s.pos), w = s.ids.filter((id, i) => s.pos[i] === best);
          s.over = { title: '⏱ Time! Furthest token wins', winners: w, rows: s.ids.map((id, i) => ({ pid: id, text: 'Square ' + s.pos[i] })) };
        }
      });
    },
    botMs: 900,
    bot(s, pid) { if (s.over || s.busy || s.ids.indexOf(pid) !== s.turn) return null; return { t: 'roll' }; },
    mount: mk(CSS, (s, C, ui) => {
      const me = C.seat(C.me), mine = me === s.turn && !s.busy && !s.over, cur = C.pl(s.ids[s.turn]);
      const disp = ui.disp || s.pos.map((p, k) => spot(p, k));
      const hud = `<div class="sl-hud">${s.ids.map((id, i) => `<div class="sl-p ${i === s.turn ? 'cur' : ''}" style="--c:${C.pl(id).color}"><i></i>${C.esc(C.pl(id).name)} <b>${s.pos[i] || '–'}</b></div>`).join('')}</div>
        <div style="text-align:center;margin-top:8px"><span class="turn ${mine ? 'mine' : ''}">${s.over ? 'Game over' : mine ? 'Your turn — roll!' : C.esc(cur.name) + (s.busy ? ' is moving…' : "'s turn")}</span></div>`;
      let tk = '';
      s.ids.forEach((id, k) => { const [x, y] = disp[k] || spot(s.pos[k], k), [ox, oy] = OFF[k % 6]; tk += `<g><circle cx="${f1(x + ox)}" cy="${f1(y + oy + .5)}" r="2.5" fill="#0005"/><circle cx="${f1(x + ox)}" cy="${f1(y + oy)}" r="2.5" fill="${C.pl(id).color}" stroke="#fff" stroke-width=".7"/><circle cx="${f1(x + ox - .7)}" cy="${f1(y + oy - .8)}" r=".7" fill="#fff6"/></g>`; });
      const board = `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">${boardStatic()}<text x="3" y="101.4" font-size="2.6" fill="#fffa">START</text>${tk}</svg>`;
      let msg = ''; const e = s.ev;
      if (e && !s.over) {
        const who = C.esc(C.pl(s.ids[e.seat]).name);
        msg = e.kind === 'exact' ? `${who} rolled ${e.d} — needs an exact roll to reach 100` : `${who} rolled <b>${e.d}</b> → ${e.mid}` + (e.kind === 'snake' ? ` 🐍 slid down to <b>${e.to}</b>` : e.kind === 'ladder' ? ` 🪜 climbed to <b>${e.to}</b>` : '') + (e.d === 6 && !s.busy ? ' · rolls again!' : '');
      } else if (s.over) msg = '🏆 ' + C.esc(C.pl(s.over.winners[0]).name) + ' wins!'; else msg = 'Roll the die to begin!';
      const ctl = `<div class="sl-ctl"><div class="sl-die ${s.busy ? 'roll' : ''}">${dieHtml(s.die)}</div>${me >= 0 ? `<button class="btn big ${mine ? 'ok' : 'alt'}" ${Hub.A({ t: 'roll' })} ${mine ? '' : 'disabled'}>🎲 Roll</button>` : '<span class="muted">Spectating</span>'}</div><div class="sl-msg">${msg}</div>`;
      return [hud, board, ctl];
    }, {
      cls: 'sl',
      pre(s, p, C, ui) {
        const e = s.ev;
        if (!ui.disp || !p) ui.disp = s.pos.map((q, k) => spot(q, k));
        if (e && e.n !== ui.lastN) {
          ui.lastN = e.n; if (ui.tm) clearTimeout(ui.tm);
          if (!p) { ui.disp = s.pos.map((q, k) => spot(q, k)); return; }
          const path = []; for (let n = e.from + 1; n <= e.mid; n++) path.push(cc(n));
          if (e.from === 0 && e.mid === 0) { /* no move */ }
          const a = spot(e.mid, e.seat), b = spot(e.to, e.seat); if (e.to !== e.mid) for (let i = 1; i <= 8; i++) path.push([a[0] + (b[0] - a[0]) * i / 8, a[1] + (b[1] - a[1]) * i / 8]);
          let i = 0; const step = () => { if (i >= path.length) { ui.disp[e.seat] = spot(s.pos[e.seat], e.seat); ui.repaint(); return; } ui.disp[e.seat] = path[i++]; ui.repaint(); ui.tm = setTimeout(step, i > e.mid - e.from ? 70 : 150); };
          step();
        }
      },
      sfx(s, p, C) {
        const e = s.ev; if (!e || (p.ev && p.ev.n === e.n)) return;
        C.sfx('roll'); const me = C.seat(C.me);
        setTimeout(() => { C.sfx(e.kind === 'snake' ? 'bad' : e.kind === 'ladder' ? 'good' : 'tick'); }, 400 + (e.mid - e.from) * 150);
      },
      destroy(ui) { if (ui.tm) clearTimeout(ui.tm); },
    }),
  });
})();

}catch(e){console.error('Game file snakes.js failed to load',e)}
/* tictactoe.js */
try{
(() => {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const C0 = (s, i) => 'Player ' + (i ? 'O' : 'X');
  const winner = b => { for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return [b[x], [x, y, z]]; return null; };

  Hub.register({
    id: 'tictactoe', name: 'Tic-Tac-Toe', cat: 'Board', icon: '❌', blurb: 'Three in a row wins. Classic duel.', min: 2, max: 2,
    how: ['Players take turns placing their mark (❌ goes first).', 'Tap an empty square to place your mark.', 'Get <b>3 in a row</b> — across, down or diagonally — to win.', 'Best of 3 rounds: first to 2 round wins takes the match.'],
    init(P) { return { ids: P.map(p => p.id), board: Array(9).fill(''), turn: 0, wins: [0, 0], line: [], round: 1, msg: '' }; },
    act(s, pid, a, H) {
      if (a.t !== 'cell') return;
      const seat = s.ids.indexOf(pid), i = a.i | 0;
      if (seat !== s.turn || i < 0 || i > 8 || s.board[i] || s.line.length || s.msg) return;
      s.board[i] = seat ? 'O' : 'X';
      const w = winner(s.board);
      if (w) { s.wins[seat]++; s.line = w[1]; s.msg = 'win'; }
      else if (s.board.every(Boolean)) s.msg = 'draw';
      else { s.turn = 1 - s.turn; return; }
      // round finished: match over or new round after the host re-inits next board
      if (s.wins[seat] >= 2 || s.round >= 5) {
        const [a, b] = s.wins, rows = s.ids.map((id, k) => ({ pid: id, text: s.wins[k] + ' wins' }));
        s.over = a === b ? { title: '🤝 Match drawn', winners: [], rows } : { title: '🏆 ' + C0(s, a > b ? 0 : 1) + ' wins the match!', winners: [s.ids[a > b ? 0 : 1]], rows };
      }
      else H.after(1400, () => { s.board = Array(9).fill(''); s.line = []; s.msg = ''; s.round++; s.turn = s.round % 2 ? 0 : 1; });
    },
    bot(s, pid) {
      if (s.line.length || s.msg || s.ids.indexOf(pid) !== s.turn) return null;
      const me = s.turn ? 'O' : 'X', op = s.turn ? 'X' : 'O', free = s.board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
      const find = m => { for (const [x, y, z] of LINES) { const c = [x, y, z], mine = c.filter(i => s.board[i] === m).length, f = c.filter(i => !s.board[i]); if (mine === 2 && f.length === 1) return f[0]; } return -1; };
      const rnd = () => free[Math.floor(Math.random() * free.length)];
      let m = Math.random() < .25 ? rnd() : find(me);          // 25% of the time play randomly so bot games don't always draw
      if (m < 0) m = find(op); if (m < 0 && !s.board[4]) m = 4; if (m < 0) m = rnd();
      return { t: 'cell', i: m };
    },
    view(s, C) {
      const mySeat = C.seat(C.me), mine = mySeat === s.turn && !s.line.length && !s.msg;
      const who = i => C.chip(s.ids[i]);
      const cells = s.board.map((v, i) => `<button class="cell" ${Hub.A({ t: 'cell', i })} ${v || !mine ? 'disabled' : ''} style="color:${v === 'X' ? C.pl(s.ids[0]).color : C.pl(s.ids[1]).color};${s.line.includes(i) ? 'background:#3ddc9755;' : ''}">${v === 'X' ? '❌' : v === 'O' ? '⭕' : ''}</button>`).join('');
      const status = s.msg === 'draw' ? 'Draw! New round…' : s.msg === 'win' ? 'Round won! 🎉' : mine ? 'Your turn!' : C.spectator ? 'Waiting…' : `${C.esc(C.pl(s.ids[s.turn]).name)}'s turn`;
      return `<div class="stack">
        <div class="scores"><div class="score ${s.turn === 0 ? 'cur' : ''}">❌ ${who(0)} <b>${s.wins[0]}</b></div><div class="score ${s.turn === 1 ? 'cur' : ''}">⭕ ${who(1)} <b>${s.wins[1]}</b></div></div>
        <div class="turn ${mine ? 'mine' : ''}">${status}</div>
        <div class="board" style="grid-template-columns:repeat(3,1fr);width:min(92vw,420px)">${cells}</div>
        <div class="muted">Round ${s.round} · best of 5 · first to 2 wins</div></div>`;
    },
  });
})();

}catch(e){console.error('Game file tictactoe.js failed to load',e)}
/* trivia.js */
try{
(() => {
  const NQ = 12, QT = 15, REV = 4;
  // category|question|correct|wrong|wrong|wrong
  const BANK = `
G|How many days are there in a leap year?|366|365|364|367
G|How many colours are there in a rainbow?|7|5|6|8
G|Which is the largest mammal in the world?|Blue whale|African elephant|Giraffe|Hippopotamus
G|How many sides does a hexagon have?|6|5|7|8
G|What do bees make?|Honey|Milk|Silk|Sugar
G|Which shape has three sides?|Triangle|Square|Circle|Pentagon
G|How many minutes are there in one hour?|60|50|100|30
G|What is the opposite of "ancient"?|Modern|Old|Broken|Heavy
G|Which fruit is traditionally used to make guacamole?|Avocado|Mango|Banana|Apple
G|How many players are on the field for one football (soccer) team?|11|9|10|12
G|What is the main language spoken in Brazil?|Portuguese|Spanish|English|French
G|Which animal is known as the "King of the Jungle"?|Lion|Tiger|Elephant|Gorilla
G|What do caterpillars turn into?|Butterflies|Beetles|Bees|Spiders
G|How many letters are in the English alphabet?|26|24|25|28
G|Which month has the fewest days?|February|January|April|June
G|What is the currency of Japan?|Yen|Won|Dollar|Rupee
S|What planet is known as the Red Planet?|Mars|Venus|Jupiter|Mercury
S|What gas do plants absorb from the air?|Carbon dioxide|Oxygen|Nitrogen|Helium
S|What is the hardest natural substance?|Diamond|Gold|Iron|Quartz
S|How many planets are in our solar system?|8|7|9|10
S|What is H2O more commonly known as?|Water|Salt|Sugar|Air
S|Which organ pumps blood around the body?|Heart|Lungs|Liver|Brain
S|What force keeps us on the ground?|Gravity|Magnetism|Friction|Wind
S|Which is the closest star to Earth?|The Sun|Sirius|Polaris|The Moon
S|How many bones does an adult human have?|206|106|306|412
S|What is the boiling point of water in Celsius?|100|50|90|212
S|Which planet has the most famous rings?|Saturn|Mars|Earth|Mercury
S|What do we call animals that eat only plants?|Herbivores|Carnivores|Omnivores|Insectivores
S|Which part of a plant absorbs water from the soil?|Roots|Leaves|Flowers|Stem
S|Sound travels fastest through which of these?|Steel|Air|Vacuum|Water vapour
S|What is the chemical symbol for gold?|Au|Gd|Go|Ag
S|Which gas do humans need to breathe to survive?|Oxygen|Hydrogen|Carbon dioxide|Neon
W|What is the capital of France?|Paris|Lyon|Marseille|Nice
W|Which is the largest ocean on Earth?|Pacific|Atlantic|Indian|Arctic
W|Which is the longest river in Africa?|Nile|Congo|Niger|Zambezi
W|Which continent is Egypt in?|Africa|Asia|Europe|South America
W|What is the capital of Japan?|Tokyo|Kyoto|Osaka|Seoul
W|Which is the smallest continent?|Australia|Europe|Antarctica|South America
W|The Great Barrier Reef is off the coast of which country?|Australia|Brazil|India|Mexico
W|Which country has the maple leaf on its flag?|Canada|Ireland|Austria|Norway
W|What is the tallest mountain in the world above sea level?|Mount Everest|K2|Kilimanjaro|Mont Blanc
W|Which desert is the largest hot desert in the world?|Sahara|Gobi|Kalahari|Thar
W|What is the capital of Australia?|Canberra|Sydney|Melbourne|Perth
W|In which country is the Eiffel Tower?|France|Italy|Spain|Belgium
W|Which country is shaped like a boot?|Italy|Greece|Portugal|Japan
W|Which is the largest country in the world by area?|Russia|Canada|China|USA
W|What is the capital of Egypt?|Cairo|Alexandria|Luxor|Giza
P|Which toy brand makes colourful interlocking plastic bricks?|LEGO|Hot Wheels|Barbie|Play-Doh
P|In the movie "Frozen", what is the name of the snowman?|Olaf|Sven|Kristoff|Hans
P|Which video game character is a plumber in a red cap?|Mario|Sonic|Link|Pikachu
P|What colour is Pikachu?|Yellow|Red|Blue|Green
P|Who is the boy wizard in a famous series of books by J.K. Rowling?|Harry Potter|Percy Jackson|Peter Pan|Tom Sawyer
P|Which cartoon features a yellow sponge living under the sea?|SpongeBob SquarePants|Finding Nemo|Peppa Pig|Tom and Jerry
P|In Minecraft, which green creature explodes near you?|Creeper|Zombie|Skeleton|Enderman
P|What is the name of the clownfish in "Finding Nemo"'s title?|Nemo|Dory|Marlin|Bruce
P|Which superhero is also known as Peter Parker?|Spider-Man|Batman|Iron Man|Superman
P|Which cartoon cat chases a mouse named Jerry?|Tom|Garfield|Sylvester|Felix
P|In "The Lion King", what is the lion cub's name?|Simba|Mufasa|Scar|Nala
P|What is the name of Mickey Mouse's girlfriend?|Minnie|Daisy|Pluto|Goofy
P|Which game has players building with blocks and surviving in a pixel world?|Minecraft|Tetris|Pac-Man|Fortnite
P|What are the little yellow helpers in "Despicable Me" called?|Minions|Smurfs|Teletubbies|Muppets
I|What is the capital of India?|New Delhi|Mumbai|Kolkata|Chennai
I|Which is the national animal of India?|Tiger|Lion|Elephant|Peacock
I|Which is the national bird of India?|Peacock|Sparrow|Parrot|Eagle
I|Who is known as the Father of the Nation in India?|Mahatma Gandhi|Jawaharlal Nehru|Subhas Chandra Bose|Sardar Patel
I|On which date does India celebrate Independence Day?|15 August|26 January|2 October|14 November
I|Which river is considered the holiest in India?|Ganga|Yamuna|Godavari|Narmada
I|Which monument in Agra is famous as a symbol of love?|Taj Mahal|Red Fort|Qutub Minar|India Gate
I|How many colours are there in the Indian national flag?|3|2|4|5
I|What is the national fruit of India?|Mango|Apple|Banana|Orange
I|Which festival is known as the festival of lights?|Diwali|Holi|Eid|Pongal
I|Which Indian state is known as the "Land of Spices"?|Kerala|Punjab|Rajasthan|Assam
I|Which is the largest state in India by area?|Rajasthan|Maharashtra|Uttar Pradesh|Madhya Pradesh
I|Who was the first Prime Minister of India?|Jawaharlal Nehru|Mahatma Gandhi|Indira Gandhi|Lal Bahadur Shastri
I|Which city is known as the "Pink City"?|Jaipur|Jodhpur|Udaipur|Agra
I|What is the national sport officially played in India's tradition, hockey or cricket? Pick the sport India won 8 Olympic gold medals in.|Hockey|Cricket|Kabaddi|Football
I|Which Indian space agency launched Chandrayaan?|ISRO|NASA|DRDO|BARC
I|In which city is the Gateway of India?|Mumbai|Delhi|Kolkata|Chennai
X|How many players are in a cricket team on the field?|11|9|10|12
X|Which sport is played at Wimbledon?|Tennis|Golf|Cricket|Hockey
X|How many rings are on the Olympic flag?|5|4|6|7
X|How many points is a touchdown worth in American football (before the extra point)?|6|3|7|10
X|In which sport do you score a "slam dunk"?|Basketball|Volleyball|Football|Baseball
X|What is the national sport of Japan, famous for large wrestlers?|Sumo|Judo|Karate|Kendo
X|How many players are in a basketball team on court at one time?|5|6|7|11
X|Which country hosted the 2016 Summer Olympics?|Brazil|China|UK|Japan
X|Who is the Indian cricketer nicknamed "Master Blaster"?|Sachin Tendulkar|Virat Kohli|MS Dhoni|Rahul Dravid
X|How many runs is a six in cricket?|6|4|5|8
X|Which country won the FIFA World Cup in 2022?|Argentina|France|Brazil|Germany
X|In which sport would you perform a "backstroke"?|Swimming|Rowing|Cycling|Archery
X|What is the length of a marathon, roughly?|42 km|21 km|10 km|100 km
X|How many holes are played in a standard round of golf?|18|9|12|24
`.trim().split('\n').map(l => l.split('|'));
  const CATS = { G: '🧠 General', S: '🔬 Science', W: '🌍 Geography', P: '🎬 Pop culture', I: '🇮🇳 India', X: '🏅 Sports' };
  const SHAPES = ['▲', '◆', '●', '■'], COLS = ['#e0405a', '#3d7bff', '#e6a800', '#1fb86a'];
  const CSS = `<style>
.tv{width:min(100%,640px);display:flex;flex-direction:column;gap:12px;align-items:center}
.tv-q{width:100%;padding:16px;border-radius:20px;background:var(--card);border:1px solid var(--line);text-align:center;position:relative}
.tv-q .cat{display:inline-block;font-size:13px;padding:2px 12px;border-radius:99px;background:#0005;margin-bottom:8px;cursor:default;border:0}
.tv-q h2{margin:0;font-size:clamp(18px,5vw,26px);line-height:1.3;font-weight:600}
.tv-top{display:flex;gap:10px;align-items:center;width:100%;justify-content:space-between}
.tv-t{flex:1}.tv-t>i{background:linear-gradient(90deg,var(--ok),var(--warn),var(--bad))!important;transition:width .5s linear!important}
.tv-n{font-weight:700;min-width:64px;text-align:center}
.tv-a{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
@media(max-width:420px){.tv-a{grid-template-columns:1fr}}
.tv-a button{display:flex;gap:10px;align-items:center;text-align:left;border:0;border-radius:16px;padding:14px;min-height:64px;font-size:clamp(15px,4vw,19px);font-weight:600;color:#fff;background:var(--bc);cursor:pointer;box-shadow:0 5px 0 #0005;transition:transform .12s,opacity .2s,box-shadow .12s;position:relative}
.tv-a button:hover:not(:disabled){transform:translateY(-3px)}
.tv-a button:active:not(:disabled){transform:translateY(3px);box-shadow:0 1px 0 #0005}
.tv-a button:disabled{cursor:default}.tv-a button.dim{opacity:.35}
.tv-a button.sel{outline:4px solid #fff}.tv-a button.right{outline:4px solid var(--ok);box-shadow:0 0 22px #3ddc97aa;animation:tvpop .5s}
.tv-a button .sh{font-size:24px;opacity:.85}
.tv-a button .who{position:absolute;right:8px;bottom:4px;font-size:11px;opacity:.9}
@keyframes tvpop{50%{transform:scale(1.05)}}
.tv-lb{width:100%;display:flex;flex-direction:column;gap:5px}
.tv-r{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-size:14px;animation:tvin .3s}
.tv-r .pos{width:20px;text-align:center;font-weight:700;color:var(--muted)}.tv-r .sp{flex:1}.tv-r b{font-size:16px}
.tv-r .gain{color:var(--ok);font-weight:700;min-width:50px;text-align:right}.tv-r .gain.z{color:var(--bad)}
.tv-r .st{width:22px;text-align:center}
@keyframes tvin{from{opacity:0;transform:translateY(6px)}}
</style>`;
  let seen = '';
  const hash = str => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
  const settle = (s, H) => {
    if (s.phase !== 'q') return;
    const q = s.qs[s.qi];
    s.ids.forEach((id, i) => { const a = s.ans[i]; s.gain[i] = a.c === q.a ? 500 + Math.round(500 * a.t / QT) : 0; s.scores[i] += s.gain[i]; });
    s.phase = 'rev'; s.rn++;
    H.after(REV * 1000, () => {
      if (s.qi + 1 >= NQ) {
        const order = s.ids.map((_, i) => i).sort((a, b) => s.scores[b] - s.scores[a]), top = s.scores[order[0]];
        const ws = order.filter(i => s.scores[i] === top).map(i => s.ids[i]);
        s.over = { title: ws.length > 1 ? '🤝 Tied at the top!' : '🏆 Trivia champion!', winners: ws, rows: order.map(i => ({ pid: s.ids[i], text: s.scores[i] + ' pts' })) };
      } else { s.qi++; s.phase = 'q'; s.t = QT; s.ans = s.ids.map(() => ({ c: -1, t: 0 })); s.gain = s.ids.map(() => 0); }
    });
  };
  const check = (s, H) => {
    if (s.phase !== 'q') return;
    const need = s.ids.filter(id => H.online(id));
    if (!need.length || need.every(id => s.ans[s.ids.indexOf(id)].c >= 0)) settle(s, H);
  };
  const G = {
    id: 'trivia', name: 'Quick Trivia', cat: 'Party', icon: '🧠', blurb: 'Fast-fingered quiz. Quicker answers score more!', min: 2, max: 10,
    how: ['<b>12 questions</b> from all sorts of topics: general, science, geography, pop culture, India and sports.', 'You have <b>15 seconds</b> for each question. Tap an answer.', 'Correct answers score <b>500 – 1000</b> points: the faster you answer, the more you get.', 'After each question the right answer is revealed, then the next one begins.', 'The highest score after 12 questions wins!'],
    hz: 2,
    init(P, H) {
      const byCat = {}; BANK.forEach(q => (byCat[q[0]] = byCat[q[0]] || []).push(q));
      let pick = []; Object.keys(byCat).forEach(k => pick.push(...H.shuffle(byCat[k]).slice(0, 2)));
      const rest = H.shuffle(BANK.filter(q => !pick.includes(q)));
      pick = H.shuffle(pick.concat(rest.slice(0, NQ - pick.length)));
      const qs = pick.map(q => { const o = H.shuffle(q.slice(2)); return { c: q[0], q: q[1], o, a: o.indexOf(q[2]) }; });
      return { ids: P.map(p => p.id), qs, qi: 0, phase: 'q', t: QT, scores: P.map(() => 0), gain: P.map(() => 0), ans: P.map(() => ({ c: -1, t: 0 })), rn: 0 };
    },
    act(s, pid, a, H) {
      if (s.over || s.phase !== 'q' || a.t !== 'ans') return;
      const i = s.ids.indexOf(pid), c = a.i | 0; if (i < 0 || c < 0 || c > 3 || s.ans[i].c >= 0 || s.t <= 0) return;
      s.ans[i] = { c, t: Math.max(0, Math.round(s.t * 10) / 10) }; check(s, H);
    },
    tick(s, dt, H) {
      if (s.over || s.phase !== 'q') return;
      s.t = Math.max(0, s.t - dt);
      if (s.t <= 0) settle(s, H); else check(s, H);
    },
    bot(s, pid) {
      const i = s.ids.indexOf(pid); if (i < 0 || s.over || s.phase !== 'q' || s.ans[i].c >= 0) return null;
      const delay = 1.5 + (hash(pid + s.qi) % 90) / 10;
      if (QT - s.t < delay) return null;
      const q = s.qs[s.qi];
      return { t: 'ans', i: Math.random() < .65 ? q.a : Math.floor(Math.random() * 4) };
    },
    view(s, C) {
      const me = s.ids.indexOf(C.me), q = s.qs[s.qi], rev = s.phase === 'rev', my = me >= 0 ? s.ans[me] : { c: -1 };
      const key = s.qi + s.phase;
      if (seen !== key) { if (rev && seen) C.sfx(me >= 0 && my.c === q.a ? 'good' : me >= 0 ? 'bad' : 'tick'); else if (seen) C.sfx('pop'); seen = key; }
      const btns = q.o.map((o, i) => {
        const cls = rev ? (i === q.a ? 'right' : 'dim') : my.c === i ? 'sel' : my.c >= 0 ? 'dim' : '';
        const who = rev ? s.ids.map((id, k) => s.ans[k].c === i ? k : -1).filter(k => k >= 0).map(k => `<span style="color:${C.esc(C.pl(s.ids[k]).color)}">●</span>`).join('') : '';
        return `<button style="--bc:${COLS[i]}" class="${cls}" ${Hub.A({ t: 'ans', i })} ${rev || my.c >= 0 || me < 0 ? 'disabled' : ''}><span class="sh">${SHAPES[i]}</span><span>${C.esc(o)}</span><span class="who">${who}</span></button>`;
      }).join('');
      const order = s.ids.map((_, i) => i).sort((a, b) => s.scores[b] - s.scores[a]);
      const lb = order.map((i, r) => `<div class="tv-r" style="border-left:4px solid ${C.esc(C.pl(s.ids[i]).color)}"><span class="pos">${r + 1}</span><span class="sp">${C.chip(s.ids[i])}</span><span class="st">${rev ? (s.ans[i].c === q.a ? '✅' : s.ans[i].c < 0 ? '⌛' : '❌') : s.ans[i].c >= 0 ? '✔' : ''}</span>${rev ? `<span class="gain ${s.gain[i] ? '' : 'z'}">+${s.gain[i]}</span>` : ''}<b>${s.scores[i]}</b></div>`).join('');
      const status = rev ? (me < 0 ? 'Answer revealed' : my.c === q.a ? `Correct! +${s.gain[me]}` : my.c < 0 ? 'Time is up!' : 'Not quite…') : me < 0 ? 'Watching…' : my.c >= 0 ? 'Locked in! Waiting for others…' : 'Quick, answer!';
      return CSS + `<div class="tv"><div class="tv-top"><span class="tv-n">Q ${s.qi + 1}/${NQ}</span><div class="bar tv-t"><i style="width:${rev ? 0 : Math.round(s.t / QT * 100)}%"></i></div><span class="tv-n">${rev ? '' : Math.ceil(s.t) + 's'}</span></div>
        <div class="tv-q"><span class="cat">${CATS[q.c]}</span><h2>${C.esc(q.q)}</h2></div>
        <div class="turn ${me >= 0 && !rev && my.c < 0 ? 'mine' : ''}">${status}</div>
        <div class="tv-a">${btns}</div><div class="tv-lb">${lb}</div></div>`;
    },
  };
  Hub.register(G);
})();

}catch(e){console.error('Game file trivia.js failed to load',e)}
/* truthdare.js */
try{
(() => {
  const T = ['What is the funniest thing that ever happened to you at school?', 'What is your most embarrassing nickname?', 'What food could you eat every day for a year?', 'Who in this room do you think is the best cook?', 'What is the silliest thing you are afraid of?', 'What is the best gift you have ever received?', 'If you could have any superpower, what would it be and why?', 'What is your favourite family memory?', 'What is the weirdest dream you can remember?', 'What song do you secretly love singing?', 'What was your favourite cartoon as a kid?', 'What is one thing you would change about yourself for a day?', 'What is the funniest thing you have ever seen online?', 'What is your most-used emoji?', 'Which animal would you be for a day and why?', 'What is the longest you have gone without sleeping?', 'What is your go-to karaoke song?', 'What would you do with ₹1 crore in one day?', 'What is a talent you wish you had?', 'What was the last thing that made you laugh out loud?', 'What is the worst haircut you have ever had?', 'If you were a vegetable, which one would you be?', 'What is the strangest food you have ever tried?', 'Who is your favourite person in this room and why?', 'What is your biggest pet peeve?', 'What is your favourite thing about your family?', 'What is the most childish thing you still do?', 'Have you ever laughed at the wrong moment? What happened?', 'What was your first ever phone like?', 'Which game would you never want to lose at?', 'What is the nicest thing someone did for you recently?', 'What is something you are really proud of?', 'If you could live anywhere in the world, where would it be?', 'What is the silliest rule you had to follow as a kid?', 'What would your superhero name be?', 'What is your lucky number and why?', 'Which movie can you watch over and over?', 'What is your best joke? Tell it!', 'What was your favourite toy growing up?', 'What is the funniest autocorrect fail you have had?'];
  const D = ['Do your best impression of a monkey for 10 seconds.', 'Sing the chorus of any song in a very deep voice.', 'Dance without music for 15 seconds.', 'Talk like a robot until your next turn.', 'Walk like a penguin across the room.', 'Do 10 jumping jacks right now.', 'Speak in a funny accent for the next two rounds.', 'Make up a 4-line poem about the person on your left.', 'Balance a spoon on your nose for 5 seconds.', 'Act out an animal until someone guesses it.', 'Let the group give you a silly nickname for the rest of the game.', 'Pretend to be a news reporter and report on what is happening in the room.', 'Say the alphabet backwards as fast as you can.', 'Hop on one foot while counting to 15.', 'Do your best catwalk across the room.', 'Tell a joke with a totally straight face.', 'Pretend you are a chef and describe making a sandwich dramatically.', 'Do an impression of your favourite cartoon character.', 'Clap with your eyes closed to the rhythm of any song until it is guessed.', 'Draw a picture of a dog on your hand with your finger.', 'Speak only in questions until your next turn.', 'Pretend to be a superhero and strike three poses.', 'Name 10 fruits in 15 seconds.', 'Make the funniest face you can and hold it for 10 seconds.', 'Sing "Happy Birthday" like an opera singer.', 'Act like a baby for 20 seconds.', 'Say "red lorry yellow lorry" five times fast.', 'Whisper everything you say until your next turn.', 'Do a slow-motion replay of a goal celebration.', 'Hum a song and let the group guess it.', 'Pretend you are underwater for 10 seconds.', 'Give a 15-second speech about why pizza is the best food.', 'Do a magic trick (or pretend to!).', 'Spin around 5 times and then try to walk straight.', 'Make an animal sound of the group\'s choice.', 'Speak like a pirate for the next round.', 'Mime brushing your teeth in the most dramatic way possible.', 'Stand like a statue until the next player finishes their turn.', 'Do a funny walk across the room and back.', 'Tell the group your best dad joke.'];
  const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  Hub.register({
    id: 'truthdare', name: 'Truth or Dare', cat: 'Party', icon: '🍾', blurb: 'Family-friendly spin, truth, dare & laughs.', min: 2, max: 10,
    how: ['The bottle spins and picks a player.', 'That player chooses <b>Truth</b> or <b>Dare</b> and a card appears.', 'Do it (or answer honestly!) then tap <b>Done ✔</b> for +2 points. Chickening out? <b>Skip</b> costs 1 point.', 'Everyone gets 3 turns. Highest score wins. Keep it fun and kind!'],
    init(P) { return { ids: P.map(p => p.id), ph: 'idle', cur: -1, turns: P.map(() => 0), sc: P.map(() => 0), card: '', kind: '', n: 0, tu: [], du: [] }; },
    act(s, pid, a, H) {
      const k = s.ids.indexOf(pid); if (k < 0) return;
      if (a.t === 'spin' && s.ph === 'idle') { s.ph = 'spin'; s.n++; const min = Math.min(...s.turns), c = s.ids.map((_, i) => i).filter(i => s.turns[i] === min && H.online(s.ids[i])); s.cur = H.pick(c.length ? c : [0]); H.after(2000, () => { s.ph = 'choose'; }); }
      else if (a.t === 'pick' && s.ph === 'choose' && k === s.cur && (a.k === 'T' || a.k === 'D')) { const L = a.k === 'T' ? T : D, used = a.k === 'T' ? s.tu : s.du; let i; do { i = H.int(L.length); } while (used.includes(i) && used.length < L.length - 1); used.push(i); s.card = L[i]; s.kind = a.k; s.ph = 'card'; }
      else if (a.t === 'done' && s.ph === 'card' && k === s.cur) { s.sc[k] += a.skip ? -1 : 2; s.turns[k]++; s.ph = 'idle'; if (s.turns.every(t => t >= 3)) { const m = Math.max(...s.sc); s.over = { title: '🍾 Party star!', winners: s.ids.filter((_, i) => s.sc[i] === m), rows: s.ids.map((id, i) => ({ pid: id, text: s.sc[i] + ' pts' })) }; } }
    },
    bot(s, pid) { const k = s.ids.indexOf(pid); if (s.ph === 'idle') return k === 0 ? { t: 'spin' } : null; if (k !== s.cur) return null; if (s.ph === 'choose') return { t: 'pick', k: Math.random() < .5 ? 'T' : 'D' }; if (s.ph === 'card') return { t: 'done', skip: Math.random() < .1 }; return null; },
    view(s, C) {
      const me = C.seat(C.me), mine = me === s.cur, ang = s.cur >= 0 ? 360 * 4 + (s.cur / s.ids.length) * 360 : 0;
      const ring = s.ids.map((id, k) => { const a = k / s.ids.length * 2 * Math.PI - Math.PI / 2; return `<span class="pl ${k === s.cur && s.ph !== 'spin' ? 'me' : ''}" style="--c:${C.pl(id).color};position:absolute;left:${50 + 42 * Math.cos(a)}%;top:${50 + 42 * Math.sin(a)}%;transform:translate(-50%,-50%);font-size:13px">${C.esc(C.pl(id).name.split(' ')[0])}</span>`; }).join('');
      return `<style>@keyframes spinb{from{transform:rotate(0)}to{transform:rotate(${ang}deg)}}.tdw{position:relative;width:min(86vw,360px);aspect-ratio:1;margin:8px auto}.bt{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(60px,18vw,110px);transform:rotate(${ang}deg);animation:${s.ph === 'spin' ? 'spinb 2s cubic-bezier(.2,.8,.3,1)' : 'none'}}</style>
      <div class="stack"><div class="scores">${s.ids.map((id, k) => `<div class="score ${s.cur === k ? 'cur' : ''}">${C.chip(id)} <b>${s.sc[k]}</b><small class="muted">${s.turns[k]}/3</small></div>`).join('')}</div>
      <div class="tdw">${ring}<div class="bt" key="${s.n}"><span style="transform:rotate(-90deg)">🍾</span></div></div>
      ${s.ph === 'idle' ? `<button class="btn big" ${Hub.A({ t: 'spin' })}>🍾 Spin the bottle</button>` : ''}
      ${s.ph === 'choose' ? `<div class="turn ${mine ? 'mine' : ''}">${C.esc(C.pl(s.ids[s.cur]).name)}, choose!</div><div class="row"><button class="btn big" ${Hub.A({ t: 'pick', k: 'T' })} ${mine ? '' : 'disabled'}>🤔 Truth</button><button class="btn big bad" ${Hub.A({ t: 'pick', k: 'D' })} ${mine ? '' : 'disabled'}>🔥 Dare</button></div>` : ''}
      ${s.ph === 'card' ? `<div class="panel center" style="max-width:520px;font-size:clamp(18px,3.4vw,26px);border:2px solid ${s.kind === 'T' ? '#3db8ff' : '#ff5d73'}"><div class="muted">${s.kind === 'T' ? '🤔 TRUTH' : '🔥 DARE'} for ${C.chip(s.ids[s.cur])}</div><p>${C.esc(s.card)}</p></div><div class="row"><button class="btn ok" ${Hub.A({ t: 'done' })} ${mine ? '' : 'disabled'}>Done ✔ (+2)</button><button class="btn alt" ${Hub.A({ t: 'done', skip: 1 })} ${mine ? '' : 'disabled'}>Skip (−1)</button></div>` : ''}
      ${s.ph === 'spin' ? '<div class="turn">Spinning…</div>' : ''}</div>`;
    },
  });
})();

}catch(e){console.error('Game file truthdare.js failed to load',e)}
/* tugwar.js */
try{
(() => {
  Hub.register({
    id: 'tugwar', name: 'Tap Tug of War', cat: 'Action', icon: '🪢', blurb: 'Tap like crazy — pull the rope your way!', min: 2, max: 10, hz: 15, botMs: 170,
    how: ['Players are split into <b>two teams</b> (alternating) — your team colour is shown.', 'When the countdown ends, <b>tap the big button</b> (or press <span class="kbd">Space</span>) as fast as you can.', 'Every tap pulls the rope toward your side. Pull it over the line to win the round.', 'Best of 3 rounds.'],
    init(P) { return { ids: P.map(p => p.id), pos: 0, sc: [0, 0], rd: 1, cd: 3, t: 0, tk: P.map(() => 3), res: -1 }; },
    tick(s, dt, H) {
      s.tk = s.tk.map(x => Math.min(3, x + 12 * dt));
      if (s.res >= 0) { s.cd -= dt; if (s.cd <= 0) { s.res = -1; s.pos = 0; s.cd = 2.5; s.t = 0; s.rd++; } return; }
      if (s.cd > 0) { s.cd -= dt; return; }
      s.t += dt; s.pos = Math.round(s.pos * 10) / 10;
      let w = -1; if (s.pos >= 100) w = 0; else if (s.pos <= -100) w = 1; else if (s.t > 30) w = s.pos > 0 ? 0 : s.pos < 0 ? 1 : 2;
      if (w >= 0) { if (w < 2) s.sc[w]++; s.res = w; s.cd = 2.2; if (s.sc[0] >= 2 || s.sc[1] >= 2 || s.rd >= 3) { const t = s.sc[0] > s.sc[1] ? 0 : s.sc[1] > s.sc[0] ? 1 : -1; s.over = { title: t < 0 ? '🤝 Tie!' : `🏆 Team ${t + 1} wins!`, winners: s.ids.filter((_, k) => k % 2 === t), rows: s.ids.map((id, k) => ({ pid: id, text: `Team ${k % 2 + 1}` })) }; } }
    },
    act(s, pid, a) {
      if (a.t !== 'tap' || s.cd > 0 || s.res >= 0) return; const k = s.ids.indexOf(pid); if (k < 0 || s.tk[k] < 1) return; s.tk[k]--;
      const size = s.ids.filter((_, j) => j % 2 === k % 2).length, n = s.ids.length / 2; s.pos += (k % 2 ? -1 : 1) * 1.1 * n / size;
    },
    bot() { return Math.random() < .85 ? { t: 'tap' } : null; },
    mount(el, C) {
      el.innerHTML = `<style>.tg{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:14px;align-items:center}.rope{position:relative;width:100%;height:92px;border-radius:20px;background:linear-gradient(90deg,#ff5d7355,#0003 50%,#3db8ff55);border:1px solid var(--line);overflow:hidden}
.rope i{position:absolute;left:50%;top:0;bottom:0;width:3px;background:#fff6}.rope .knot{position:absolute;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#e0a020);box-shadow:0 0 20px #ffd84a;transition:left .12s linear;display:grid;place-items:center;font-size:24px}
.rope .ln{position:absolute;top:50%;left:0;right:0;height:6px;margin-top:-3px;background:repeating-linear-gradient(90deg,#c9a56a 0 10px,#a9854a 10px 20px)}
.tapb{width:min(70vw,300px);aspect-ratio:1;border-radius:50%;border:0;font-size:46px;font-weight:700;color:#fff;cursor:pointer;touch-action:manipulation;box-shadow:0 12px 40px #0008,inset 0 -10px 0 #0004;transition:transform .05s;user-select:none}.tapb:active{transform:scale(.93)}
.tcd{font-size:clamp(50px,14vw,110px);font-weight:700;min-height:1.1em;text-shadow:0 0 24px #7c5cff}</style><div class="tg"><div class="scores tsc"></div><div class="rope"><div class="ln"></div><i></i><div class="knot">🪢</div></div><div class="tcd"></div><button class="tapb">TAP!</button><div class="muted tmsg"></div></div>`;
      const q = x => el.querySelector(x), btn = q('.tapb'), knot = q('.knot'); let S = null, last = 0;
      const tap = e => { if (e) e.preventDefault(); C.send({ t: 'tap' }); C.sfx('tick'); };
      btn.addEventListener('pointerdown', tap); const kd = e => { if (e.code === 'Space' && !e.repeat) tap(e); }; window.addEventListener('keydown', kd);
      const update = s => {
        S = s; const me = C.seat(C.me), team = me >= 0 ? me % 2 : -1, tc = ['#ff5d73', '#3db8ff'];
        q('.tsc').innerHTML = [0, 1].map(t => `<div class="score" style="border-color:${tc[t]}"><span class="dot" style="--c:${tc[t]}"></span>Team ${t + 1}: ${s.ids.map((id, k) => k % 2 === t ? C.esc(C.pl(id).name.split(' ')[0]) : '').filter(Boolean).join(', ')} <b>${s.sc[t]}</b></div>`).join('');
        knot.style.left = (50 - s.pos / 2) + '%'; btn.style.background = team < 0 ? '#555' : tc[team]; btn.disabled = team < 0; btn.textContent = team < 0 ? '👀' : 'TAP!';
        q('.tcd').textContent = s.res >= 0 ? (s.res === 2 ? 'Tie round' : `Team ${s.res + 1} wins round!`) : s.cd > 0 ? Math.ceil(s.cd) : '';
        q('.tmsg').textContent = `Round ${s.rd}/3 · you are ${team < 0 ? 'spectating' : 'Team ' + (team + 1)}`;
        if (s.res >= 0 && s.res !== last) C.sfx(s.res === team ? 'good' : 'bad'); last = s.res;
      };
      update.destroy = () => window.removeEventListener('keydown', kd); return update;
    },
  });
})();

}catch(e){console.error('Game file tugwar.js failed to load',e)}
/* tycoon.js */
try{
(() => {
  // Property Tycoon — a Monopoly-style game with its own names/artwork (not the Monopoly brand).
  const G = { brown: '#8b5a3c', sky: '#7fd6ff', pink: '#ff7ac8', orange: '#ff9a3c', red: '#ee4b4b', yellow: '#ffd84a', green: '#3fbf6a', blue: '#4a6cff' };
  const B = [['go', 'GO'], ['p', 'Dosa Dhaba', 'brown', 60], ['chest', 'Community Chest'], ['p', 'Chai Corner', 'brown', 60], ['tax', 'Income Tax', 200], ['rail', 'Central Railway', 200],
    ['p', 'Marine Drive', 'sky', 100], ['chance', 'Chance'], ['p', 'Juhu Beach', 'sky', 100], ['p', 'Gateway Plaza', 'sky', 120], ['jail', 'Jail'],
    ['p', 'Lotus Garden', 'pink', 140], ['util', 'Electric Co.', 150], ['p', 'Rose Avenue', 'pink', 140], ['p', 'Jasmine Road', 'pink', 160], ['rail', 'Eastern Railway', 200],
    ['p', 'Fort Street', 'orange', 180], ['chest', 'Community Chest'], ['p', 'Palace Lane', 'orange', 180], ['p', 'Haveli Square', 'orange', 200], ['free', 'Free Parking'],
    ['p', 'Spice Market', 'red', 220], ['chance', 'Chance'], ['p', 'Bazaar Road', 'red', 220], ['p', 'Silk Street', 'red', 240], ['rail', 'Western Railway', 200],
    ['p', 'Tech Park', 'yellow', 260], ['p', 'Cyber Hub', 'yellow', 260], ['util', 'Water Works', 150], ['p', 'Startup Alley', 'yellow', 280], ['gojail', 'Go To Jail'],
    ['p', 'Hill Station', 'green', 300], ['p', 'Tea Estate', 'green', 300], ['chest', 'Community Chest'], ['p', 'Coffee Ridge', 'green', 320], ['rail', 'Southern Railway', 200],
    ['chance', 'Chance'], ['p', 'Royal Palace', 'blue', 350], ['tax', 'Luxury Tax', 100], ['p', 'Crown Tower', 'blue', 400]]
    .map(([t, n, a, b], i) => t === 'p' ? { t, n, g: a, p: b, i } : t === 'tax' ? { t, n, tax: a, i } : t === 'rail' ? { t, n, p: a, i } : t === 'util' ? { t, n, p: a, i } : { t, n, i });
  const GROUPS = {}; B.forEach(q => { if (q.g) (GROUPS[q.g] = GROUPS[q.g] || []).push(q.i); });
  const CARDS = [
    { x: 'Advance to GO and collect ₹200', m: 0 }, { x: 'Bank pays you a dividend of ₹50', g: 50 }, { x: 'Go directly to Jail!', j: 1 }, { x: 'Advance to Crown Tower', m: 39 },
    { x: 'Go back 3 spaces', b: 3 }, { x: 'Pay a speeding fine of ₹30', g: -30 }, { x: 'Your building loan matures: collect ₹150', g: 150 }, { x: 'Advance to Spice Market', m: 21 },
    { x: "It's your birthday! Collect ₹20 from every player", e: 20 }, { x: 'Pay for school fees: ₹50', g: -50 }, { x: 'You won a quiz! Collect ₹100', g: 100 }, { x: 'Pay each player ₹25 for a party', e: -25 },
    { x: 'Doctor\'s fee: pay ₹40', g: -40 }, { x: 'Tax refund: collect ₹60', g: 60 }, { x: 'Advance to Lotus Garden', m: 11 }, { x: 'Lucky lottery! Collect ₹120', g: 120 }];
  const alive = s => s.ids.map((_, i) => i).filter(i => !s.out[i]);
  const owns = (s, seat, g) => GROUPS[g].every(i => s.own[i] === seat);
  const worth = (s, i) => s.cash[i] + B.reduce((a, q, k) => a + (s.own[k] === i ? (q.p || 0) + s.hs[k] * 50 : 0), 0);
  const log = (s, m) => { s.log.push(m); if (s.log.length > 5) s.log.shift(); };
  const nm = (s, i) => 'P' + (i + 1);
  function rentOf(s, k, d) {
    const q = B[k], o = s.own[k];
    if (q.t === 'rail') return 25 * 2 ** (B.filter(z => z.t === 'rail' && s.own[z.i] === o).length - 1);
    if (q.t === 'util') return d * (B.filter(z => z.t === 'util' && s.own[z.i] === o).length > 1 ? 10 : 4);
    const base = Math.max(2, Math.round(q.p / 10)); return owns(s, o, q.g) ? base * 2 + s.hs[k] * base * 3 : base;
  }
  function bankrupt(s, i, to) {
    s.out[i] = 1; log(s, `${s.names[i]} went bankrupt!`);
    B.forEach((q, k) => { if (s.own[k] === i) { s.own[k] = to != null && to >= 0 ? to : -1; s.hs[k] = 0; } });
    if (to != null && to >= 0) s.cash[to] += Math.max(0, s.cash[i]); s.cash[i] = 0;
    if (alive(s).length <= 1) finish(s);
  }
  function pay(s, i, amt, to) {
    if (s.cash[i] >= amt) { s.cash[i] -= amt; if (to != null && to >= 0) s.cash[to] += amt; return; }
    // sell houses automatically to raise cash
    for (const k of B.keys()) while (s.own[k] === i && s.hs[k] > 0 && s.cash[i] < amt) { s.hs[k]--; s.cash[i] += 25; }
    if (s.cash[i] >= amt) { s.cash[i] -= amt; if (to != null && to >= 0) s.cash[to] += amt; } else { s.cash[i] -= amt; bankrupt(s, i, to); }
  }
  function finish(s) {
    const al = alive(s), order = s.ids.map((_, i) => i).sort((a, b) => (s.out[a] - s.out[b]) || worth(s, b) - worth(s, a));
    const w = al.length === 1 ? al[0] : order[0];
    s.over = { title: `🏆 ${s.names[w]} is the Tycoon!`, winners: [s.ids[w]], rows: order.map(i => ({ pid: s.ids[i], text: s.out[i] ? 'bankrupt' : '₹' + worth(s, i) })) };
  }
  function jail(s, i) { s.pos[i] = 10; s.jl[i] = 1; s.again = false; s.dbl = 0; log(s, `${s.names[i]} goes to Jail!`); s.ph = 'end'; }
  function move(s, i, to, fwd) {
    if (fwd && to < s.pos[i]) { s.cash[i] += 200; log(s, `${s.names[i]} passed GO: +₹200`); }
    s.pos[i] = to; land(s, i);
  }
  function land(s, i) {
    const k = s.pos[i], q = B[k]; s.ph = 'end'; s.card = null;
    if (q.t === 'p' || q.t === 'rail' || q.t === 'util') {
      if (s.own[k] < 0) { if (s.cash[i] >= q.p) s.ph = 'buy'; else log(s, `${s.names[i]} can't afford ${q.n}`); }
      else if (s.own[k] !== i) { const r = rentOf(s, k, s.dice[0] + s.dice[1]); log(s, `${s.names[i]} pays ₹${r} rent to ${s.names[s.own[k]]}`); pay(s, i, r, s.own[k]); }
    } else if (q.t === 'tax') { log(s, `${s.names[i]} pays ₹${q.tax} tax`); pay(s, i, q.tax, -1); }
    else if (q.t === 'gojail') jail(s, i);
    else if (q.t === 'chance' || q.t === 'chest') {
      const c = CARDS[s.deck[s.dp++ % s.deck.length]]; s.card = c.x; log(s, `${s.names[i]}: ${c.x}`);
      if (c.g) { if (c.g > 0) s.cash[i] += c.g; else pay(s, i, -c.g, -1); }
      else if (c.j) jail(s, i);
      else if (c.m != null) move(s, i, c.m, true);
      else if (c.b) { s.pos[i] = (s.pos[i] + 37) % 40; land(s, i); }
      else if (c.e) { for (const o of alive(s)) if (o !== i) { if (c.e > 0) pay(s, o, c.e, i); else pay(s, i, -c.e, o); if (s.out[i]) break; } }
    }
  }
  function nextTurn(s, H) {
    let n = s.turn; do { n = (n + 1) % s.ids.length; if (n === 0) s.rounds++; } while (s.out[n] || !H.online(s.ids[n]) && alive(s).length > 1 && s.ids.some((id, j) => !s.out[j] && H.online(id)));
    s.turn = n; s.ph = 'roll'; s.dbl = 0; s.again = false;
    if (s.rounds > 40) finish(s);
  }
  const canBuild = (s, i, k) => { const q = B[k]; return q.t === 'p' && s.own[k] === i && owns(s, i, q.g) && s.hs[k] < 4 && s.cash[i] >= 100 && GROUPS[q.g].every(z => s.hs[z] >= s.hs[k]); };

  function act0(s, pid, a, H) {
      const i = s.ids.indexOf(pid); if (i !== s.turn || s.out[i] || s.over) return;
      if (a.t === 'roll' && s.ph === 'roll') {
        const d1 = 1 + H.int(6), d2 = 1 + H.int(6), dbl = d1 === d2; s.dice = [d1, d2]; s.card = null;
        if (s.jl[i] > 0) {
          if (dbl) { s.jl[i] = 0; log(s, `${s.names[i]} rolled doubles and leaves jail`); }
          else if (s.jl[i] >= 3) { pay(s, i, 50, -1); s.jl[i] = 0; log(s, `${s.names[i]} pays ₹50 to leave jail`); if (s.out[i]) return; }
          else { s.jl[i]++; log(s, `${s.names[i]} stays in jail (${d1}+${d2})`); s.ph = 'end'; return; }
          move(s, i, (s.pos[i] + d1 + d2) % 40, s.pos[i] + d1 + d2 >= 40); return;
        }
        if (dbl) { s.dbl++; if (s.dbl >= 3) { log(s, `${s.names[i]} rolled 3 doubles!`); jail(s, i); return; } s.again = true; } else s.again = false;
        log(s, `${s.names[i]} rolled ${d1}+${d2}`);
        move(s, i, (s.pos[i] + d1 + d2) % 40, s.pos[i] + d1 + d2 >= 40);
      } else if (a.t === 'jailpay' && s.ph === 'roll' && s.jl[i] > 0 && s.cash[i] >= 50) { s.cash[i] -= 50; s.jl[i] = 0; log(s, `${s.names[i]} paid ₹50 bail`); }
      else if (a.t === 'buy' && s.ph === 'buy') { const q = B[s.pos[i]]; if (s.cash[i] >= q.p && s.own[q.i] < 0) { s.cash[i] -= q.p; s.own[q.i] = i; log(s, `${s.names[i]} bought ${q.n}`); } s.ph = 'end'; }
      else if (a.t === 'pass' && s.ph === 'buy') s.ph = 'end';
      else if (a.t === 'build' && (s.ph === 'end' || s.ph === 'roll')) { const k = a.k | 0; if (k >= 0 && k < 40 && canBuild(s, i, k)) { s.cash[i] -= 100; s.hs[k]++; log(s, `${s.names[i]} built a house on ${B[k].n}`); } }
      else if (a.t === 'end' && s.ph === 'end') { if (s.again && !s.jl[i]) { s.ph = 'roll'; s.again = false; } else nextTurn(s, H); }
    
  }
  Hub.register({
    id: 'tycoon', name: 'Property Tycoon', cat: 'Board', icon: '🏙️', blurb: 'Buy streets, collect rent, bankrupt your friends.', min: 2, max: 6,
    how: ['Everyone starts with <b>₹1500</b>. Roll two dice and move around the board.', 'Land on an unowned street, railway or utility? <b>Buy</b> it — or pass.', 'Land on someone else’s property and you pay <b>rent</b>. Owning a full colour set doubles the rent and lets you <b>build houses</b> (🏠 ₹100 each).', 'Chance ❓ and Community Chest 📦 squares draw surprise cards. Doubles = roll again; 3 doubles or “Go To Jail” sends you to jail.', 'Run out of money and you’re bankrupt. Last tycoon standing wins — or the richest after 40 rounds.'],
    init(P, H) {
      const n = P.length;
      return { ids: P.map(p => p.id), names: P.map((_, i) => 'P' + (i + 1)), pos: Array(n).fill(0), cash: Array(n).fill(1500), own: Array(40).fill(-1), hs: Array(40).fill(0), jl: Array(n).fill(0), out: Array(n).fill(0), turn: 0, ph: 'roll', dice: [1, 1], dbl: 0, again: false, rounds: 1, log: ['Game on! Roll the dice.'], card: null, deck: H.shuffle([...CARDS.keys()]), dp: 0 };
    },
    act(s, pid, a, H) { act0(s, pid, a, H); if (!s.over && s.out[s.turn]) nextTurn(s, H); },
    bot(s, pid) {
      const i = s.ids.indexOf(pid); if (i !== s.turn || s.out[i] || s.over) return null;
      if (s.ph === 'roll') return s.jl[i] > 0 && s.cash[i] > 400 && Math.random() < .5 ? { t: 'jailpay' } : { t: 'roll' };
      if (s.ph === 'buy') return { t: s.cash[i] - B[s.pos[i]].p >= 80 || Math.random() < .3 ? 'buy' : 'pass' };
      const k = B.findIndex(q => canBuild(s, i, q.i) && s.cash[i] > 350); if (k >= 0 && Math.random() < .6) return { t: 'build', k };
      return { t: 'end' };
    },
    view(s, C) {
      const me = s.ids.indexOf(C.me), mine = me === s.turn && !s.over, rc = k => k <= 10 ? [11, 11 - k] : k <= 19 ? [11 - (k - 10), 1] : k <= 30 ? [1, 1 + (k - 20)] : [1 + (k - 30), 11];
      const col = i => C.pl(s.ids[i]).color;
      const cells = B.map((q, k) => {
        const [r, c] = rc(k), corner = [0, 10, 20, 30].includes(k), own = s.own[k] >= 0 ? col(s.own[k]) : null;
        const here = s.ids.map((_, i) => s.pos[i] === k && !s.out[i] ? `<i class="tk" style="background:${col(i)}"></i>` : '').join('');
        const ico = { go: '➡️', chest: '📦', chance: '❓', jail: '🔒', free: '🅿️', gojail: '👮', tax: '💸', rail: '🚂', util: q.n.startsWith('Elec') ? '💡' : '🚰' }[q.t] || '';
        return `<div class="tc ${corner ? 'cn' : ''} ${s.pos[s.turn] === k ? 'cur' : ''}" style="grid-row:${r};grid-column:${c}">
          ${q.g ? `<b class="bar" style="background:${G[q.g]}"></b>` : ''}<span class="nn">${ico} ${C.esc(q.n)}</span>${q.p ? `<small>₹${q.p}</small>` : q.tax ? `<small>₹${q.tax}</small>` : ''}
          ${s.hs[k] ? `<em>${'🏠'.repeat(Math.min(1, s.hs[k]))}${s.hs[k] > 1 ? '×' + s.hs[k] : ''}</em>` : ''}${own ? `<u style="background:${own}"></u>` : ''}<div class="tks">${here}</div></div>`;
      }).join('');
      const dieF = v => `<span class="d">${['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][v]}</span>`;
      const q = B[s.pos[s.turn]];
      let btn = '';
      if (mine) {
        if (s.ph === 'roll') btn = `<button class="btn ok big" ${Hub.A({ t: 'roll' })}>🎲 Roll dice</button>${s.jl[me] ? `<button class="btn alt" ${Hub.A({ t: 'jailpay' })} ${s.cash[me] < 50 ? 'disabled' : ''}>Pay ₹50 bail</button>` : ''}`;
        else if (s.ph === 'buy') btn = `<button class="btn ok" ${Hub.A({ t: 'buy' })}>Buy ${C.esc(q.n)} ₹${q.p}</button><button class="btn alt" ${Hub.A({ t: 'pass' })}>Pass</button>`;
        else btn = `<button class="btn" ${Hub.A({ t: 'end' })}>${s.again ? '🎲 Roll again (doubles)' : 'End turn ▶'}</button>`;
        if (s.ph !== 'buy') btn += B.filter(z => canBuild(s, me, z.i)).slice(0, 3).map(z => `<button class="btn sm alt" ${Hub.A({ t: 'build', k: z.i })}>🏠 Build on ${C.esc(z.n)}</button>`).join('');
      }
      return `<style>.ty{--s:min(96vw,760px);width:var(--s);margin:0 auto}.tb{display:grid;grid-template:repeat(11,1fr)/repeat(11,1fr);width:100%;aspect-ratio:1;gap:2px;background:#0006;padding:3px;border-radius:14px;border:1px solid var(--line)}
.tc{position:relative;background:#e9f2ea;color:#1b2236;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;min-width:0;min-height:0;line-height:1.05}
.tc.cn{background:#cfd8f5}.tc.cur{outline:2px solid #fff;z-index:2;box-shadow:0 0 12px #fff8}
.tc .bar{position:absolute;top:0;left:0;right:0;height:22%}.tc .nn{font-size:clamp(5px,1.15vw,10px);font-weight:600;padding:0 1px;margin-top:14%;word-break:break-word}.tc small{font-size:clamp(5px,1vw,9px);opacity:.75}
.tc u{position:absolute;bottom:0;left:0;right:0;height:14%}.tc em{position:absolute;right:1px;top:20%;font-size:clamp(6px,1.1vw,10px);font-style:normal}
.tks{position:absolute;bottom:14%;display:flex;gap:1px;flex-wrap:wrap;justify-content:center}.tk{width:clamp(6px,1.5vw,13px);height:clamp(6px,1.5vw,13px);border-radius:50%;border:1.5px solid #fff;box-shadow:0 1px 3px #000a;display:block}
.tm{grid-area:2/2/11/11;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(4px,1vw,10px);padding:4px;min-width:0;color:var(--txt)}
.tm .d{font-size:clamp(34px,8vw,66px);line-height:1}.tm .turn{font-size:clamp(12px,2.2vw,18px);padding:4px 12px}.tm .row{justify-content:center}.tm .btn{font-size:clamp(12px,2vw,16px);padding:7px 14px}
.tl{font-size:clamp(10px,1.7vw,13px);color:var(--muted);text-align:center;max-height:7em;overflow:hidden}.tl div:last-child{color:var(--txt)}
.tp{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;font-size:clamp(10px,1.8vw,13px)}.tp span{padding:2px 8px;border-radius:10px;background:#0005;border:2px solid var(--c)}.tp span.cur{background:var(--c);color:#111;font-weight:700}.tp span.out{opacity:.35;text-decoration:line-through}</style>
<div class="ty"><div class="tb">${cells}<div class="tm">
 <div class="tp">${s.ids.map((id, i) => `<span class="${i === s.turn ? 'cur' : ''} ${s.out[i] ? 'out' : ''}" style="--c:${col(i)}">${C.esc(C.pl(id).name.split(' ')[0])}${i === me ? ' (you)' : ''} ₹${s.cash[i]}${s.jl[i] ? '🔒' : ''}</span>`).join('')}</div>
 <div>${dieF(s.dice[0])}${dieF(s.dice[1])}</div>
 <div class="turn ${mine ? 'mine' : ''}">${s.over ? 'Game over' : mine ? 'Your turn!' : C.esc(C.pl(s.ids[s.turn]).name) + "'s turn"} · Round ${Math.min(s.rounds, 40)}/40</div>
 ${s.card ? `<div class="panel" style="padding:6px 12px;font-size:clamp(11px,2vw,15px)">🃏 ${C.esc(s.card)}</div>` : ''}
 <div class="row">${btn}</div><div class="tl">${s.log.map(l => `<div>${C.esc(l.replace(/P(\d)/g, (m, d) => C.pl(s.ids[d - 1]) ? C.pl(s.ids[d - 1]).name.split(' ')[0] : m))}</div>`).join('')}</div></div></div></div>`;
    },
  });
})();

}catch(e){console.error('Game file tycoon.js failed to load',e)}
/* typingrace.js */
try{
(() => {
  const TX = ['The quick brown fox jumps over the lazy dog.', 'Friends who play together stay together forever.', 'A rolling stone gathers no moss but a fast typist gathers points.', 'Chai tastes best when shared with family on a rainy evening.', 'Every great journey begins with a single small step.', 'Practice makes perfect, so keep your fingers moving.', 'The monsoon clouds rolled in and the whole street danced.', 'Cricket on the terrace is the best game in the world.', 'Never underestimate the power of a good laugh.', 'Fast fingers win races but steady hands win hearts.', 'Pack your box with five dozen liquor jugs.', 'Dreams do not work unless you do, so type faster.', 'A quiet sunrise over the mountains brings a calm mind.', 'Pizza, popcorn and a movie make a perfect Friday night.', 'The rocket blasted off and the crowd roared with joy.', 'Grandma said the secret ingredient is always more love.', 'Keep calm and type on, the finish line is near.', 'Bright stars sparkle above the sleeping little village.', 'Winning is fun but playing together is even better.', 'He who laughs last probably did not get the joke.'];
  Hub.register({
    id: 'typingrace', name: 'Typing Race', cat: 'Party', icon: '⌨️', blurb: 'Type the sentence faster than everyone.', min: 2, max: 10, hz: 8, botMs: 400,
    how: ['A sentence appears — everyone races to type it <b>exactly</b>.', 'Green letters are correct. A red letter means a mistake: fix it to continue.', 'First to finish gets the most points. 2 sentences per game.', 'Click the box and start typing when the countdown ends!'],
    init(P, H) { return { ids: P.map(p => p.id), tx: H.shuffle(TX).slice(0, 2), r: 0, n: P.map(() => 0), fin: P.map(() => 0), lt: P.map(() => 0), pts: P.map(() => 0), cd: 4, t: 0, nf: 0, gap: 0 }; },
    tick(s, dt, H) {
      if (s.cd > 0) { s.cd -= dt; return; }
      if (s.gap > 0) { s.gap -= dt; if (s.gap <= 0) { if (s.r >= 1) { const m = Math.max(...s.pts); s.over = { title: '⌨️ Fastest typist!', winners: s.ids.filter((_, k) => s.pts[k] === m), rows: s.ids.map((id, k) => ({ pid: id, text: s.pts[k] + ' pts' })) }; } else { s.r++; s.n = s.n.map(() => 0); s.fin = s.fin.map(() => 0); s.lt = s.lt.map(() => 0); s.t = 0; s.nf = 0; s.cd = 3; } } return; }
      s.t += dt; if (s.fin.every((f, k) => f || !H.online(s.ids[k])) || s.t > 90) s.gap = 3;
    },
    act(s, pid, a) {
      if (a.t !== 'p' || s.cd > 0 || s.gap > 0) return; const k = s.ids.indexOf(pid), L = s.tx[s.r].length; if (k < 0 || s.fin[k]) return;
      const n = Math.max(0, Math.min(L, a.n | 0)), allow = s.n[k] + (s.t - s.lt[k]) * 30 + 6; if (n > allow) return; s.n[k] = n; s.lt[k] = s.t;
      if (n >= L) { s.fin[k] = ++s.nf; s.pts[k] += Math.max(1, s.ids.length + 1 - s.nf) ; }
    },
    bot(s, pid) { const k = s.ids.indexOf(pid); if (s.cd > 0 || s.gap > 0 || s.fin[k]) return null; const sp = 3 + (k * 7 % 5), n = Math.min(s.tx[s.r].length, Math.floor(s.t * sp)); return n > s.n[k] ? { t: 'p', n } : null; },
    mount(el, C) {
      el.innerHTML = `<style>.tr{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px}.tt{font:500 clamp(18px,3.6vw,28px)/1.6 ui-monospace,Menlo,monospace;padding:18px;border-radius:16px;background:var(--card);border:1px solid var(--line);word-break:break-word;user-select:none}.tt .ok{color:#3ddc97}.tt .bad{background:#ff5d73;color:#fff;border-radius:3px}.tt .cur{border-left:2px solid #fff;animation:blink 1s infinite}@keyframes blink{50%{border-color:transparent}}
.lane{display:flex;align-items:center;gap:10px}.lane .tr2{flex:1;height:26px;border-radius:99px;background:#0005;position:relative;overflow:hidden}.lane .tr2 i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;transition:width .25s}.lane .tr2 b{position:absolute;right:8px;top:2px;font-size:13px}.lane .nm{width:120px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr .tcd{text-align:center;font-size:44px;font-weight:700;min-height:54px}</style>
      <div class="tr"><div class="tcd"></div><div class="tt"></div><input id="tri" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Start typing here…" style="font-size:20px"><div class="lanes col"></div></div>`;
      const inp = el.querySelector('#tri'), tt = el.querySelector('.tt'); let S = null, lastN = -1, lastR = -1, sent = 0;
      const calc = () => { if (!S) return 0; const t = S.tx[S.r], v = inp.value; let n = 0; while (n < v.length && n < t.length && v[n] === t[n]) n++; return n; };
      const paint = () => { if (!S) return; const t = S.tx[S.r], v = inp.value, n = calc(); tt.innerHTML = [...t].map((ch, i) => { const c = C.esc(ch === ' ' ? ' ' : ch); return `<span class="${i < n ? 'ok' : i < v.length ? 'bad' : i === v.length ? 'cur' : ''}">${i === v.length && i >= n ? '' : ''}${c}</span>`; }).join(''); };
      inp.addEventListener('input', () => { const n = calc(); paint(); if (n !== sent) { sent = n; C.sfx('tick'); C.send({ t: 'p', n }); } });
      if (C.spectator) inp.style.display = 'none';
      return s => {
        S = s; const k = C.seat(C.me); if (s.r !== lastR) { lastR = s.r; inp.value = ''; sent = 0; }
        el.querySelector('.tcd').textContent = s.cd > 0 ? (s.cd > 3.2 ? 'Sentence ' + (s.r + 1) + '/2' : Math.ceil(s.cd)) : s.gap > 0 ? 'Round over!' : '';
        inp.disabled = s.cd > 0 || s.gap > 0 || (k >= 0 && s.fin[k] > 0); if (!inp.disabled && lastN !== 1) { inp.focus(); } lastN = inp.disabled ? 0 : 1; paint();
        const L = s.tx[s.r].length; el.querySelector('.lanes').innerHTML = s.ids.map((id, i) => `<div class="lane"><span class="nm">${C.esc(C.pl(id).name)}</span><div class="tr2"><i style="width:${s.n[i] / L * 100}%;background:${C.pl(id).color}"></i><b>${s.fin[i] ? '🏁 #' + s.fin[i] : Math.round(s.n[i] / L * 100) + '%'}</b></div><b>${s.pts[i]}</b></div>`).join('');
      };
    },
  });
})();

}catch(e){console.error('Game file typingrace.js failed to load',e)}
/* whack.js */
try{
(() => {
  Hub.register({
    id: 'whack', name: 'Whack-a-Mole Race', cat: 'Action', icon: '🔨', blurb: 'Everyone whacks the same moles. Be fastest!', min: 2, max: 10, hz: 15, botMs: 260,
    how: ['Moles 🐹 pop out of the holes for about a second.', 'Tap a mole to whack it — only the <b>first</b> player to hit each mole scores.', 'Avoid the bombs 💣: hitting one costs you a point.', '45 seconds — highest score wins.'],
    init(P) { return { ids: P.map(p => p.id), t: 45, cd: 3, sp: 0, m: [], sc: P.map(() => 0), n: 0 }; },
    tick(s, dt, H) {
      if (s.cd > 0) { s.cd -= dt; return; }
      s.t -= dt; s.m.forEach(m => m.l -= dt); s.m = s.m.filter(m => m.l > -.4); s.sp -= dt;
      if (s.sp <= 0 && s.m.filter(m => m.l > 0).length < 3) { const used = s.m.map(m => m.h), free = [...Array(12).keys()].filter(h => !used.includes(h)); s.m.push({ h: H.pick(free), l: 1 + H.rand() * .5, k: H.rand() < .18 ? 1 : 0, by: -1, id: ++s.n }); s.sp = .35 + H.rand() * .4; }
      if (s.t <= 0) { const m = Math.max(...s.sc); s.over = { title: '🔨 Whack champion!', winners: s.ids.filter((_, k) => s.sc[k] === m), rows: s.ids.map((id, k) => ({ pid: id, text: s.sc[k] + ' pts' })) }; }
    },
    act(s, pid, a) {
      if (a.t !== 'w' || s.cd > 0) return; const k = s.ids.indexOf(pid), m = s.m.find(m => m.h === (a.h | 0) && m.l > 0 && m.by < 0); if (k < 0 || !m) return;
      m.by = k; m.l = 0; s.sc[k] += m.k ? -1 : 1;
    },
    bot(s, pid) { const m = s.m.find(m => m.l > 0 && m.by < 0 && !m.k); return m && Math.random() < .5 ? { t: 'w', h: m.h } : null; },
    mount(el, C) {
      el.innerHTML = `<style>.wk{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center}.wg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%;padding:12px;border-radius:20px;background:#3b2a1a;border:1px solid var(--line)}
.wh{position:relative;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 60%,#120c06 55%,#5a3d22 58%);border:0;overflow:hidden;cursor:pointer;touch-action:manipulation;padding:0}.wh span{position:absolute;left:0;right:0;bottom:-100%;text-align:center;font-size:clamp(28px,9vw,54px);transition:bottom .12s}.wh.up span{bottom:12%}.wh.hit span{bottom:12%;filter:grayscale(1) brightness(.6)}
.wcd{font-size:60px;font-weight:700;min-height:70px}</style><div class="wk"><div class="scores wsc"></div><div class="bar" style="width:100%"><i class="wt" style="width:100%"></i></div><div class="wcd"></div><div class="wg">${Array.from({ length: 12 }, (_, h) => `<button class="wh" data-h="${h}"><span></span></button>`).join('')}</div></div>`;
      const holes = [...el.querySelectorAll('.wh')]; let seen = {};
      holes.forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); C.send({ t: 'w', h: +b.dataset.h }); }));
      return s => {
        el.querySelector('.wsc').innerHTML = s.ids.map((id, k) => `<div class="score">${C.chip(id)} <b>${s.sc[k]}</b></div>`).join('');
        el.querySelector('.wt').style.width = Math.max(0, s.t / 45 * 100) + '%'; el.querySelector('.wcd').textContent = s.cd > 0 ? Math.ceil(s.cd) : '';
        holes.forEach((b, h) => { const m = s.m.find(m => m.h === h), sp = b.firstChild; b.className = 'wh' + (m ? (m.l > 0 && m.by < 0 ? ' up' : ' hit') : ''); sp.textContent = m ? (m.by >= 0 ? (m.k ? '💥' : '⭐') : m.k ? '💣' : '🐹') : ''; if (m && m.by >= 0 && !seen[m.id]) { seen[m.id] = 1; C.sfx(m.by === C.seat(C.me) ? (m.k ? 'bad' : 'good') : 'tick'); } });
      };
    },
  });
})();

}catch(e){console.error('Game file whack.js failed to load',e)}