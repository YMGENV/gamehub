/* Peer-to-peer transport for the GitHub Pages build (no server of our own).
   Host browser = room server (RoomEngine). Guests connect with WebRTC via the free public PeerJS broker.
   Room code <-> peer id "ghub-<CODE>". Presents a WebSocket-like object to core.js. */
(() => {
  'use strict';
  Hub.p2p = true;
  const PREFIX = 'ghub-', CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const cfg = () => window.GH_PEER_CONFIG || {};
  const newCode = () => Array.from({ length: 5 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
  const errMsg = (sock, msg) => { sock.onmessage && sock.onmessage({ data: JSON.stringify({ t: 'err', msg, fatal: true }) }); };

  function hostSocket() {
    const sock = { readyState: 0, onopen: null, onmessage: null, onclose: null, onerror: null, send(s) { if (engine) { try { engine.handle(hws, JSON.parse(s)); } catch (e) { console.error(e); } } }, close() { } };
    let engine = null, peer = null, tries = 0;
    const hws = { readyState: 1, ctx: null, send: s => setTimeout(() => sock.onmessage && sock.onmessage({ data: s }), 0), close() { } };
    function start() {
      const code = newCode(); peer = new Peer(PREFIX + code, cfg());
      peer.on('open', () => { engine = RoomEngine.create(code); sock.readyState = 1; sock.onopen && sock.onopen(); });
      peer.on('error', e => {
        if (e.type === 'unavailable-id' && ++tries < 6) { try { peer.destroy(); } catch { } return start(); }
        if (!engine) { errMsg(sock, 'Could not create the room (' + e.type + '). Check your internet connection and try again.'); return; }
        console.warn('peer error', e.type);
      });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch { } });   // lost the broker; existing connections keep working
      peer.on('connection', conn => {
        const gws = { readyState: 0, ctx: null, send: s => { if (conn.open) conn.send(s); }, close() { try { conn.close(); } catch { } } };
        conn.on('open', () => { gws.readyState = 1; });
        conn.on('data', d => { if (!engine) return; try { engine.handle(gws, JSON.parse(d)); } catch (e) { console.error(e); } });
        const gone = () => { if (gws.readyState === 3) return; gws.readyState = 3; engine && engine.leave(gws); };
        conn.on('close', gone); conn.on('error', gone);
      });
    }
    setTimeout(start, 0);
    return sock;
  }

  function guestSocket(code) {
    let conn = null, peer = null, opened = false, dead = false;
    const sock = { readyState: 0, onopen: null, onmessage: null, onclose: null, onerror: null, send(s) { if (conn && conn.open) conn.send(s); }, close() { dead = true; try { peer && peer.destroy(); } catch { } } };
    const timer = setTimeout(() => { if (!opened && !dead) { dead = true; errMsg(sock, "Couldn't reach the host. Ask them to keep the game page open, or try a different network (some Wi‑Fi blocks direct connections)."); } }, 25000);
    peer = new Peer(cfg());
    peer.on('open', () => {
      conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'raw' });
      conn.on('open', () => { opened = true; clearTimeout(timer); sock.readyState = 1; sock.onopen && sock.onopen(); });
      conn.on('data', d => sock.onmessage && sock.onmessage({ data: d }));
      conn.on('close', () => { sock.readyState = 3; if (!dead) sock.onclose && sock.onclose(); });
    });
    peer.on('error', e => {
      if (dead) return;
      if (e.type === 'peer-unavailable') { dead = true; clearTimeout(timer); errMsg(sock, 'That room is not open. The host may have closed it — ask them for a fresh link.'); }
      else if (!opened) { dead = true; clearTimeout(timer); errMsg(sock, 'Connection problem (' + e.type + '). Check your internet and reload.'); }
    });
    return sock;
  }
  Hub.makeSocket = code => (code ? guestSocket(code) : hostSocket());
})();
