/* Game Hub core: networking, screens (landing / lobby / briefing / playing), game runtime. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Hub = window.Hub = { games: [], reg: {}, esc, CATS: ['Board', 'Cards & Dice', 'Party', 'Action', 'Racing'] };
  Hub.ready = [];   // games may push promises here (e.g. dynamic imports) — the test harness awaits them
  Hub.register = g => { if (Hub.reg[g.id]) throw new Error('duplicate game id ' + g.id); Hub.reg[g.id] = g; Hub.games.push(g); };
  Hub.A = o => `data-a='${esc(JSON.stringify(o))}'`;               // use inside view(): <button ${Hub.A({t:'move',i:3})}>
  Hub.chipOf = p => `<span class="pl" style="--c:${esc(p.color)}">${esc(p.name)}</span>`;

  /* host helper API (also used by the test harness with its own online() fn) */
  Hub.makeH = (online, after) => ({
    after: after || ((ms, fn) => setTimeout(fn, ms)),   // H.after(ms, fn): run fn on the host later, then broadcast
    rand: Math.random, int: n => Math.floor(Math.random() * n), pick: a => a[Math.floor(Math.random() * a.length)],
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    now: () => Date.now(), online,
    next(P, i) { const n = P.length; for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (online(P[j].id)) return j; } return i; },
  });

  /* ---------- tiny sound engine ---------- */
  let AC; Hub.muted = false;
  try { Hub.muted = localStorage.gh_mute === '1'; } catch { }
  Hub.sfx = n => {
    if (Hub.muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const T = { tick: [[660, .04]], pop: [[880, .05]], good: [[523, .08], [784, .12]], bad: [[220, .16]], roll: [[300, .03], [400, .03], [500, .03], [420, .03]], win: [[523, .1], [659, .1], [784, .1], [1046, .3]], lose: [[392, .14], [330, .14], [262, .3]], boom: [[120, .2]] }[n] || [[440, .05]];
      let x = AC.currentTime;
      for (const [f, d] of T) { const o = AC.createOscillator(), g = AC.createGain(); o.type = n === 'boom' || n === 'bad' ? 'sawtooth' : 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.07, x); g.gain.exponentialRampToValueAtTime(.0001, x + d); o.connect(g); g.connect(AC.destination); o.start(x); o.stop(x + d); x += d; }
    } catch { }
  };

  /* ---------- identity (random per tab) ---------- */
  const ADJ = ['Swift', 'Brave', 'Cosmic', 'Lucky', 'Sneaky', 'Jolly', 'Mighty', 'Sunny', 'Fuzzy', 'Turbo', 'Clever', 'Wild', 'Happy', 'Zesty', 'Royal', 'Nimble', 'Funky', 'Sleepy', 'Ninja', 'Atomic', 'Dizzy', 'Bouncy', 'Frosty', 'Spicy'];
  const ANI = ['Otter', 'Panda', 'Falcon', 'Tiger', 'Koala', 'Gecko', 'Llama', 'Fox', 'Yak', 'Owl', 'Lynx', 'Hippo', 'Shark', 'Moose', 'Parrot', 'Bison', 'Cobra', 'Dingo', 'Eagle', 'Walrus', 'Newt', 'Raven', 'Mantis', 'Badger'];
  const COLS = ['#ff5d73', '#ffb020', '#ffe14d', '#4cd964', '#2ee6c5', '#3db8ff', '#6c7bff', '#b66dff', '#ff6bd6', '#ff8a4c', '#9be15d', '#00c2a8'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch { } } };
  const ident = (() => { let s; try { s = JSON.parse(ss.get('gh_id')); } catch { } if (!s) { s = { name: pick(ADJ) + ' ' + pick(ANI), color: pick(COLS) }; ss.set('gh_id', JSON.stringify(s)); } return s; })();

  /* ---------- state ---------- */
  let ws, R = null, me = null, isHost = false, roomCode = null, wantCreate = false, fatal = null;
  const outq = [];
  const G = { key: null, def: null, s: null, el: null, upd: null, C: null, H: null, w: null, dirty: false, acc: 0, last: 0, botAt: {}, lastHtml: null, overKey: null };
  const view = { key: null };
  const app = () => $('#app');

  /* ---------- networking ---------- */
  function net(m) { const s = JSON.stringify(m); if (ws && ws.readyState === 1) ws.send(s); else if (m.t !== 'state') outq.push(s); }
  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = Hub.makeSocket ? Hub.makeSocket(roomCode) : new WebSocket(`${proto}://${location.host}/ws`);   // Hub.makeSocket = serverless (peer-to-peer) build
    ws.onopen = () => {
      banner(null);
      const saved = roomCode && ss.get('gh_s_' + roomCode); let sv = null; try { sv = saved && JSON.parse(saved); } catch { }
      if (roomCode) net({ t: 'join', code: roomCode, name: ident.name, color: ident.color, pid: sv && sv.pid, token: sv && sv.token });
      else if (wantCreate) net({ t: 'create', name: ident.name, color: ident.color });
      while (outq.length) ws.send(outq.shift());
    };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
    ws.onclose = () => { if (fatal) return; banner('Connection lost — reconnecting…'); setTimeout(connect, 900 + Math.random() * 900); };
    ws.onerror = () => { };
  }
  setInterval(() => net({ t: 'ping' }), 20000);

  function onMsg(m) {
    switch (m.t) {
      case 'hello': me = m.you; roomCode = m.code; ss.set('gh_s_' + m.code, JSON.stringify({ pid: m.you, token: m.token })); if (Hub.p2p) { if (location.hash !== '#/r/' + m.code) history.replaceState(null, '', '#/r/' + m.code); } else if (location.pathname !== '/r/' + m.code) history.replaceState(null, '', '/r/' + m.code); break;
      case 'room': R = m.room; isHost = R.host === me; onRoom(); break;
      case 'state':
        if (isHost) { if (!G.s && G.def) { G.s = m.s; startLoop(); paint(); } }
        else { G.s = m.s; paint(); }
        break;
      case 'act': if (isHost) hostAct(m.from, m.a); break;
      case 'toast': toast(m.msg); break;
      case 'err': if (m.fatal) { fatal = m.msg; try { ws.close(); } catch { } teardownGame(); R = null; roomCode = null; landing(m.msg); } else toast(m.msg); break;
    }
  }

  /* ---------- small UI utilities ---------- */
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3800); }
  function banner(msg) { let b = $('.banner'); if (!msg) { b && b.remove(); return; } if (!b) { b = document.createElement('div'); b.className = 'banner'; document.body.appendChild(b); } b.textContent = msg; }
  const chip = (p, extra = '') => `<span class="pl ${p.online === false ? 'off' : ''} ${p.id === me ? 'me' : ''} ${extra}" style="--c:${esc(p.color)}">${R && R.host === p.id ? '👑 ' : ''}${esc(p.name)}${p.bot ? ' 🤖' : ''}${p.id === me ? ' (you)' : ''}</span>`;
  const seatPlayers = () => (R ? R.seats.map(id => R.players.find(p => p.id === id)).filter(Boolean) : []);
  const link = () => Hub.p2p ? location.href.split('#')[0] + '#/r/' + (R ? R.code : roomCode) : location.origin + '/r/' + (R ? R.code : roomCode);
  async function copy(txt) { try { await navigator.clipboard.writeText(txt); toast('Link copied!'); } catch { const i = document.createElement('input'); i.value = txt; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); toast('Link copied!'); } catch { prompt('Copy this link', txt); } i.remove(); } }

  /* ---------- landing ---------- */
  function landing(err) {
    view.key = 'landing';
    app().innerHTML = `<div class="landing">
      <div class="logo"><span class="pad">🎮</span> <b>Game</b>Hub</div>
      <p class="tag">Play with friends & family — one link, no sign-up. Board games, party games, action and racing.</p>
      ${err ? `<div class="panel" style="border-color:var(--bad)">${esc(err)}</div>` : ''}
      <div class="row" style="justify-content:center">You'll appear as ${Hub.chipOf(ident)}</div>
      <button class="btn big pulse" id="create">Create Room</button>
      <div class="or"><span>or join a friend's room</span></div>
      <form class="joinbox" id="jf" autocomplete="off"><input id="jc" maxlength="8" placeholder="ROOM CODE" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" inputmode="text" aria-label="Room code"><button class="btn alt" id="jb" type="submit">Join</button></form>
      <div class="marq">${Hub.games.slice(0, 14).map(g => `<span>${g.icon} ${esc(g.name)}</span>`).join('')}<span>+ ${Math.max(0, Hub.games.length - 14)} more</span></div>
    </div>`;
    $('#jc').oninput = e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v !== e.target.value) e.target.value = v; };
    $('#jf').onsubmit = e => { e.preventDefault(); joinByCode($('#jc').value); };
    $('#create').onclick = () => { Hub.sfx('pop'); fatal = null; wantCreate = true; $('#create').disabled = true; $('#create').textContent = 'Creating…'; if (ws && ws.readyState === 1) net({ t: 'create', name: ident.name, color: ident.color }); else connect(); };
  }

  function joinByCode(raw) {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const inp = $('#jc'), btn = $('#jb');
    if (code.length < 4) { toast('Type the room code your friend sees (5 letters/numbers).'); if (inp) { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); inp.focus(); } return; }
    Hub.sfx('pop'); fatal = null; roomCode = code; if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }
    if (ws && ws.readyState === 1) net({ t: 'join', code, name: ident.name, color: ident.color }); else connect();
  }

  /* ---------- room shell ---------- */
  function shell() {
    app().innerHTML = `<header class="top">
        <div class="brand">🎮 Game<b>Hub</b></div>
        <div class="code">Room <b>${esc(R.code)}</b><button class="btn sm alt" id="copy">Copy link</button></div>
        <button class="btn sm alt" id="mute" title="Sound">${Hub.muted ? '🔇' : '🔊'}</button>
        <div class="pbar" id="pbar"></div></header>
      <main id="stage"></main>`;
    $('#copy').onclick = () => copy(link());
    $('#mute').onclick = e => { Hub.muted = !Hub.muted; try { localStorage.gh_mute = Hub.muted ? '1' : '0'; } catch { } e.target.textContent = Hub.muted ? '🔇' : '🔊'; };
  }

  function onRoom() {
    const key = R.phase + '|' + (R.game || '') + '|' + (R.phase === 'playing' ? R.round : '');
    if (view.key === 'landing' || !$('#stage')) { view.key = null; shell(); }
    if (key !== view.key) { teardownGame(); view.key = key; buildStage(); }
    $('#pbar').innerHTML = R.players.map(p => chip(p)).join('');
    dyn();
  }
  function buildStage() {
    const st = $('#stage');
    if (R.phase === 'lobby') buildLobby(st);
    else if (R.phase === 'briefing') buildBrief(st);
    else buildPlay(st);
  }
  function dyn() { if (R.phase === 'lobby') dynLobby(); else if (R.phase === 'briefing') dynBrief(); else dynPlay(); }

  /* ---------- lobby ---------- */
  const lob = { cat: 'All', q: '' };
  function buildLobby(st) {
    st.innerHTML = `<section class="lobby">
      <div class="col">
        <div class="panel"><h2>📣 Invite players</h2>
          <div class="bigcode" title="Friends can type this on the home page"><small>Room code</small><b>${esc(R.code)}</b></div>
          <div class="linkbox"><input readonly id="lk" value="${esc(link())}"><button class="btn sm" id="cp">Copy</button><button class="btn sm alt hide" id="sh">Share</button></div>
          <p class="muted" style="margin:6px 0 0;font-size:14px">Share the link — or friends can open the home page and type the room code above. Everyone gets a random name & colour.</p></div>
        <div class="panel"><div class="row"><h2>👥 Players <span class="muted" id="pc"></span></h2><span class="spacer"></span><button class="btn sm alt hide" id="addbot">+ Bot</button></div><div class="plist" id="plist"></div></div>
      </div>
      <div class="panel"><h2 id="pick-h"></h2>
        <div class="row" style="margin-top:12px"><input id="q" placeholder="Search ${Hub.games.length} games…" style="flex:1" value="${esc(lob.q)}"></div>
        <div class="cats" id="cats"></div><div class="grid" id="grid"></div></div></section>`;
    $('#lk').onclick = e => e.target.select();
    $('#cp').onclick = () => copy(link());
    if (navigator.share) { $('#sh').classList.remove('hide'); $('#sh').onclick = () => navigator.share({ title: 'Join my Game Hub room', text: 'Join my game room!', url: link() }).catch(() => { }); }
    $('#addbot').onclick = () => net({ t: 'addbot' });
    $('#q').oninput = e => { lob.q = e.target.value; dynGrid(); };
    $('#cats').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { lob.cat = b.dataset.c; dynGrid(); } };
    $('#grid').onclick = e => {
      const b = e.target.closest('[data-g]'); if (!b || !isHost || b.classList.contains('dis')) return;
      const g = Hub.reg[b.dataset.g]; Hub.sfx('pop'); net({ t: 'select', game: g.id, min: g.min, max: g.max });
    };
    $('#plist').onclick = e => { const b = e.target.closest('[data-k]'); if (b) net({ t: 'kick', id: b.dataset.k }); };
  }
  function dynLobby() {
    $('#pc').textContent = `(${R.players.filter(p => p.online).length})`;
    $('#addbot').classList.toggle('hide', !isHost);
    $('#plist').innerHTML = R.players.map(p => `<div class="prow">${chip(p)}${isHost && p.id !== me ? `<button class="x" data-k="${esc(p.id)}" title="Remove">✕</button>` : ''}</div>`).join('');
    $('#pick-h').textContent = isHost ? '🎲 Pick a game' : '🎲 Games — the host is picking';
    dynGrid();
  }
  function dynGrid() {
    const n = R.players.filter(p => p.online).length;
    $('#cats').innerHTML = ['All', ...Hub.CATS].map(c => `<button class="cat ${lob.cat === c ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}${c === 'All' ? ' · ' + Hub.games.length : ' · ' + Hub.games.filter(g => g.cat === c).length}</button>`).join('');
    const nz = x => String(x).toLowerCase().replace(/[^a-z0-9]+/g, ''), q = nz(lob.q);
    const list = Hub.games.filter(g => (lob.cat === 'All' || g.cat === lob.cat) && (!q || nz(g.id + g.name + g.blurb + g.cat).includes(q)));
    $('#grid').innerHTML = list.map(g => {
      const ok = n >= g.min && n <= g.max;
      const pc = g.min === g.max ? `${g.min} players` : `${g.min}–${g.max} players`;
      return `<div class="gcard ${isHost ? (ok ? '' : 'dis') : 'view'}" data-g="${esc(g.id)}" title="${!ok ? 'Needs ' + pc : ''}">
        <span class="tg">${esc(g.cat)}</span><div class="ic">${g.icon}</div><div class="nm">${esc(g.name)}</div><div class="bl">${esc(g.blurb)}</div>
        <div class="pc">${ok ? '👥 ' + pc : '⚠ needs ' + pc}</div></div>`;
    }).join('') || '<p class="muted">No games match.</p>';
  }

  /* ---------- briefing ---------- */
  function buildBrief(st) {
    const g = Hub.reg[R.game];
    if (!g) { st.innerHTML = '<div class="panel">Unknown game.</div>'; return; }
    st.innerHTML = `<div class="brief">
      <div class="center"><div class="ic">${g.icon}</div><h1>${esc(g.name)}</h1><p class="muted">${esc(g.cat)} · ${g.min === g.max ? g.min : g.min + '–' + g.max} players</p></div>
      <div class="panel"><h2 style="margin-bottom:14px">How to play</h2><ol class="how">${g.how.map(x => `<li><span>${x}</span></li>`).join('')}</ol></div>
      <div class="panel"><h3 style="margin-bottom:10px">Waiting for everyone to press OK</h3><div class="rdy" id="rdy"></div></div>
      <div class="row" style="justify-content:center"><button class="btn big ok" id="okb">OK, got it!</button></div>
      <div class="row" style="justify-content:center"><button class="btn sm alt hide" id="start">▶ Start now (host)</button><button class="btn sm alt hide" id="back">← Pick another game</button></div></div>`;
    $('#okb').onclick = () => { Hub.sfx('good'); net({ t: 'ready' }); $('#okb').disabled = true; $('#okb').textContent = 'Waiting for others…'; };
    $('#start').onclick = () => net({ t: 'startnow' });
    $('#back').onclick = () => net({ t: 'lobby' });
  }
  function dynBrief() {
    $('#rdy').innerHTML = R.players.filter(p => p.online || p.bot).map(p => chip(p, p.ready ? 'ok' : 'wait')).join('');
    $('#start').classList.toggle('hide', !isHost); $('#back').classList.toggle('hide', !isHost);
    const mine = R.players.find(p => p.id === me); if (mine && mine.ready) { const b = $('#okb'); b.disabled = true; b.textContent = 'Waiting for others…'; }
  }

  /* ---------- playing ---------- */
  function buildPlay(st) {
    const g = Hub.reg[R.game]; G.def = g; G.key = R.game + ':' + R.round; G.s = null; G.lastHtml = null; G.upd = null; G.overKey = null;
    st.innerHTML = `<div class="gamebar"><div class="gtitle">${g.icon} ${esc(g.name)}</div><span class="spacer"></span><span class="muted hide" id="spec">👀 Spectating</span><button class="btn sm alt hide" id="end">⏹ End game</button></div>
      <div id="game" class="gamearea"><div class="loading">Loading…</div></div><div id="over"></div>`;
    G.el = $('#game');
    $('#end').onclick = () => { if (confirm('End this game and go back to the lobby for everyone?')) net({ t: 'lobby' }); };
    G.el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled || b.classList.contains('dis')) return; try { send(JSON.parse(b.dataset.a)); } catch { } });
    G.el.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const i = e.target.closest('[data-enter]'); if (!i) return; let a; try { a = JSON.parse(i.dataset.enter); } catch { return; } a.v = i.value; i.value = ''; send(a); });
    G.C = makeC();
    G.H = Hub.makeH(pid => { const p = R && R.players.find(p => p.id === pid); return !!p && p.online; }, (ms, fn) => {
      const key = G.key; setTimeout(() => { if (G.key !== key || !G.s || G.s.over) return; try { fn(); } catch (e) { console.error(e); } G.dirty = true; flush(); }, ms);
    });
    if (isHost && !R.hasState) hostInit();
  }
  function dynPlay() {
    const sp = $('#spec'); if (sp) sp.classList.toggle('hide', R.seats.includes(me));
    const e = $('#end'); if (e) e.classList.toggle('hide', !isHost);
    if (G.s) paint(); // names/colours/online status may have changed
  }
  function makeC() {
    return {
      get me() { return me; }, get P() { return seatPlayers(); }, get isHost() { return isHost; }, get round() { return R.round; },
      get spectator() { return !R.seats.includes(me); }, send,
      pl: id => (R && R.players.find(p => p.id === id)) || { id, name: '?', color: '#888', online: false },
      chip(id) { return chip(this.pl(id)); }, seat: id => (R ? R.seats.indexOf(id) : -1), sfx: Hub.sfx, esc, A: Hub.A,
    };
  }
  function send(a) { if (isHost) hostAct(me, a); else net({ t: 'act', a }); }

  /* ----- host runtime ----- */
  function hostInit() {
    const d = G.def; stopLoop();
    try { G.s = d.init(seatPlayers(), G.H); } catch (e) { console.error(e); toast('Game failed to start: ' + e.message); return; }
    startLoop(); flush();
  }
  function startLoop() {
    stopLoop();
    G.last = performance.now(); G.acc = 0; G.botAt = {};
    try { // a Worker timer is not throttled when the host tab is in the background
      G.w = new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),33)'], { type: 'text/javascript' })));
      G.w.onmessage = step;
    } catch { G.iv = setInterval(step, 33); }
  }
  function stopLoop() { if (G.w) { G.w.terminate(); G.w = null; } if (G.iv) { clearInterval(G.iv); G.iv = null; } }
  function step() {
    const s = G.s, d = G.def; if (!s || !d) return;
    const now = performance.now(), dt = Math.min(.1, (now - G.last) / 1000); G.last = now;
    try {
      if (!s.over) {
        if (d.tick) { d.tick(s, dt, G.H); G.dirty = true; }
        for (const p of R.players) {
          if (!p.bot || !R.seats.includes(p.id) || s.over) continue;
          if (now - (G.botAt[p.id] || 0) < (d.botMs || 700)) continue;
          G.botAt[p.id] = now;
          const a = d.bot && d.bot(s, p.id, G.H);
          if (a) { d.act(s, p.id, a, G.H); G.dirty = true; if (!d.tick) flush(); }
        }
      }
    } catch (e) { console.error('game step error', e); }
    G.acc += dt;
    if (G.dirty && G.acc >= 1 / (d.hz || 20) - .002) flush();
  }
  function hostAct(pid, a) {
    const s = G.s, d = G.def; if (!s || !d || s.over || !R.seats.includes(pid)) return;
    try { d.act(s, pid, a, G.H); } catch (e) { console.error('act error', e); return; }
    G.dirty = true; if (!d.tick) flush();
  }
  function flush() { G.acc = 0; G.dirty = false; net({ t: 'state', s: G.s }); paint(); }

  /* ----- rendering ----- */
  function paint() {
    const s = G.s, d = G.def; if (!s || !d || !G.el || !G.el.isConnected) return;
    try {
      if (d.view) {
        const ae = document.activeElement; let keep = null;
        if (ae && G.el.contains(ae) && ae.id && 'value' in ae) keep = { id: ae.id, v: ae.value, a: ae.selectionStart, b: ae.selectionEnd };
        const html = d.view(s, G.C);
        if (html !== G.lastHtml) {
          G.lastHtml = html; G.el.innerHTML = html;
          if (keep) { const n = document.getElementById(keep.id); if (n && 'value' in n) { n.value = keep.v; n.focus(); try { n.setSelectionRange(keep.a, keep.b); } catch { } } }
        }
      } else {
        if (!G.upd) { G.el.innerHTML = ''; G.upd = d.mount(G.el, G.C); }
        G.upd(s);
      }
    } catch (e) { console.error(e); G.el.innerHTML = `<div class="panel">⚠ This game hit an error: ${esc(e.message)}</div>`; }
    paintOver(s);
  }
  function paintOver(s) {
    const o = $('#over'); if (!o) return;
    if (!s.over) { if (o.innerHTML) o.innerHTML = ''; G.overKey = null; return; }
    const k = JSON.stringify(s.over); if (k === G.overKey) return; G.overKey = k;
    const ov = s.over, rows = (ov.rows || []).map(r => `<li>${chip(G.C.pl(r.pid))}<b>${esc(r.text ?? '')}</b></li>`).join('');
    o.innerHTML = `<div class="overlay"><div class="panel result"><h2>${esc(ov.title || 'Game over')}</h2>${rows ? `<ol>${rows}</ol>` : ''}
      ${isHost ? `<div class="row" style="justify-content:center"><button class="btn ok" id="again">▶ Play again</button><button class="btn alt" id="tolobby">Back to lobby</button></div>` : '<p class="muted">Waiting for the host…</p>'}</div></div>`;
    if (isHost) { $('#again').onclick = () => net({ t: 'again' }); $('#tolobby').onclick = () => net({ t: 'lobby' }); }
    const won = (ov.winners || []).includes(me);
    Hub.sfx(won ? 'win' : 'lose'); if (won) confetti();
  }
  function confetti() {
    const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const x = c.getContext('2d'), P = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 5, r: 4 + Math.random() * 6, c: pick(COLS), a: Math.random() * 6 }));
    let t = 0; (function f() { x.clearRect(0, 0, c.width, c.height); for (const p of P) { p.x += p.vx; p.y += p.vy; p.a += .15; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); } if (++t < 220) requestAnimationFrame(f); else c.remove(); })();
  }
  function teardownGame() {
    stopLoop();
    try { G.upd && G.upd.destroy && G.upd.destroy(); } catch (e) { console.error(e); }
    G.s = null; G.upd = null; G.el = null; G.lastHtml = null;
  }

  /* ---------- boot ---------- */
  Hub._test = { G, makeC };
  if (!window.HUB_TEST) {
    window.addEventListener('DOMContentLoaded', () => {
      const m = Hub.p2p ? location.hash.match(/^#\/r\/([A-Za-z0-9]{3,8})/) : location.pathname.match(/^\/r\/([A-Za-z0-9]{3,8})/);
      if (m) { roomCode = m[1].toUpperCase(); app().innerHTML = '<div class="landing"><div class="logo"><span class="pad">🎮</span> <b>Game</b>Hub</div><p class="tag">Joining room…</p></div>'; connect(); }
      else landing();
    });
  }
})();
