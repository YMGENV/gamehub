/* Browser-side room engine for the GitHub Pages (no server) build.
   Same protocol as server.js, but it runs inside the HOST's browser for ONE room.
   Guests reach it over WebRTC (see p2p.js). Keep in sync with server.js. */
(() => {
  'use strict';
  const MAX_PLAYERS = 12;
  const ADJ = ['Swift', 'Brave', 'Cosmic', 'Lucky', 'Sneaky', 'Jolly', 'Mighty', 'Sunny', 'Fuzzy', 'Turbo', 'Clever', 'Wild', 'Happy', 'Zesty', 'Royal', 'Nimble', 'Funky', 'Sleepy', 'Ninja', 'Atomic', 'Dizzy', 'Bouncy', 'Frosty', 'Spicy'];
  const ANI = ['Otter', 'Panda', 'Falcon', 'Tiger', 'Koala', 'Gecko', 'Llama', 'Fox', 'Yak', 'Owl', 'Lynx', 'Hippo', 'Shark', 'Moose', 'Parrot', 'Bison', 'Cobra', 'Dingo', 'Eagle', 'Walrus', 'Newt', 'Raven', 'Mantis', 'Badger'];
  const COLORS = ['#ff5d73', '#ffb020', '#ffe14d', '#4cd964', '#2ee6c5', '#3db8ff', '#6c7bff', '#b66dff', '#ff6bd6', '#ff8a4c', '#9be15d', '#00c2a8'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');

  function create(code) {
    const room = { code, host: null, phase: 'lobby', game: null, meta: null, round: 0, seats: [], state: null, ready: new Set(), players: new Map() };
    const send = (ws, m) => { if (ws && ws.readyState === 1) ws.send(typeof m === 'string' ? m : JSON.stringify(m)); };
    const bcast = (m, except) => { const s = typeof m === 'string' ? m : JSON.stringify(m); for (const p of room.players.values()) if (p.ws && p.ws !== except) send(p.ws, s); };
    const pub = () => ({
      code: room.code, host: room.host, phase: room.phase, game: room.game, meta: room.meta, round: room.round, seats: room.seats, hasState: room.state != null,
      players: [...room.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color, online: p.online, bot: p.bot, ready: room.ready.has(p.id) || p.bot })),
    });
    const sync = () => bcast({ t: 'room', room: pub() });
    const humansOnline = () => [...room.players.values()].filter(p => p.online && !p.bot);
    const allReady = () => humansOnline().every(p => room.ready.has(p.id));

    function uniqueIdent(name, color) {
      name = String(name || '').replace(/[<>]/g, '').trim().slice(0, 24);
      const names = new Set([...room.players.values()].map(p => p.name)), cols = new Set([...room.players.values()].map(p => p.color));
      if (!name || names.has(name)) { let t = 0; do { name = pick(ADJ) + ' ' + pick(ANI); } while (names.has(name) && ++t < 200); if (names.has(name)) name += ' ' + (names.size + 1); }
      if (!COLORS.includes(color) || cols.has(color)) { const free = COLORS.filter(c => !cols.has(c)); color = free.length ? pick(free) : pick(COLORS); }
      return { name, color };
    }
    function addPlayer(name, color, bot) {
      const { name: n, color: c } = uniqueIdent(bot ? 'Bot ' + pick(ANI) : name, bot ? null : color);
      const p = { id: 'p' + rid(3), token: rid(8), name: n, color: c, ws: null, online: !!bot, bot: !!bot, seen: Date.now() };
      room.players.set(p.id, p); return p;
    }
    function startGame() {
      const seats = [...room.players.values()].filter(p => p.online).map(p => p.id);
      const { min = 1, max = 99 } = room.meta || {};
      if (seats.length < min || seats.length > max) { send(room.players.get(room.host)?.ws, { t: 'err', msg: `This game needs ${min}–${max} players (you have ${seats.length}).` }); return false; }
      room.seats = seats; room.round++; room.state = null; room.phase = 'playing'; room.ready = new Set(); sync(); return true;
    }
    function attach(ws, p) {
      if (p.ws && p.ws !== ws) { try { p.ws.ctx = null; p.ws.close(); } catch { } }
      p.ws = ws; p.online = true; p.seen = Date.now(); ws.ctx = { pid: p.id };
      send(ws, { t: 'hello', you: p.id, token: p.token, code: room.code });
      sync(); if (room.state != null) send(ws, { t: 'state', s: room.state });
    }
    function leave(ws) {
      const c = ws.ctx; if (!c) return; const p = room.players.get(c.pid); if (!p || p.ws !== ws) return;
      p.online = false; p.ws = null; p.seen = Date.now();
      if (room.phase === 'briefing' && allReady() && humansOnline().length) startGame(); else sync();
    }
    function handle(ws, m) {
      if (!m || typeof m.t !== 'string') return; const c = ws.ctx;
      if (m.t === 'create') { if (c || room.host) return; const p = addPlayer(m.name, m.color); room.host = p.id; return attach(ws, p); }
      if (m.t === 'join') {
        if (c) return;
        if (String(m.code || '').toUpperCase() !== room.code) return send(ws, { t: 'err', msg: 'That room does not exist (or has expired).', fatal: true });
        let p = m.pid && room.players.get(m.pid);
        if (p && p.token === m.token && !p.bot) return attach(ws, p);
        if (room.players.size >= MAX_PLAYERS) return send(ws, { t: 'err', msg: 'This room is full.', fatal: true });
        return attach(ws, addPlayer(m.name, m.color));
      }
      if (!c) return; const pid = c.pid, isHost = room.host === pid;
      switch (m.t) {
        case 'select': { if (!isHost || room.phase === 'playing') return; const min = Math.max(1, m.min | 0), max = Math.max(min, m.max | 0); room.game = String(m.game).slice(0, 40); room.meta = { min, max }; room.phase = 'briefing'; room.ready = new Set(); return sync(); }
        case 'ready': { if (room.phase !== 'briefing') return; room.ready.add(pid); if (allReady()) startGame(); else sync(); return; }
        case 'startnow': if (isHost && room.phase === 'briefing') startGame(); return;
        case 'again': if (isHost && room.phase === 'playing') startGame(); return;
        case 'lobby': { if (!isHost) return; room.phase = 'lobby'; room.game = null; room.meta = null; room.state = null; room.ready = new Set(); room.seats = []; return sync(); }
        case 'state': if (isHost && room.phase === 'playing') { room.state = m.s; bcast(JSON.stringify({ t: 'state', s: m.s }), ws); } return;
        case 'act': { if (room.phase !== 'playing' || isHost) return; const h = room.players.get(room.host); if (h) send(h.ws, { t: 'act', from: pid, a: m.a }); return; }
        case 'addbot': if (!isHost || room.phase === 'playing' || room.players.size >= MAX_PLAYERS) return; addPlayer(null, null, true); return sync();
        case 'kick': { if (!isHost || room.phase === 'playing') return; const t = room.players.get(m.id); if (!t || t.id === pid) return; room.players.delete(t.id); if (t.ws) { send(t.ws, { t: 'err', msg: 'The host removed you from the room.', fatal: true }); t.ws.ctx = null; try { t.ws.close(); } catch { } } return sync(); }
        case 'ping': return send(ws, { t: 'pong' });
      }
    }
    setInterval(() => { // drop ghosts from the lobby after a minute
      if (room.phase === 'playing') return; const now = Date.now(); let ch = false;
      for (const p of [...room.players.values()]) if (!p.online && !p.bot && now - p.seen > 60000 && p.id !== room.host) { room.players.delete(p.id); ch = true; }
      if (ch) sync();
    }, 15000);
    return { handle, leave, room };
  }
  window.RoomEngine = { create };
})();
