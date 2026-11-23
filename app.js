/* 珍珠唱机 · HTML UI 单页应用
   同一份代码两种运行方式：
   - App 内 WebView：存在 window.NgnlBridge，所有数据与播放控制走原生桥；
   - 浏览器直接打开：无桥时使用 demo-data.js 演示数据（不发声，仅界面演示）。 */
(function () {
  'use strict';

  /* ---------------- 工具 ---------------- */
  var $ = function (id) { return document.getElementById(id); };
  var view = $('view');
  var dockEl = $('dock');
  var toastEl = $('toast');

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtMs(ms) { return fmt((Number(ms) || 0) / 1000); }
  function hueOf(s) {
    s = String(s || 'x'); var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() {
    var d = new Date();
    var w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return d.getMonth() + 1 + '月' + d.getDate() + '日 · ' + w;
  }

  /* ---------------- 图标 ---------------- */
  var ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-3.6-3.6"/></svg>',
    queue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h11M4 12h11M4 17h7"/><path d="M17 14.5v5.2" /><circle cx="18.6" cy="20" r="1.9"/><path d="M17 14.5 21 13v3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.9 4.6h.03A1.7 1.7 0 0 0 9.96 3.04V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.03A1.7 1.7 0 0 0 20.96 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6.5v11L15 12z" fill="currentColor" stroke="none"/><path d="M18 6v12"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6.5v11L9 12z" fill="currentColor" stroke="none"/><path d="M6 6v12"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-9.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1C19.5 15.4 12 20 12 20z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-9.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1C19.5 15.4 12 20 12 20z" fill="currentColor"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6-6 6 6 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 6 6 6-6 6"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9.5 6 6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20.5 6 17 9.5"/><path d="M20.5 6H7a3.5 3.5 0 0 0-3.5 3.5V11"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M3.5 18H17a3.5 3.5 0 0 0 3.5-3.5V13"/></svg>',
    repeatOne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20.5 6 17 9.5"/><path d="M20.5 6H7a3.5 3.5 0 0 0-3.5 3.5V11"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M3.5 18H17a3.5 3.5 0 0 0 3.5-3.5V13"/><path d="M11.4 9.6l1.6-1v6.8" stroke-width="1.7"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3.5 20 7l-4 3.5"/><path d="M16 13.5 20 17l-4 3.5"/><path d="M20 7h-4.2a4 4 0 0 0-3.3 1.7L8.6 15.3A4 4 0 0 1 5.3 17H3"/><path d="M20 17h-4.2a4 4 0 0 1-3.3-1.7l-.9-1.3"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>',
    disc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.4"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M5 5a10 10 0 0 0 0 14M19 19a10 10 0 0 0 0-14"/></svg>',
    playlist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h10M4 11h10M4 16h6"/><path d="M18 10v8.2"/><circle cx="19.5" cy="19.5" r="1.7"/><path d="M18 10l3-1.2v3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.8 12.2h9.4L17.5 7"/><path d="M10 11v4.5M14 11v4.5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v10.5M7.5 10 12 14.5 16.5 10"/><path d="M4.5 17.5v2A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-2"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5.5 8.5 12l6.5 6.5"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.3"/><path d="M12 7.4V12l3 1.8"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
    shuffleOn: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4h-4"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6.5l9-2v10.5"/><circle cx="6.8" cy="18.2" r="2.4"/><circle cx="15.8" cy="16.6" r="2.4"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.6 6.7"/><path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15"/></svg>',
    thumbDown: '<svg viewBox="0 0 24 24" fill="currentColor"><g transform="matrix(1 0 0 -1 0 24)"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></g></svg>',
    unfold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>',
    radioBox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.6" y="8.4" width="18.8" height="11.2" rx="2"/><path d="M6.4 8.2 18.2 3.4"/><circle cx="7.6" cy="14.2" r="2.3"/><path d="M13.6 12.4h4.4M13.6 15.6h4.4"/></svg>'
  };
  function icon(name) { return ICONS[name] || ''; }

  /* ---------------- 状态 ---------------- */
  var S = {
    connected: !!(window.NgnlBridge && typeof window.NgnlBridge.postMessage === 'function'),
    ready: false,
    bootError: null,
    route: { name: 'home', id: '', params: {} },
    song: null, playing: false, loading: false,
    positionMs: 0, durationMs: 0,
    index: -1, queue: [], mode: 'listLoop',
    liked: {}, lyrics: [], lyricIndex: -1, lyricLine: '',
    daily: null, fm: null, playlists: [], favorites: [],
    settings: null, sources: [],
    lists: {},
    playlist: null,
    search: { q: '', tab: 'songs', songs: [], playlists: [] },
    _dockSongKey: null
  };

  /* ---------------- 桥 ---------------- */
  var reqSeq = 1;
  var pending = new Map();

  function call(action, payload, timeoutMs) {
    if (!S.connected) return demoCall(action, payload || {});
    return new Promise(function (resolve, reject) {
      var id = 'r' + (reqSeq++);
      var timer = setTimeout(function () {
        pending.delete(id);
        reject(new Error('请求超时：' + action));
      }, timeoutMs || 20000);
      pending.set(id, { resolve: resolve, reject: reject, timer: timer });
      try {
        window.NgnlBridge.postMessage(JSON.stringify({ id: id, action: action, payload: payload || {} }));
      } catch (e) {
        clearTimeout(timer); pending.delete(id); reject(e);
      }
    });
  }

  window.NGNL = {
    reply: function (id, ok, data) {
      var p = pending.get(id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(id);
      if (ok === false) p.reject(new Error((data && (data.error || data.message)) || '操作失败'));
      else p.resolve(data || {});
    },
    event: function (evt) {
      if (typeof evt === 'string') {
        try { evt = JSON.parse(evt); } catch (e) { return; }
      }
      handleEvent(evt || {});
    }
  };

  function handleEvent(evt) {
    var t = evt.type;
    if (t === 'state') {
      var d = evt.data || {};
      var songChanged = (d.song && d.song.key) !== (S.song && S.song.key);
      S.song = d.song || null;
      S.playing = !!d.playing;
      S.loading = !!d.loading;
      S.index = typeof d.index === 'number' ? d.index : S.index;
      S.mode = d.mode || S.mode;
      if (typeof d.positionMs === 'number') S.positionMs = d.positionMs;
      if (typeof d.durationMs === 'number') S.durationMs = d.durationMs;
      if (Array.isArray(d.likedKeys)) {
        S.liked = {};
        d.likedKeys.forEach(function (k) { S.liked[k] = true; });
      }
      if (Array.isArray(d.queue)) S.queue = d.queue;
      if (songChanged) S.lyrics = [];
      updateDock(songChanged);
      if (S.route.name === 'player') {
        if (songChanged) render(); else syncPlayer();
      }
      if (S.route.name === 'queue') render();
      if (S.route.name === 'fm') {
        if (songChanged) render(); else syncFmNow();
      }
      return;
    }
    if (t === 'progress') {
      var p = evt.data || {};
      if (typeof p.positionMs === 'number') S.positionMs = p.positionMs;
      if (typeof p.durationMs === 'number' && p.durationMs > 0) S.durationMs = p.durationMs;
      syncProgress();
      return;
    }
    if (t === 'lyric') {
      var l = evt.data || {};
      if (Array.isArray(l.lyrics)) S.lyrics = l.lyrics;
      if (typeof l.index === 'number') S.lyricIndex = l.index;
      if (typeof l.line === 'string') S.lyricLine = l.line;
      if (S.route.name === 'player' || (S.route.name === 'fm' && window.innerWidth >= 900)) {
        var box = $('lyricsBox');
        var domCount = box ? box.querySelectorAll('.lyric-line').length : 0;
        if (Array.isArray(l.lyrics) && S.lyrics.length && domCount !== S.lyrics.length) {
          render();
        } else {
          syncLyrics();
        }
      }
      if (S.route.name === 'fm' && window.innerWidth < 900) { render(); return; }
      return;
    }
    if (t === 'queue') {
      var q = evt.data || {};
      if (Array.isArray(q.songs)) S.queue = q.songs;
      if (typeof q.index === 'number') S.index = q.index;
      if (S.route.name === 'queue') render();
      return;
    }
    if (t === 'toast') {
      toast((evt.data && evt.data.message) || '');
      return;
    }
  }

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, '');
    var qi = raw.indexOf('?');
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var qs = qi >= 0 ? raw.slice(qi + 1) : '';
    var parts = path.split('/').filter(Boolean);
    var params = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent(i >= 0 ? kv.slice(0, i) : kv);
      var v = i >= 0 ? decodeURIComponent(kv.slice(i + 1)) : '';
      params[k] = v;
    });
    return { name: parts[0] || 'home', id: parts[1] || '', params: params };
  }

  function go(name, params) {
    var q = '';
    if (params) {
      var kv = [];
      Object.keys(params).forEach(function (k) {
        if (params[k] != null && params[k] !== '') kv.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      });
      if (kv.length) q = '?' + kv.join('&');
    }
    var hash = '#/' + name + q;
    if (location.hash === hash) { route(); return; }
    location.hash = hash;
  }

  function back() {
    if (S.route.name === 'player') { go('home'); return; }
    if (history.length > 1) history.back(); else go('home');
  }

  /* ---------------- 数据加载 ---------------- */
  function ensureSongList(list) {
    if (Array.isArray(list)) return list;
    return [];
  }

  function applyBootstrap(d) {
    S.settings = d.settings || null;
    S.sources = d.sources || [];
    S.playlists = d.playlists || [];
    S.favorites = d.favorites || [];
    S.daily = d.daily || { songs: [], count: 0, hasNew: false };
    S.fm = d.fm || { song: null, playing: false };
    S.lists.daily = ensureSongList(S.daily.songs);
    S.lists.favorites = ensureSongList(S.favorites);
    if (d.player) {
      S.song = d.player.song || null;
      S.playing = !!d.player.playing;
      S.index = typeof d.player.index === 'number' ? d.player.index : -1;
      S.mode = d.player.mode || 'listLoop';
      S.positionMs = d.player.positionMs || 0;
      S.durationMs = d.player.durationMs || 0;
      S.queue = d.player.queue || [];
    }
    if (Array.isArray(d.liked)) {
      S.liked = {};
      d.liked.forEach(function (k) { S.liked[k] = true; });
    }
    if (d.lyrics) S.lyrics = d.lyrics;
  }

  async function route() {
    S.route = parseHash();
    var n = S.route.name;
    document.body.classList.toggle('mode-player', n === 'player');
    try {
      if (n === 'home' || n === 'daily' || n === 'fm') {
        if (!S.daily) await loadHome();
      }
      if (n === 'playlists') await loadPlaylists();
      if (n === 'playlist') await loadPlaylist(S.route.id || S.route.params.id);
      if (n === 'fm') await loadFm();
      if (n === 'queue') await loadQueue();
      if (n === 'settings') await loadSettings();
      if (n === 'search') {
        var q = S.route.params.q || '';
        $('searchInput').value = q;
        if (q && q !== S.search.q) await doSearch(q, S.search.source);
        else if (!q) S.search = { q: '', tab: 'songs', songs: [], playlists: [] };
      }
      if (n === 'player' && !S.lyrics.length) call('player.lyrics').then(function (d) {
        if (d && Array.isArray(d.lyrics)) { S.lyrics = d.lyrics; syncLyrics(); }
      }).catch(function () {});
    } catch (e) {
      toast(e && e.message ? e.message : '数据加载失败');
    }
    render();
    updateDock(true);
  }

  async function loadHome() {
    var d = await call('home.refresh');
    if (d.daily) S.daily = d.daily;
    if (d.playlists) S.playlists = d.playlists;
    if (d.favorites) S.favorites = d.favorites;
    if (d.fm) S.fm = d.fm;
    if (d.sources) S.sources = d.sources;
    S.lists.daily = ensureSongList(S.daily && S.daily.songs);
    S.lists.favorites = ensureSongList(S.favorites);
  }

  async function loadPlaylists() {
    var d = await call('playlists');
    S.playlists = d.items || [];
    if (d.favorites) { S.favorites = d.favorites; S.lists.favorites = d.favorites; }
  }

  async function loadPlaylist(id) {
    if (!id) { S.playlist = null; return; }
    var d = await call('playlist.detail', { id: id });
    S.playlist = { id: id, name: d.name || '歌单', songs: d.songs || [] };
    S.lists.playlist = S.playlist.songs;
  }

  async function loadFm() {
    var d = await call('fm.snapshot');
    S.fm = d;
    S.lists.fm = (d.queue || []).concat(d.song ? [d.song] : []);
  }

  async function loadQueue() {
    var d = await call('player.queue');
    S.queue = d.songs || [];
    if (typeof d.index === 'number') S.index = d.index;
    S.lists.queue = S.queue;
  }

  async function loadSettings() {
    var d = await call('settings.get');
    S.settings = d.settings || S.settings;
    S.sources = d.sources || S.sources;
  }

  async function doSearch(q, source) {
    S.search.q = q;
    S.search.tab = 'songs';
    S.search.loading = true;
    render();
    try {
      var d = await call('search', { q: q, source: source || '' });
      S.search.songs = d.songs || [];
      S.search.playlists = d.playlists || [];
      S.search.source = d.source || source || '';
      S.lists.search = S.search.songs;
    } finally {
      S.search.loading = false;
    }
  }

  /* ---------------- 组件 ---------------- */
  function art(item, cls, extra) {
    var name = (item && (item.name || item.title)) || '?';
    var cover = (item && item.cover) || '';
    var h = hueOf(name);
    var inner = cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy" onerror="this.remove()">' : '';
    return '<div class="art ' + (cls || '') + '" style="--h:' + h + '">' + inner +
      '<span class="art-fb">' + esc(name.slice(0, 1)) + '</span>' + (extra || '') + '</div>';
  }

  /* 演示封面：无封面时用同色系渐变占位，避免出现破图 */

  function isCurrent(song) {
    return !!(song && S.song && song.key && S.song.key === song.key);
  }

  function songRow(song, i, listName, opts) {
    opts = opts || {};
    var cur = isCurrent(song);
    var lead = '<span class="idx">' + pad(i + 1) + '</span>';
    var src = song.source === 'netease' ? '<span class="qtag wy">网易云</span>'
      : song.source === 'kuwo' ? '<span class="qtag kw">酷我</span>'
      : song.source === 'qq' ? '<span class="qtag qq">QQ</span>' : '';
    var kbps = (song.source === 'netease' && song.bitrate >= 128)
      ? '<span class="qtag kbps">' + (song.bitrate >= 320 ? '320K' : '128K') + '</span>' : '';
    var liked = !!(S.liked && S.liked[song.key]);
    var tail = opts.tail === 'native'
      ? '<span class="tail">' + icon('download') +
        '<span class="heart' + (liked ? ' on' : '') + '">' + icon(liked ? 'heartFill' : 'heart') + '</span>' +
        icon('plus') + '</span>'
      : (opts.trailing || ('<span class="dur">' + (song.duration ? fmt(song.duration) : '--:--') + '</span>'));
    return '<button class="srow' + (cur ? ' now' : '') + '" data-act="play-song" data-list="' + esc(listName) + '" data-index="' + i + '">' +
      lead + art(song) +
      '<span class="meta"><span class="t"><span class="tt">' + esc(song.name) + '</span>' + src + kbps + '</span>' +
      '<span class="s">' + esc(song.artist) + (song.album ? ' · ' + esc(song.album) : '') + '</span></span>' +
      tail + '</button>';
  }

  function plCard(p) {
    return '<button class="pcard" data-act="open-playlist" data-id="' + esc(p.id) + '">' +
      art(p, '', '<span class="cnt">' + (p.count || 0) + ' 首</span>') +
      '<span class="t">' + esc(p.name) + '</span>' +
      '<span class="s">' + (p.isDefault ? '默认歌单' : '本地歌单') + '</span></button>';
  }

  function emptyState(iconName, title, sub, btnText, btnAct) {
    return '<div class="empty"><div class="ic">' + icon(iconName) + '</div><b>' + esc(title) + '</b>' +
      '<span>' + esc(sub) + '</span>' +
      (btnText ? '<button class="btn sm" data-act="' + btnAct + '">' + esc(btnText) + '</button>' : '') + '</div>';
  }

  function secHead(title, sub, moreText, moreRoute) {
    return '<div class="sec"><b>' + esc(title) + '</b><span>' + esc(sub || '') + '</span>' +
      (moreText ? '<button class="more" data-act="route" data-route="' + moreRoute + '">' + esc(moreText) + icon('chevronRight') + '</button>' : '') +
      '</div>';
  }

  function appbar(title, right) {
    return '<div class="appbar"><button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
      '<div class="title">' + esc(title) + '</div><div class="right">' + (right || '') + '</div></div>';
  }

  /* 推荐歌单卡（106dp，原生 playlist_cards.dart） */
  function posterCard(name, count, source, cover, act) {
    var cls = source === 'qq' ? ' qq' : source === 'kuwo' ? ' kw' : '';
    var label = source === 'qq' ? 'QQ' : source === 'kuwo' ? '酷我' : '网易云';
    return '<button class="pcard" data-act="' + (act || 'route') + '"' +
      (act === 'route' ? ' data-route="daily"' : '') + '>' +
      '<span class="cover' + (cover ? '' : ' g') + '" style="--h:' + hueOf(name) + '">' +
        (cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'g\')">' : '<span class="ph-big">' + esc(name.slice(0, 1)) + '</span>') +
        '<span class="grad"></span><span class="src' + cls + '">' + label + '</span>' +
        '<span class="cnt">' + (count || 30) + ' 首</span></span>' +
      '<span class="t">' + esc(name) + '</span></button>';
  }

  /* 我的歌单卡（喜欢卡默认红色渐变） */
  function mineCard(p) {
    var isFav = p.isDefault;
    return '<button class="pcard mine" data-act="open-playlist" data-id="' + esc(p.id) + '">' +
      '<span class="cover' + (isFav ? ' default' : '') + '">' +
        (p.cover ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
        (isFav ? '<span class="favheart">' + icon('heartFill') + '</span>' : '') +
        '<span class="more">' + icon('more') + '</span></span>' +
      '<span class="t">' + esc(p.name) + '</span></button>';
  }

  function rankCard(name, cover, count) {
    return '<button class="rankcard" data-act="route" data-route="daily">' +
      '<span class="cover">' + (cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
        '<span class="cnt">' + (count || 30) + ' 首</span></span>' +
      '<span class="t">' + esc(name) + '</span></button>';
  }

  function chipsRow() {
    var names = ['网易云', 'QQ', '酷我', '酷狗'];
    return '<div class="chips">' + names.map(function (n, i) {
      return '<button class="chip' + (i === 0 ? ' on' : '') + '" data-act="home-source" data-source="' + n + '">' + n + '</button>';
    }).join('') + '</div>';
  }

  /* ---------------- 页面 ---------------- */
  function pageHome() {
    var daily = S.daily || { songs: [], count: 0 };
    var songs = (daily.songs || []).slice();
    var fm = S.fm || { song: null, playing: false };
    S.lists.daily = songs;

    var recDefs = [
      ['「民谣」姑娘你总在我心上', 32, 'netease', 'img/card-rec1.jpg'],
      ['一日歌单上新！升平乐事', 286, 'netease', 'img/card-rec2.jpg'],
      ['「游戏」节奏满满 燃到爆', 255, 'netease', 'img/card-rec3.jpg'],
      ['「民谣摇滚」100首必听', 14, 'netease', 'img/card-rec1.jpg'],
      ['一曲戏腔极尽风雅', 23, 'netease', 'img/card-rec2.jpg'],
      ['「1963-至今」日本经典', 30, 'netease', 'img/card-rec3.jpg'],
      ['Trap Remix | 欧美热单', 24, 'qq', 'img/card-rec1.jpg'],
      ['心事还没开口，歌词先替你说', 30, 'kuwo', 'img/card-rec2.jpg']
    ];
    var recs = recDefs.map(function (r) {
      return posterCard(r[0], r[1], r[2], r[3]);
    }).join('');
    var myCards = (S.playlists || []).map(mineCard).join('');
    if (!myCards) {
      myCards = '<button class="pcard mine" data-act="route" data-route="playlists">' +
        '<span class="cover default"><span class="favheart">' + icon('heartFill') + '</span></span>' +
        '<span class="t">我喜欢的音乐</span></button>';
    }
    var ranks = [
      ['飙升榜', 100],
      ['新歌榜', 100],
      ['热歌榜', 100]
    ].map(function (r) { return rankCard(r[0], '', r[1]); }).join('');

    var fmSub = fm.playing && fm.song ? (fm.song.name || '') : 'FM 未播放｜点击进入';
    var dailyCount = daily.count || songs.length || 30;
    var dailySub = songs.length
      ? ('今日 ' + dailyCount + ' 首' + (daily.hasNew ? ' · NEW' : '') + '｜' + songs[0].name)
      : '每日推荐待更新';
    var fmCover = 'img/card-fm.jpg';

    var posterDaily = '<button class="poster daily" data-act="route" data-route="daily">' +
        '<span class="cover"><img src="img/card-daily.jpg" alt=""></span>' +
        '<span class="info"><b>每日推荐</b><span>' + esc(dailySub) + '</span></span></button>';
    var posterFm = '<button class="poster fm" data-act="fm-open">' +
        '<span class="cover"><span class="ph">' + icon('radioBox') + '<i>FM</i></span></span>' +
        '<span class="info"><b>私人 FM</b><span>' + (fm.playing ? '<i class="live"></i>' : '') + esc(fmSub) + '</span></span></button>';

    var portrait =
      '<div class="home-pt">' +
        '<div class="posters">' + posterDaily + posterFm + '</div>' +
        '<div class="sec"><b>推荐歌单</b><span>30 首 · 网易云</span>' +
          '<button class="more" data-act="route" data-route="daily">全部' + icon('chevronRight') + '</button>' +
          '<button class="more" data-act="daily-refresh">' + icon('refresh') + '换一批</button></div>' +
        chipsRow() +
        '<div class="railwrap"><div class="rail">' + recs + '</div></div>' +
        '<div class="sec"><b>我的歌单</b><span>' + (S.playlists || []).length + ' 个</span>' +
          '<button class="more" data-act="route" data-route="playlists">全部' + icon('chevronRight') + '</button></div>' +
        '<div class="railwrap"><div class="rail">' + myCards + '</div></div>' +
        '<div class="sec"><b>排行榜</b><span>实时更新</span>' +
          '<button class="more" data-act="route" data-route="daily">全部' + icon('chevronRight') + '</button></div>' +
        '<div class="rankrail">' + ranks + '</div>' +
      '</div>';

    var c5 = '<div class="home-c5">' +
      '<div class="c5-left">' +
        '<button class="c5-fm" data-act="fm-open">' +
          '<span class="bg"><img src="' + fmCover + '" alt=""></span>' +
          '<span class="veil"></span>' +
          (fm.playing ? '<span class="onair">ON AIR</span>' : '') +
          '<span class="txt"><b>私人 FM</b><span>' + esc(fm.playing && fm.song ? 'ON AIR｜' + fm.song.name : 'FM 未播放｜点击进入') + '</span></span>' +
        '</button>' +
        '<div class="c5-daily"><div class="head"><b>每日推荐</b><span>' + dailyCount + ' 首</span>' +
          '<span class="acts"><button data-act="daily-refresh">换一批</button><button data-act="route" data-route="daily">全部</button></span></div>' +
          '<div class="list">' + (songs.length
            ? songs.slice(0, 8).map(function (s, i) { return songRow(s, i, 'daily', { tail: 'native' }); }).join('')
            : emptyState('sparkle', '今日推荐生成中', '稍后回来看看')) + '</div></div>' +
      '</div>' +
      '<div class="c5-right">' +
        '<div class="sec"><b>我的歌单</b><span>' + (S.playlists || []).length + ' 个</span>' +
          '<button class="more" data-act="route" data-route="playlists">全部' + icon('chevronRight') + '</button></div>' +
        '<div class="railwrap"><div class="rail">' + myCards + '</div></div>' +
        '<div class="sec" style="margin-top:14px"><b>推荐歌单</b><span>30 张 · 网易云</span>' +
          '<button class="more" data-act="route" data-route="daily">全部' + icon('chevronRight') + '</button>' +
          '<button class="more" data-act="daily-refresh">' + icon('refresh') + '换一批</button></div>' +
        chipsRow() +
        '<div class="railwrap"><div class="rail">' + recs + '</div></div>' +
      '</div></div>';

    return '<section class="page home">' + portrait + c5 + '</section>';
  }

  function pagePlaylists() {
    var pls = (S.playlists || []).filter(function (p) { return !p.isDefault; });
    var favs = S.favorites || [];
    var favPl = (S.playlists || []).filter(function (p) { return p.isDefault; })[0] || { id: 'pl-fav' };
    var favCard = '<button class="psh-card fav" data-act="open-playlist" data-id="' + esc(favPl.id) + '">' +
      '<span class="hollow">' + icon('heartFill') + '</span>' +
      '<span class="badge">' + icon('heartFill') + '</span>' +
      '<span class="cnt">' + favs.length + ' 首</span></button>' +
      '<span class="plabel">我喜欢的音乐</span>';
    return pageHome() +
      '<section class="page sheets">' +
      '<div class="psh-scrim" data-act="back"></div>' +
      '<div class="psh">' +
        '<span class="grab"></span>' +
        '<div class="psh-tabs"><button>全部</button><button class="on">我的歌单</button></div>' +
        '<div class="psh-hint"><i class="grip"></i>长按卡片拖动即可调整顺序（仅「我的歌单」支持）</div>' +
        '<div class="psh-grid">' +
          '<div class="psh-cell">' + favCard + '</div>' +
          pls.map(function (p) {
            return '<div class="psh-cell"><button class="psh-card" data-act="open-playlist" data-id="' + esc(p.id) + '">' +
              art(p, 'pshart', '<span class="cnt">' + (p.count || 0) + ' 首</span>') +
              '</button><span class="plabel">' + esc(p.name) + '</span></div>';
          }).join('') +
          '<div class="psh-cell"><button class="psh-card new" data-act="playlist-create">' +
            '<span class="plus">' + icon('plus') + '</span><span class="newtx">新建</span></button>' +
            '<span class="plabel"> </span></div>' +
        '</div>' +
      '</div>' +
      '</section>';
  }

  function pagePlaylist() {
    var pl = S.playlist;
    if (!pl) return '<section class="page"><div class="loading-pad">' + skeletonList() + '</div></section>';
    var songs = pl.songs || [];
    S.lists.playlist = songs;
    return '<section class="page pld' + (songs.length ? ' has' : '') + '">' +
      '<div class="pld-left">' +
        '<header class="pld-head"><button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button></header>' +
        '<div class="pld-foot"><b>' + esc(pl.name || '我喜欢的音乐') + '</b>' +
          '<span>' + songs.length + ' 首</span></div>' +
      '</div>' +
      '<div class="pld-right">' +
        (songs.length
          ? '<div class="songlist pld-list">' + songs.map(function (s, i) { return songRow(s, i, 'playlist'); }).join('') + '</div>'
          : '<div class="pld-empty"><div class="t">还没有收藏歌曲</div>' +
            '<div class="s">在歌单、榜单或搜索结果里点 ♡，<br>歌曲会保存在本机，重启 App 也不会丢。</div></div>') +
      '</div>' +
      '</section>';
  }

  function pageSearch() {
    var st = S.search;
    var songs = st.songs || [];
    S.lists.search = songs;
    var counts = {}, all = [];
    songs.forEach(function (s) {
      var k = s.source || 'netease';
      counts[k] = (counts[k] || 0) + 1;
      if (all.indexOf(k) < 0) all.push(k);
    });
    var srcLabel = { netease: '网易云', kuwo: '酷我', qq: 'QQ', kugou: '酷狗', migu: '咪咕',
      bilibili: 'B站', fiveSing: '5sing', jamendo: 'Jam', joox: 'JOOX', qianqian: '千千' };
    var chips = '<button class="schip on">全部 <b>' + songs.length + '</b></button>';
    all.forEach(function (k) {
      chips += '<button class="schip" data-act="search-source" data-source="' + esc(k) + '">' +
        esc(srcLabel[k] || k) + ' <b>' + counts[k] + '</b></button>';
    });
    var body;
    if (st.loading) {
      body = '<div class="srch-status"><span class="spin"></span>正在搜索…</div>';
    } else if (!songs.length) {
      body = '<div class="srch-empty"><div class="t">没有找到「' + esc(st.q || '') + '」</div>' +
        '<div class="s">换个关键词试试</div></div>';
    } else {
      body = '<div class="srch-count">去重后 ' + songs.length + ' 首</div>';
    }
    var rows = songs.map(function (s, i) {
      var badge = s.bitrate ? '' : '<em class="chk">检测中</em>';
      var liked = !!(S.liked && S.liked[s.key]);
      return '<div class="sres' + (isCurrent(s) ? ' now' : '') + '" data-act="play-song" data-list="search" data-index="' + i + '" role="button">' +
        art(s, 'sart') +
        '<div class="smt"><div class="st"><span class="tt">' + esc(s.name) + '</span>' + badge + '</div>' +
          '<div class="ss">' + esc(s.artist || '') + (s.album ? ' · ' + esc(s.album) : '') +
          (s.duration ? ' · ' + fmtMs(s.duration * 1000) : '') + '</div></div>' +
        '<div class="sac">' +
          '<button data-act="download-song" data-index="' + i + '" data-list="search" aria-label="下载">' + icon('download') + '</button>' +
          '<button data-act="fav-song" data-index="' + i + '" data-list="search" aria-label="喜欢">' + icon(liked ? 'heartFill' : 'heart') + '</button>' +
          '<button data-act="song-add" data-index="' + i + '" data-list="search" aria-label="加入歌单">' + icon('plus') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<section class="page srch">' +
      '<div class="sbar">' +
        '<button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<div class="sbox">' + icon('search') +
          '<input id="srchInput" value="' + esc(st.q || '') + '" placeholder="搜索歌曲、歌手" autocomplete="off">' +
          (st.q ? '<button class="clr" data-act="search-clear" aria-label="清空">' + icon('close') + '</button>' : '') +
        '</div>' +
        '<button class="sgo" data-act="search-go">搜索</button>' +
      '</div>' +
      '<div class="stabs">' +
        '<div class="stypes"><button class="fchip on">歌曲</button>' +
          '<button class="fchip" data-act="search-tab" data-tab="playlists">歌单</button></div>' +
        '<div class="ssrcs">' + chips + '</div>' +
      '</div>' +
      body +
      (songs.length ? '<div class="srch-grid">' + rows + '</div>' : '') +
      '</section>';
  }

  function pageDaily() {
    var d = S.daily || { songs: [], count: 0 };
    var songs = d.songs || [];
    S.lists.daily = songs;
    var rows = songs.map(function (s, i) {
      var tag = s.bitrate >= 999 ? '<em class="d2tag hi">无损</em>'
        : s.bitrate ? '<em class="d2tag">' + (s.bitrate >= 320 ? '320K' : '128K') + '</em>'
        : '<em class="d2tag chk">检测中</em>';
      var liked = !!(S.liked && S.liked[s.key]);
      return '<div class="d2row' + (isCurrent(s) ? ' now' : '') + '" data-act="play-song" data-list="daily" data-index="' + i + '" role="button">' +
        art(s, 'd2art') +
        '<div class="d2meta"><div class="t"><span class="tt">' + esc(s.name) + '</span>' + tag + '</div>' +
          '<div class="s">' + esc(s.artist || '') + (s.album ? ' · ' + esc(s.album) : '') +
          (s.duration ? ' · ' + fmtMs(s.duration * 1000) : '') + '</div></div>' +
        '<div class="d2act">' +
          '<button data-act="download-song" data-index="' + i + '" data-list="daily" aria-label="下载">' + icon('download') + '</button>' +
          '<button data-act="fav-song" data-index="' + i + '" data-list="daily" aria-label="喜欢"><span class="' + (liked ? 'on' : '') + '">' + icon(liked ? 'heartFill' : 'heart') + '</span></button>' +
          '<button data-act="song-add" data-index="' + i + '" data-list="daily" aria-label="加入歌单">' + icon('plus') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<section class="page daily2">' +
      '<header class="d2-head"><button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<h1>每日推荐</h1>' +
        '<button class="rf" data-act="daily-refresh" aria-label="重新生成">' + icon('repeat') + '</button></header>' +
      '<div class="d2-scroll">' +
        '<div class="d2-date">' + (d.date || (function () {
          var t = new Date();
          return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
        })()) + '</div>' +
        '<div class="d2-count">今日 ' + (d.count || songs.length) + ' 首</div>' +
        '<div class="d2-sub">根据真实播放画像、收藏与歌单候选生成</div>' +
        '<button class="d2-play" data-act="play-list" data-list="daily">' + icon('play') + '播放全部</button>' +
        (songs.length ? '<div class="d2-list">' + rows + '</div>'
          : '<div class="srch-empty"><div class="t">今天还没有推荐</div><div class="s">点右上角刷新生成一份</div></div>') +
      '</div>' +
      '</section>';
  }

  function pageFm() {
    var fm = S.fm || { song: null, queue: [] };
    var cur = fm.song || S.song;
    var queue = (fm.queue || []).filter(function (s) { return !cur || s.key !== cur.key; });
    S.lists.fm = cur ? [cur].concat(queue) : queue;
    var wide = window.innerWidth >= 900;
    if (wide) {
      if (cur) {
        S.fmMode = true;
        var html = pagePlayer();
        S.fmMode = false;
        return html;
      }
      return '<section class="player"><div class="pl-bg"></div>' +
        '<header class="pl-head"><button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<div class="eb"></div><span style="width:38px"></span></header>' +
        '<div class="fm-loading"><span class="spin"></span>正在生成私人电台…</div></section>';
    }
    var stage;
    if (!cur) {
      stage = '<div class="fmp-empty"><div class="fmp-cover"><span class="art-fb">FM</span></div>' +
        '<div class="fmp-title">私人 FM</div><div class="fmp-artist">开启后按你的口味连续播放</div>' +
        '<button class="fmp-start" data-act="fm-play">开始收听</button></div>';
    } else {
      var lyric = S.lyricLine || '';
      stage = '<div class="fmp-stage" style="--h:' + hueOf(cur.name) + '">' +
        '<div class="fmp-cover">' + art(cur) + '</div>' +
        '<div class="fmp-title">' + esc(cur.name) + '</div>' +
        '<div class="fmp-artist">' + esc(cur.artist) + '</div>' +
        (lyric ? '<div class="fmp-lyric">' + esc(lyric) + '</div>' : '') +
        '<div class="fmp-seek"><span class="bar"><i style="width:' +
          Math.max(0, Math.min(100, (S.positionMs || 0) / ((cur.duration || 1) * 1000) * 100)) + '%"></i></span>' +
          '<div class="ts"><span>' + fmtMs(S.positionMs || 0) + '</span><span>' + fmtMs((cur.duration || 0) * 1000) + '</span></div></div>' +
        '<div class="fmp-acts">' +
          '<button class="fmp-dis" data-act="fm-dislike" aria-label="不喜欢">' + icon('thumbDown') + '</button>' +
          '<button class="fmp-play" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
          '<button class="fmp-next" data-act="fm-skip" aria-label="跳过">' + icon('next') + '</button>' +
        '</div>' +
      '</div>';
    }
    return '<section class="page fmpage">' +
      '<header class="fmp-head"><button class="fmp-back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<b>私人 FM</b><span>' + (queue.length ? '待播 ' + queue.length : '') + '</span></header>' +
      stage +
      '<div class="fmp-nextlist">' +
        (queue.length ? '<div class="gh">接下来</div>' +
          queue.slice(0, 3).map(function (s) {
            return '<div class="fmp-nrow">' + esc(s.name) + ' · ' + esc(s.artist) + '</div>';
          }).join('') : '') +
      '</div>' +
      '</section>';
  }

  function pageQueue() {
    var q = S.queue || [];
    var srcName = { netease: '网易云', kuwo: '酷我', qq: 'QQ', kugou: '酷狗', migu: '咪咕', bilibili: 'B站' };
    return pagePlayer() +
      '<section class="page sheets">' +
      '<div class="psh-scrim" data-act="back"></div>' +
      '<div class="psh qsh">' +
        '<span class="grab"></span>' +
        '<div class="qsh-head">' +
          '<button class="qclose" data-act="back" aria-label="关闭">' + icon('chevronDown') + '</button>' +
          '<b>播放队列' + (q.length ? '<span>' + q.length + ' 首</span>' : '') + '</b>' +
          '<button class="qclear" data-act="queue-clear">清空</button>' +
        '</div>' +
        '<div class="qsh-body">' +
        (q.length ? q.map(function (s, i) {
          var cur = i === S.index;
          return '<div class="qrow' + (cur ? ' now' : '') + '" data-act="queue-play" data-index="' + i + '" role="button" tabindex="0">' +
            art(s, 'qart') +
            '<span class="meta"><span class="t">' + esc(s.name) + '</span>' +
            '<span class="s">' + esc(s.artist) + ' · ' + esc(srcName[s.source] || s.source || '') + '</span></span>' +
            '<button class="qdel" data-act="queue-remove" data-index="' + i + '" aria-label="移除">' + icon('close') + '</button>' +
            '</div>';
        }).join('') : '<div class="qsh-empty">队列为空</div>') +
        '</div>' +
      '</div>' +
      '</section>';
  }

  function pageSettings() {
    var st = S.settings || {};
    var playQ = [['standard', '流畅 128k', '最快最省流；没有 128k 时用最接近的一档'],
      ['exhigh', '高品 320k（推荐）', '优先 320k，拿不到自动降到 128k'],
      ['lossless', '无损 FLAC', '优先无损，拿不到自动降到 320k'],
      ['hires', 'Hi-Res', '优先 Hi-Res，拿不到逐级降：无损 → 320k']];
    var strats = [['quality', '偏品质', '更多通道参与实测（含外部解析器同场比拼），允许播放中热切到更高档；拿不到目标档就换源，不静默降级'],
      ['balanced', '平衡（默认）', '先起播、后台预检，已出声不打断；按时间预算尝试更高档'],
      ['speed', '偏速度', '哪条最快用哪条：跳过选优探测直接起播，允许 320k/128k']];
    var dlQ = [['standard', '标准'], ['exhigh', '极高'], ['lossless', '无损']];
    var names = { kuwo: '酷我', netease: '网易云', qq: 'QQ音乐', kugou: '酷狗', migu: '咪咕' };
    var pri = (st.priority && st.priority.length) ? st.priority : ['kuwo', 'netease', 'qq', 'kugou'];
    function sec(title, body) {
      return '<div class="st-sec"><div class="st-lb">' + title + '</div><div class="st-card">' + body + '</div></div>';
    }
    function nav(ic, icls, title, sub) {
      return '<div class="st-row st-nav"><span class="st-ic ' + icls + '">' + ic + '</span>' +
        '<span class="st-mid"><b>' + title + '</b><small>' + sub + '</small></span>' +
        '<span class="st-chev">' + icon('chevronRight') + '</span></div>';
    }
    function block(label, inner, extra) {
      return '<div class="st-row st-block"><div class="st-bl">' + label + '</div>' + inner + (extra || '') + '</div>';
    }
    function qual(cur, opts, act) {
      return opts.map(function (o) {
        var on = cur === o[0];
        return '<button class="st-qual' + (on ? ' on' : '') + '" data-act="' + act + '" data-value="' + o[0] + '">' +
          '<i class="st-radio">' + (on ? '<i></i>' : '') + '</i>' +
          '<span class="st-qm"><b>' + o[1] + '</b><small>' + o[2] + '</small></span></button>';
      }).join('');
    }
    return '<section class="page stpage">' +
      '<div class="st-bar"><button class="st-back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button><b>设置</b></div>' +
      '<div class="st-scroll">' +
        sec('音乐源',
          nav(icon('music'), 'ic-green', '源管理', '参与源开关与外部源解析开关') +
          nav(icon('link'), 'ic-orange', '订阅源', '外部脚本源订阅与启停') +
          block('结果排序优先级（点按置顶，酷我默认第一；影响搜索排序与选优同档先后）',
            '<div class="st-chips">' + pri.map(function (k, i) {
              return '<button class="st-chip' + (i === 0 ? ' accent' : '') + '"' +
                (i === 0 ? '' : ' data-act="set-priority" data-value="' + k + '"') + '>' +
                (i + 1) + '. ' + (names[k] || k) + '</button>';
            }).join('') + '</div>') +
          block('换源命中判定 · 固定相似度 0.6',
            '<div class="st-note">原源→同源其他候选→跨平台统一匹配；时长容差与 Live/伴奏/Remix 版本拦截一致，超时只显示检测中。</div>')) +
        sec('播放',
          block('取流策略（愿意为目标音质等多久 / 牺牲什么；播放页顶部胶囊可查看本次实际结果）',
            qual(st.fetchStrategy || 'balanced', strats, 'set-strategy')) +
          block('播放音质（所选档 = 起步档：能拿更高就拿更高，拿不到按档内说明降级）',
            qual(st.playQuality || 'exhigh', playQ, 'set-play-quality'))) +
        sec('下载',
          block('下载默认档位',
            '<div class="st-chips">' + dlQ.map(function (o) {
              var on = (st.downloadQuality || 'lossless') === o[0];
              return '<button class="st-chip' + (on ? ' on' : '') + '" data-act="set-download-quality" data-value="' + o[0] + '">' + o[1] + '</button>';
            }).join('') + '</div>') +
          block('同时下载数',
            '<div class="st-chips">' + [1, 2, 3].map(function (n) {
              var on = (st.downloadConcurrency || 1) === n;
              return '<button class="st-chip' + (on ? ' on' : '') + '" data-act="set-concurrency" data-value="' + n + '">' +
                (n === 1 ? '1 首（推荐）' : n + ' 首') + '</button>';
            }).join('') + '</div>',
            '<div class="st-note">默认建议 1：串行下载最不容易被平台识别/封 IP。调高后立即生效，正在下载的任务不受影响。</div>') +
          nav(icon('download'), 'ic-blue', '下载队列', '查看进度、重试、清空与下载记录') +
          '<div class="st-row st-nav"><span class="st-mid"><b>下载音乐路径</b><small>' + esc(st.downloadDir || '/storage/emulated/0/Music/珍珠唱机') + '</small></span>' +
            '<span class="st-chev">' + icon('copy') + '</span></div>' +
          block('路径预设（Android 10+ 仅限应用私有目录）',
            '<div class="st-chips"><button class="st-chip on">默认 · data/downloads</button><button class="st-chip">Music 子目录</button></div>',
            '<div class="st-note">公共 Downloads 目录需系统文件选择器授权（SAF），本版未开放；预设均在应用私有目录内，卸载 App 会一并删除。</div>')) +
        sec('平台登录 / Cookie',
          nav(icon('qr'), 'ic-slate', '平台登录', '扫码或粘贴 Cookie')) +
        '<div class="st-foot">珍珠唱机 FX · 引擎逻辑均在本地运行</div>' +
      '</div>' +
      '</section>';
  }

  function pagePlayer() {
    var fmMode = !!S.fmMode;
    var s = S.song || (fmMode && S.fm && S.fm.song) || {};
    if (!s) {
      return '<section class="player"><div class="pl-bg"></div>' +
        '<header class="pl-head"><button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<div class="eb"></div><span style="width:38px"></span></header>' +
        '<div style="position:relative;z-index:4;flex:1;display:grid;place-items:center;padding:20px">' +
        emptyState('disc', '还没有在播放的歌', '从首页或歌单里选一首') + '</div></section>';
    }
    var liked = !!S.liked[s.key];
    var modeIcon = S.mode === 'shuffle' ? 'shuffle' : S.mode === 'singleLoop' ? 'repeatOne' : 'repeat';
    var ly = S.lyrics && S.lyrics.length
      ? S.lyrics.map(function (l, i) {
          return '<div class="lyric-line' + (i === S.lyricIndex ? ' on' : '') + '" data-act="seek-lyric" data-ms="' + (l[0] || 0) + '">' + esc(l[1] || '') + '</div>';
        }).join('')
      : '<div class="no-lyric" style="padding:10px 0;color:rgba(255,255,255,.55);font-size:13px">' +
        (S.loading ? '正在加载歌词…' : '纯音乐，请欣赏') + '</div>';
    var heart = '<button class="heart' + (liked ? ' on' : '') + '" data-act="like" aria-label="喜欢">' +
      icon(liked ? 'heartFill' : 'heart') + '</button>';
    if (fmMode) heart = '';
    var seek = '<div class="seekbar"><div class="track"><i data-seek-fill style="width:0%"></i></div>' +
      '<input class="seek-input" type="range" min="0" max="1000" value="0" step="1" aria-label="进度"></div>' +
      '<div class="pl-time"><span data-pos>0:00</span><span data-dur>0:00</span></div>';
    var seekLd = '<div class="seekbar"><div class="track"><i data-seek-fill style="width:0%"></i></div>' +
      '<input class="seek-input" type="range" min="0" max="1000" value="0" step="1" aria-label="进度"></div>' +
      '<div class="pl-time"><span data-pos>0:00</span><span data-rem>-0:00</span></div>';

    return '<section class="player">' +
      '<div class="pl-bg">' + art(s) + '</div>' +
      '<header class="pl-head">' +
        '<button class="back" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<div class="eb">正在播放 · 网易云</div>' +
        '<div class="acts">' +
          '<button class="pskin" data-act="skin"><i></i>柔焦' + icon('chevronDown') + '</button>' +
          heart +
          '<button data-act="song-more" aria-label="更多">' + icon('more') + '</button>' +
        '</div>' +
      '</header>' +
      /* 横屏 P06S */
      '<div class="pl-ld">' +
        '<div class="info"><div class="eb">NOW PLAYING</div>' +
          '<div class="trow"><div class="t">' + esc(s.name) + '</div></div>' +
          '<div class="s">' + esc(s.artist) + (s.album ? ' · ' + esc(s.album) : '') + '</div></div>' +
        '<div class="lyrics" data-lyrics>' + ly + '</div>' +
        '<div class="deck">' +
          seekLd +
          '<div class="pl-controls">' +
            '<button class="cb" data-act="prev" aria-label="上一首">' + icon('prev') + '</button>' +
            '<button class="main" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
            '<button class="cb" data-act="next" aria-label="下一首">' + icon('next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* 竖屏转盘 */
      '<div class="pl-pt">' +
        '<button class="pback" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<button class="pmore" data-act="song-more" aria-label="更多">' + icon('more') + '</button>' +
        '<div class="turntable"><div class="disc' + (S.playing ? ' spin' : '') + '">' + art(s) + '<span class="hole"></span></div>' +
          '<div class="arm' + (S.playing ? ' on' : '') + '">' +
            '<svg viewBox="0 0 100 120" aria-hidden="true">' +
              '<circle cx="86" cy="16" r="10" fill="#241f1c" stroke="rgba(255,255,255,.24)" stroke-width="1.6"/>' +
              '<rect x="80.4" y="18" width="11" height="82" rx="5.5" fill="url(#armG2)"/>' +
              '<circle cx="86" cy="101" r="5.5" fill="#f3c18e"/>' +
              '<defs><linearGradient id="armG2" x1="1" y1="0" x2="0" y2="1">' +
                '<stop offset="0" stop-color="#e6e0d8"/><stop offset=".55" stop-color="#a49b90"/><stop offset="1" stop-color="#6b635a"/>' +
              '</linearGradient></defs></svg></div></div>' +
        '<div class="title"><div class="t">' + esc(s.name) + '</div>' + heart + '</div>' +
        '<div class="artist">' + esc(s.artist) + (s.album ? ' · ' + esc(s.album) : '') + '</div>' +
        '<div class="lyrics" data-lyrics>' + ly + '</div>' +
        '<div class="seek">' + seek + '</div>' +
        '<div class="times"><span data-pos>0:00</span><span data-dur>0:00</span></div>' +
        '<div class="ctrls">' +
          '<button class="c" style="left:12%" data-act="mode-cycle" aria-label="播放模式">' + icon(modeIcon) + '</button>' +
          '<button class="c" style="left:30%" data-act="prev" aria-label="上一首">' + icon('prev') + '</button>' +
          '<button class="main" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
          '<button class="c" style="left:70%" data-act="next" aria-label="下一首">' + icon('next') + '</button>' +
          '<button class="c" style="left:88%" data-act="route" data-route="queue" aria-label="队列">' + icon('queue') + '</button>' +
        '</div>' +
      '</div>' +
      '</section>';
  }

  function skeletonList() {
    var rows = '';
    for (var i = 0; i < 6; i++) {
      rows += '<div class="srow"><span class="idx"></span>' +
        '<div class="skeleton" style="width:42px;height:42px;border-radius:9px"></div>' +
        '<span class="meta"><div class="skeleton" style="height:11px;width:52%"></div>' +
        '<div class="skeleton" style="height:9px;width:30%;margin-top:7px"></div></span></div>';
    }
    return '<div class="songlist">' + rows + '</div>';
  }

  function bootScreen() {
    return '<div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:70vh;gap:16px">' +
      '<div class="disc" style="width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#2a2522,#0d0b0a 70%);box-shadow:0 16px 34px rgba(0,0,0,.5);position:relative;animation:spin 3s linear infinite">' +
        '<div style="position:absolute;left:50%;top:50%;width:16px;height:16px;border-radius:50%;background:#080d10;border:2px solid rgba(255,255,255,.2);transform:translate(-50%,-50%)"></div>' +
        '<div style="position:absolute;left:50%;top:50%;width:6px;height:6px;border-radius:50%;background:#f3c18e;transform:translate(-50%,-50%)"></div>' +
      '</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.5);letter-spacing:.6px">' + (S.bootError ? '界面加载失败：' + esc(S.bootError) : '正在载入珍珠唱机…') + '</div>' +
      (S.bootError ? '<button class="btn sm" data-act="retry-boot">重试</button>' : '') +
      '</div>';
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    var n0 = S.route.name;
    var wideFm = n0 === 'fm' && window.innerWidth >= 900;
    document.body.classList.toggle('mode-player', n0 === 'player' || wideFm || n0 === 'queue');
    document.body.classList.toggle('no-top', n0 !== 'home');
    if (!S.ready) { view.innerHTML = bootScreen(); updateDock(true); return; }
    if (n0 === 'player') {
      view.innerHTML = pagePlayer();
      syncProgress();
      syncLyrics(true);
      return;
    }
    if (n0 === 'fm' && window.innerWidth >= 900) {
      view.innerHTML = pageFm();
      syncProgress();
      syncLyrics(true);
      return;
    }
    var n = S.route.name;
    var html;
    if (n === 'home') html = pageHome();
    else if (n === 'playlists') html = pagePlaylists();
    else if (n === 'playlist') html = pagePlaylist();
    else if (n === 'search') html = pageSearch();
    else if (n === 'daily') html = pageDaily();
    else if (n === 'fm') html = pageFm();
    else if (n === 'queue') html = pageQueue();
    else if (n === 'settings') html = pageSettings();
    else html = pageHome();
    view.innerHTML = html;
    view.scrollTop = 0;
  }

  function navItems() {
    return [
      ['home', '首页', 'home'],
      ['search', '搜索', 'search'],
      ['playlists', '歌单', 'disc'],
      ['daily', '每日', 'sparkle'],
      ['fm', 'FM', 'radio']
    ];
  }

  function updateDock(force) {
    var rn = S.route.name;
    if (rn === 'player' || rn === 'fm' || rn === 'queue' || rn === 'playlists') { dockEl.classList.add('hidden'); return; }
    dockEl.classList.remove('hidden');
    var key = (S.song && S.song.key || 'none') + '|' + S.route.name + '|' + S.playing;
    if (!force && S._dockSongKey === key) { updateMiniProgress(); return; }
    S._dockSongKey = key;
    var mini;
    if (S.song) {
      var ring = '<svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="25" fill="none" stroke="#EDE8E1" stroke-width="2"/>' +
        '<circle id="miniRing" cx="27" cy="27" r="25" fill="none" stroke="#E4553F" stroke-width="2" ' +
        'stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="157.1"/></svg>';
      mini = '<div class="mini" data-act="route" data-route="player">' +
        '<div class="coverwrap">' + art(S.song) + '<span class="ring">' + ring + '</span></div>' +
        '<div class="meta"><div class="t">' + esc(S.song.name) + ' - ' + esc(S.song.artist) + '</div></div>' +
        '<button class="mb prev" data-act="prev" aria-label="上一首">' + icon('prev') + '</button>' +
        '<button class="mb play" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
        '<button class="mb next" data-act="next" aria-label="下一首">' + icon('next') + '</button>' +
        '<button class="mb queue" data-act="route" data-route="queue" aria-label="队列">' + icon('queue') + '</button>' +
        '<button class="mb expand" data-act="route" data-route="player" aria-label="展开播放页">' + icon('unfold') + '</button>' +
        '</div>';
    } else {
      mini = '<div class="mini idle" data-act="route" data-route="player">' +
        '<div class="coverwrap"><div class="art" style="--h:30"><span class="art-fb">♪</span></div></div>' +
        '<div class="meta"><div class="t">还没有在播放</div><div class="s">选一首歌开始</div></div>' +
        '<button class="mb play" data-act="goto-daily" aria-label="每日推荐">' + icon('play') + '</button></div>';
    }
    dockEl.innerHTML = mini;
    updateMiniProgress();
  }

  function updateMiniProgress() {
    var total = S.durationMs || 0;
    var pct = total > 0 ? Math.max(0, Math.min(1, S.positionMs / total)) : 0;
    var ring = $('miniRing');
    if (ring) ring.setAttribute('stroke-dashoffset', String(157.1 * (1 - pct)));
    var fill = $('miniFill');
    if (fill) fill.style.width = (pct * 100) + '%';
  }

  function syncProgress() {
    var total = S.durationMs || 0;
    var pctW = total > 0 ? Math.min(100, (S.positionMs / total) * 100) + '%' : '0%';
    var fills = document.querySelectorAll('[data-seek-fill], #seekFill');
    for (var i = 0; i < fills.length; i++) fills[i].style.width = pctW;
    var poss = document.querySelectorAll('[data-pos], #posLabel');
    for (var j = 0; j < poss.length; j++) poss[j].textContent = fmtMs(S.positionMs);
    var durs = document.querySelectorAll('[data-dur], #durLabel');
    for (var k = 0; k < durs.length; k++) durs[k].textContent = fmtMs(S.durationMs);
    var rems = document.querySelectorAll('[data-rem]');
    for (var r = 0; r < rems.length; r++) {
      rems[r].textContent = total > 0 ? '-' + fmtMs(Math.max(0, total - S.positionMs)) : '--:--';
    }
    var inputs = document.querySelectorAll('.seek-input, #seekInput');
    for (var n = 0; n < inputs.length; n++) {
      var input = inputs[n];
      if (!input.__dragging) input.value = total > 0 ? Math.round((S.positionMs / total) * 1000) : 0;
    }
    updateMiniProgress();
  }

  function syncLyrics(force) {
    var boxes = document.querySelectorAll('[data-lyrics], #lyricsBox');
    if (!boxes.length) return;
    for (var b = 0; b < boxes.length; b++) {
      var box = boxes[b];
      var lines = box.querySelectorAll('.lyric-line');
      if (!lines.length) continue;
      for (var i = 0; i < lines.length; i++) lines[i].classList.toggle('on', i === S.lyricIndex);
      if (S.lyricIndex >= 0 && lines[S.lyricIndex] && (force || S._lastLyricIndex !== S.lyricIndex)) {
        var el = lines[S.lyricIndex];
        /* 横屏 P06S 当前句钉在第 3 行（可视区 61%），竖屏居中 */
        var ratio = box.closest('.pl-ld') ? 0.61 : 0.5;
        var top = el.offsetTop - box.clientHeight * ratio + el.clientHeight / 2;
        box.scrollTo({ top: Math.max(0, top), behavior: force ? 'auto' : 'smooth' });
      }
    }
    if (S.lyricIndex >= 0) S._lastLyricIndex = S.lyricIndex;
  }

  function syncPlayer() {
    var mains = document.querySelectorAll('.pl-ld .main, .pl-pt .main');
    for (var i = 0; i < mains.length; i++) mains[i].innerHTML = icon(S.playing ? 'pause' : 'play');
    var discs = document.querySelectorAll('.turntable .disc');
    for (var d = 0; d < discs.length; d++) discs[d].classList.toggle('spin', S.playing);
    var arms = document.querySelectorAll('.turntable .arm');
    for (var a = 0; a < arms.length; a++) arms[a].classList.toggle('on', S.playing);
    if (S.song) {
      var isLiked = !!S.liked[S.song.key];
      var hearts = document.querySelectorAll('.pl-head .heart, .pl-pt .title .heart');
      for (var h = 0; h < hearts.length; h++) {
        hearts[h].classList.toggle('on', isLiked);
        hearts[h].innerHTML = icon(isLiked ? 'heartFill' : 'heart');
      }
    }
    syncProgress();
  }

  function syncFmNow() {
    var disc = document.querySelector('.fmstage .disc');
    if (disc) disc.classList.toggle('spin', S.playing);
  }

  function modeLabel(m) {
    return m === 'shuffle' ? '随机播放' : m === 'singleLoop' ? '单曲循环' : '列表循环';
  }

  /* ---------------- 提示 / 弹层 ---------------- */
  var toastTimer = null;
  function toast(msg) {
    if (!msg) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function openSheet(html) {
    var root = $('sheetRoot');
    root.innerHTML = '<div class="sheet-mask" data-act="close-sheet"></div>' +
      '<div class="sheet-wrap"><div class="sheet"><div class="grab"></div>' + html + '</div></div>';
    root.classList.add('open');
  }
  function closeSheet() {
    var root = $('sheetRoot');
    root.classList.remove('open');
    root.innerHTML = '';
  }

  /* ---------------- 交互 ---------------- */
  async function playList(listName, index) {
    var list = S.lists[listName];
    if (!list || !list.length) { toast('列表为空'); return; }
    await call('play', { songs: list, index: index || 0, origin: listName });
  }

  async function toggle() {
    if (!S.song) { toast('还没有在播放'); return; }
    S.playing = !S.playing;
    syncPlayer(); updateDock(true);
    await call('toggle');
  }

  async function playSong(listName, index) {
    if (listName === 'queue') { await call('queue.play', { index: index }); return; }
    await playList(listName, index);
  }

  async function toggleLike() {
    if (!S.song) return;
    try {
      var d = await call('like', { song: S.song });
      var liked = d && typeof d.liked === 'boolean' ? d.liked : !S.liked[S.song.key];
      if (liked) S.liked[S.song.key] = true; else delete S.liked[S.song.key];
      toast(liked ? '已加入我喜欢的音乐' : '已取消喜欢');
      if (S.route.name === 'player') syncPlayer();
    } catch (e) { toast(e.message || '操作失败'); }
  }

  async function fmPlay() {
    try {
      toast('正在开启私人 FM…');
      var d = await call('fm.start');
      S.fm = d;
      S.lists.fm = [d.song].concat(d.queue || []);
      if (S.route.name !== 'fm') go('fm'); else render();
      toast('私人 FM 已开启');
    } catch (e) { toast(e.message || '私人 FM 开启失败'); }
  }

  async function fmSkip(dislike) {
    try {
      var d = await call(dislike ? 'fm.dislike' : 'fm.skip');
      S.fm = d;
      if (d.song && S.route.name === 'fm') {
        S.lists.fm = [d.song].concat(d.queue || []);
        render();
      }
    } catch (e) { toast(e.message || '操作失败'); }
  }

  async function openAddToPlaylist() {
    if (!S.song) return;
    var pls = S.playlists || [];
    if (!pls.length) { toast('还没有本地歌单'); return; }
    openSheet('<h3>加入歌单</h3>' + pls.map(function (p) {
      return '<button class="frow" data-act="add-to-pl" data-id="' + esc(p.id) + '">' + art(p) +
        '<div class="meta"><div class="t">' + esc(p.name) + '</div><div class="s">' + (p.count || 0) + ' 首</div></div>' +
        icon('plus') + '</button>';
    }).join('') + '<button class="frow" data-act="playlist-create" style="color:var(--accent)">' + icon('plus') + ' 新建歌单</button>');
  }

  document.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act;
    if (act === 'route') { e.preventDefault(); go(el.dataset.route); return; }
    if (act === 'back') { back(); return; }
    if (act === 'close-sheet') { closeSheet(); return; }
    if (act === 'goto-daily') { go('daily'); return; }

    if (act === 'play-song') { await playSong(el.dataset.list, Number(el.dataset.index) || 0); return; }
    if (act === 'play-list') { await playList(el.dataset.list, 0); return; }
    if (act === 'toggle') { e.stopPropagation(); await toggle(); return; }
    if (act === 'next') { e.stopPropagation(); await call('next'); return; }
    if (act === 'prev') { await call('prev'); return; }
    if (act === 'like') { await toggleLike(); return; }
    if (act === 'fav-song') {
      e.stopPropagation();
      var fs = (S.lists[el.dataset.list] || [])[Number(el.dataset.index)];
      if (!fs) return;
      try {
        var fd = await call('like', { song: fs });
        var fl = fd && typeof fd.liked === 'boolean' ? fd.liked : !S.liked[fs.key];
        if (fl) S.liked[fs.key] = true; else delete S.liked[fs.key];
        toast(fl ? '已加入我喜欢的音乐' : '已取消喜欢');
        render();
      } catch (err) { toast(err.message || '操作失败'); }
      return;
    }
    if (act === 'download-song') {
      e.stopPropagation();
      var ds = (S.lists[el.dataset.list] || [])[Number(el.dataset.index)];
      if (!ds) return;
      try { await call('download', { song: ds }); toast('已加入下载队列'); }
      catch (err) { toast(err.message || '下载失败'); }
      return;
    }
    if (act === 'song-add') {
      e.stopPropagation();
      var as = (S.lists[el.dataset.list] || [])[Number(el.dataset.index)];
      if (!as) return;
      openSheet('<h3>加入歌单</h3>' + (S.playlists || []).map(function (p) {
        return '<button class="frow" data-act="song-add-do" data-id="' + esc(p.id) + '" data-key="' + esc(as.key) + '">' +
          esc(p.name) + '<span class="cnt">' + (p.count || 0) + ' 首</span></button>';
      }).join(''));
      return;
    }
    if (act === 'song-add-do') {
      var addSong = null;
      ['search', 'daily', 'playlist', 'queue'].forEach(function (n) {
        (S.lists[n] || []).forEach(function (x) { if (x.key === el.dataset.key) addSong = x; });
      });
      if (!addSong) addSong = S.song;
      try { await call('playlist.add', { id: el.dataset.id, song: addSong }); closeSheet(); toast('已加入歌单'); }
      catch (err) { toast(err.message || '加入失败'); }
      return;
    }
    if (act === 'search-clear') {
      S.search.q = ''; S.search.songs = []; S.search.playlists = []; render();
      setTimeout(function () { var i = $('srchInput'); if (i) i.focus(); }, 30);
      return;
    }
    if (act === 'search-go') {
      var goq = (($('srchInput') && $('srchInput').value) || '').trim();
      if (!goq) { toast('请输入关键词'); return; }
      await doSearch(goq, ''); render();
      return;
    }
    if (act === 'mode-cycle') { await call('mode.cycle'); return; }
    if (act === 'play-favorites') { await playList('favorites', 0); return; }
    if (act === 'open-playlist') { go('playlist', { id: el.dataset.id }); return; }
    if (act === 'playlist-shuffle') { await call('playlist.shuffle', { id: el.dataset.id }); return; }
    if (act === 'playlist-menu') {
      openSheet('<h3>' + esc(S.playlist ? S.playlist.name : '歌单') + '</h3>' +
        '<button class="frow" data-act="playlist-rename">重命名</button>' +
        '<button class="frow" data-act="playlist-delete" style="color:var(--danger)">删除歌单</button>');
      return;
    }
    if (act === 'playlist-create') {
      closeSheet();
      openSheet('<h3>新建歌单</h3><div class="field"><input id="newPlName" placeholder="输入歌单名"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn ghost sm" data-act="close-sheet">取消</button>' +
        '<button class="btn sm" data-act="playlist-create-do">创建</button></div>');
      setTimeout(function () { var i = $('newPlName'); if (i) i.focus(); }, 60);
      return;
    }
    if (act === 'playlist-create-do') {
      var input = $('newPlName');
      var name = input ? input.value.trim() : '';
      if (!name) { toast('请输入歌单名'); return; }
      try {
        var d = await call('playlist.create', { name: name });
        closeSheet();
        await loadPlaylists();
        if (S.route.name !== 'playlists') go('playlists'); else render();
        toast('已创建「' + name + '」');
        if (d && d.id) go('playlist', { id: d.id });
      } catch (err) { toast(err.message || '创建失败'); }
      return;
    }
    if (act === 'playlist-rename') {
      openSheet('<h3>重命名歌单</h3><div class="field"><input id="plRename" value="' +
        esc(S.playlist ? S.playlist.name : '') + '"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        '<button class="btn ghost sm" data-act="close-sheet">取消</button>' +
        '<button class="btn sm" data-act="playlist-rename-do" data-id="' + esc(S.playlist ? S.playlist.id : '') + '">保存</button></div>');
      return;
    }
    if (act === 'playlist-rename-do') {
      var inp = $('plRename');
      var nn = inp ? inp.value.trim() : '';
      if (!nn) { toast('名称不能为空'); return; }
      try {
        await call('playlist.rename', { id: el.dataset.id, name: nn });
        closeSheet(); await loadPlaylist(el.dataset.id); render(); toast('已重命名');
      } catch (err) { toast(err.message || '重命名失败'); }
      return;
    }
    if (act === 'playlist-delete') {
      var pid = S.playlist ? S.playlist.id : '';
      try {
        await call('playlist.delete', { id: pid });
        closeSheet(); S.playlist = null; await loadPlaylists(); go('playlists'); toast('歌单已删除');
      } catch (err) { toast(err.message || '删除失败'); }
      return;
    }
    if (act === 'add-to-playlist') { await openAddToPlaylist(); return; }
    if (act === 'add-to-pl') {
      try {
        await call('playlist.add', { id: el.dataset.id, song: S.song });
        closeSheet(); toast('已加入歌单');
      } catch (err) { toast(err.message || '加入失败'); }
      return;
    }
    if (act === 'download') {
      try { await call('download', { song: S.song }); toast('已加入下载队列'); }
      catch (err) { toast(err.message || '下载失败'); }
      return;
    }
    if (act === 'queue-play') { await call('queue.play', { index: Number(el.dataset.index) }); return; }
    if (act === 'queue-remove') { e.stopPropagation(); await call('queue.remove', { index: Number(el.dataset.index) }); await loadQueue(); render(); return; }
    if (act === 'queue-clear') { await call('queue.clear'); await loadQueue(); render(); toast('队列已清空'); return; }
    if (act === 'search-tab') { S.search.tab = el.dataset.tab; render(); return; }
    if (act === 'search-source') {
      S.search.source = el.dataset.source;
      if (S.search.q) { await doSearch(S.search.q, S.search.source); render(); }
      else render();
      return;
    }
    if (act === 'daily-refresh') {
      toast('正在重新生成每日推荐…');
      try {
        var dd = await call('daily.refresh');
        if (dd) S.daily = dd;
        S.lists.daily = (dd.songs || []);
        render(); toast('每日推荐已更新');
      } catch (err) { toast(err.message || '生成失败'); }
      return;
    }
    if (act === 'fm-open') { go('fm'); return; }
    if (act === 'fm-play') { e.stopPropagation(); await fmPlay(); return; }
    if (act === 'fm-skip') { await fmSkip(false); return; }
    if (act === 'fm-dislike') { await fmSkip(true); return; }
    if (act === 'seek-lyric') { await call('seek', { ms: Number(el.dataset.ms) }); return; }
    if (act === 'set-play-quality') { await setSetting({ playQuality: el.dataset.value }); return; }
    if (act === 'set-download-quality') { await setSetting({ downloadQuality: el.dataset.value }); return; }
    if (act === 'set-strategy') { await setSetting({ fetchStrategy: el.dataset.value }); return; }
    if (act === 'set-concurrency') { await setSetting({ downloadConcurrency: Number(el.dataset.value) }); return; }
    if (act === 'set-priority') {
      var v = el.dataset.value;
      var st = S.settings || {};
      var p = (st.priority && st.priority.length ? st.priority.slice() : ['kuwo', 'netease', 'qq', 'kugou']);
      var at = p.indexOf(v);
      if (at > 0) { p.splice(at, 1); p.unshift(v); await setSetting({ priority: p }); }
      return;
    }
    if (act === 'lyric-offset') {
      if (el.dataset.value === 'reset') await call('lyric.offset', { reset: true });
      else await call('lyric.offset', { deltaMs: Number(el.dataset.value) });
      toast('歌词偏移已调整');
      return;
    }
    if (act === 'retry-boot') { boot(); return; }
  });

  async function setSetting(patch) {
    try {
      var d = await call('settings.set', { patch: patch });
      S.settings = d.settings || Object.assign({}, S.settings, patch);
      toast('设置已保存');
      render();
    } catch (e) { toast(e.message || '保存失败'); }
  }

  /* 进度条拖动 */
  document.addEventListener('input', function (e) {
    if (!e.target.classList || !e.target.classList.contains('seek-input')) return;
    var input = e.target;
    input.__dragging = true;
    var bar = input.closest('.seekbar');
    if (bar) bar.classList.add('active');
    var ratio = Number(input.value) / 1000;
    var fills = document.querySelectorAll('[data-seek-fill]');
    for (var i = 0; i < fills.length; i++) fills[i].style.width = (ratio * 100) + '%';
    var poss = document.querySelectorAll('[data-pos]');
    for (var j = 0; j < poss.length; j++) poss[j].textContent = fmtMs(ratio * S.durationMs);
  });
  document.addEventListener('change', function (e) {
    if (!e.target.classList || !e.target.classList.contains('seek-input')) return;
    var input = e.target;
    input.__dragging = false;
    var bar = input.closest('.seekbar');
    if (bar) bar.classList.remove('active');
    var ms = (Number(input.value) / 1000) * (S.durationMs || 0);
    call('seek', { ms: Math.round(ms) });
  });

  /* 搜索 */
  $('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('searchInput').value.trim();
    if (!q) return;
    go('search', { q: q });
  });
  $('searchInput').addEventListener('focus', function () {
    if (S.route.name !== 'search') go('search');
  });

  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.id === 'srchInput' && e.key === 'Enter') {
      e.preventDefault();
      var q = (e.target.value || '').trim();
      if (!q) { toast('请输入关键词'); return; }
      doSearch(q, '').then(render);
      return;
    }
    if (e.key === 'Escape') { if ($('sheetRoot').classList.contains('open')) closeSheet(); else back(); }
  });

  /* ---------------- 浏览器演示适配 ---------------- */
  var demo = {
    queue: [], index: -1, playing: false, positionMs: 0, timer: null,
    mode: 'listLoop', liked: {}, added: {}
  };

  function demoEmit(type, data) { handleEvent({ type: type, data: data }); }

  function demoState() {
    demoEmit('state', {
      song: demo.queue[demo.index] || null,
      playing: demo.playing,
      index: demo.index,
      mode: demo.mode,
      positionMs: demo.positionMs,
      durationMs: (demo.queue[demo.index] || {}).duration ? demo.queue[demo.index].duration * 1000 : 0,
      likedKeys: Object.keys(demo.liked),
      queue: demo.queue
    });
  }

  function demoStartTimer() {
    if (demo.timer) clearInterval(demo.timer);
    demo.timer = setInterval(function () {
      if (!demo.playing || demo.index < 0) return;
      var cur = demo.queue[demo.index];
      if (!cur) return;
      demo.positionMs += 1000;
      if (demo.positionMs >= (cur.duration || 200) * 1000) {
        demo.positionMs = 0;
        demoNext(true);
        return;
      }
      demoEmit('progress', { positionMs: demo.positionMs, durationMs: (cur.duration || 200) * 1000 });
      var line = demoLyricFor(demo.positionMs);
      if (line.index !== S.lyricIndex) demoEmit('lyric', { index: line.index, line: line.text });
    }, 1000);
  }

  function demoLyricFor(ms) {
    var sec = ms / 1000;
    var lines = ['夜色沿着海岸线慢慢铺开', '风穿过窗台 带走一天的喧嚣', '我们都在寻找 一盏属于自己的灯', '如果此刻安静 就让旋律替你说话',
      '远处的灯火 像散落的星', '把心事交给这段旋律', '天亮之前 还有很长的路', '再听一遍 就睡吧'];
    var idx = Math.floor(sec / 12) % lines.length;
    return { index: idx, text: lines[idx] };
  }

  function demoLyrics() {
    var lines = ['夜色沿着海岸线慢慢铺开', '风穿过窗台 带走一天的喧嚣', '我们都在寻找 一盏属于自己的灯', '如果此刻安静 就让旋律替你说话',
      '远处的灯火 像散落的星', '把心事交给这段旋律', '天亮之前 还有很长的路', '再听一遍 就睡吧'];
    return lines.map(function (t, i) { return [i * 12000, t]; });
  }

  function demoNext(auto) {
    if (!demo.queue.length) return;
    if (demo.mode === 'singleLoop' && auto) { demo.positionMs = 0; demoState(); return; }
    demo.index = (demo.index + 1) % demo.queue.length;
    demo.positionMs = 0;
    demo.playing = true;
    demoState();
    demoEmit('lyric', { index: 0, line: '', lyrics: demoLyrics() });
  }

  function demoCall(action, payload) {
    var D = window.NGNL_DEMO || { songs: [], playlists: [], favorites: [], daily: [], fm: [] };
    function ok(data) { return new Promise(function (r) { setTimeout(function () { r(data || {}); }, 90); }); }
    switch (action) {
      case 'bootstrap':
        return ok({
          settings: D.settings, sources: D.sources, playlists: D.playlists,
          favorites: D.favorites,
          daily: { songs: D.daily, count: D.dailyCount || D.daily.length, hasNew: true },
          fm: { song: D.fm[0] || null, playing: false, queue: D.fm.slice(1) },
          player: { song: D.songs[6] || null, index: 0, playing: false, positionMs: 0,
            durationMs: (D.songs[6] ? D.songs[6].duration : 0) * 1000, mode: 'listLoop', queue: D.daily },
          liked: Object.keys(demo.liked)
        });
      case 'home.refresh':
        return ok({
          daily: { songs: D.daily, count: D.dailyCount || D.daily.length, hasNew: true },
          playlists: D.playlists, favorites: D.favorites,
          fm: { song: demo.queue[demo.index] || D.fm[0] || null, playing: demo.playing, queue: D.fm.slice(1) },
          sources: D.sources
        });
      case 'playlists':
        return ok({ items: D.playlists, favorites: D.favorites });
      case 'playlist.detail':
        return ok({ name: (D.playlists.find(function (p) { return p.id === payload.id; }) || {}).name ||
            (D.playlistMeta && D.playlistMeta[payload.id] && D.playlistMeta[payload.id].name) || '歌单',
          songs: D.playlistSongs[payload.id] || D.daily });
      case 'playlist.create':
        var np = { id: 'pl-' + Date.now(), name: payload.name, count: 0, cover: '', isDefault: false };
        D.playlists.push(np); D.playlistSongs[np.id] = [];
        return ok(np);
      case 'playlist.rename':
        D.playlists.forEach(function (p) { if (p.id === payload.id) p.name = payload.name; });
        return ok({});
      case 'playlist.delete':
        D.playlists = D.playlists.filter(function (p) { return p.id !== payload.id; });
        return ok({});
      case 'playlist.add':
        if (D.playlistSongs[payload.id]) D.playlistSongs[payload.id].push(payload.song);
        return ok({});
      case 'playlist.shuffle':
        var ps = (D.playlistSongs[payload.id] || []).slice();
        demo.queue = ps.sort(function () { return Math.random() - 0.5; });
        demo.index = 0; demo.playing = true; demo.positionMs = 0;
        demoStartTimer(); demoState();
        return ok({});
      case 'search':
        var q = (payload.q || '').toLowerCase();
        return ok({
          songs: D.songs.filter(function (s) { return (s.name + s.artist).toLowerCase().indexOf(q) >= 0; }),
          playlists: D.playlists.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; }),
          source: payload.source || 'netease'
        });
      case 'daily.refresh':
        var shuffled = D.daily.slice().sort(function () { return Math.random() - 0.5; });
        return ok({ songs: shuffled, count: shuffled.length, hasNew: true });
      case 'play':
        demo.queue = (payload.songs || []).slice();
        demo.index = payload.index || 0;
        demo.playing = true;
        demo.positionMs = 0;
        demoStartTimer();
        demoState();
        demoEmit('lyric', { index: 0, line: '', lyrics: demoLyrics() });
        return ok({});
      case 'toggle':
        demo.playing = !demo.playing;
        demoStartTimer(); demoState();
        return ok({});
      case 'next':
        demoNext(false); return ok({});
      case 'prev':
        if (demo.positionMs > 3000) { demo.positionMs = 0; }
        else if (demo.queue.length) { demo.index = (demo.index - 1 + demo.queue.length) % demo.queue.length; demo.positionMs = 0; }
        demoState(); return ok({});
      case 'seek':
        demo.positionMs = payload.ms || 0;
        demoEmit('progress', { positionMs: demo.positionMs, durationMs: S.durationMs });
        return ok({});
      case 'mode.cycle':
        demo.mode = demo.mode === 'listLoop' ? 'singleLoop' : demo.mode === 'singleLoop' ? 'shuffle' : 'listLoop';
        demoState(); return ok({});
      case 'like':
        var k = payload.song && payload.song.key;
        if (k) { if (demo.liked[k]) delete demo.liked[k]; else demo.liked[k] = true; }
        demoState();
        return ok({ liked: !!demo.liked[k] });
      case 'player.queue':
        return ok({ songs: demo.queue, index: demo.index });
      case 'queue.play':
        demo.index = payload.index || 0; demo.positionMs = 0; demo.playing = true;
        demoStartTimer(); demoState(); return ok({});
      case 'queue.remove':
        if (payload.index >= 0 && payload.index < demo.queue.length) {
          demo.queue.splice(payload.index, 1);
          if (demo.index >= demo.queue.length) demo.index = demo.queue.length - 1;
        }
        demoState(); return ok({});
      case 'queue.clear':
        demo.queue = []; demo.index = -1; demo.playing = false;
        demoState(); return ok({});
      case 'player.lyrics':
        return ok({ lyrics: demoLyrics() });
      case 'fm.snapshot':
        return ok({ song: demo.queue[demo.index] || D.fm[0] || null, playing: demo.playing, queue: D.fm.slice(1) });
      case 'fm.start':
        demo.queue = D.fm.slice(); demo.index = 0; demo.playing = true; demo.positionMs = 0;
        demoStartTimer(); demoState();
        demoEmit('lyric', { index: 0, line: '', lyrics: demoLyrics() });
        return ok({ song: demo.queue[0], queue: demo.queue.slice(1), isGenerating: false });
      case 'fm.skip':
      case 'fm.dislike':
        var fmq = demo.queue.length ? demo.queue : D.fm.slice();
        demo.index = (demo.index + 1) % fmq.length;
        demo.playing = true; demo.positionMs = 0;
        demoStartTimer(); demoState();
        return ok({ song: fmq[demo.index], queue: fmq.slice(demo.index + 1), isGenerating: false });
      case 'settings.get':
        return ok({ settings: D.settings, sources: D.sources });
      case 'settings.set':
        Object.assign(D.settings, payload.patch || {});
        return ok({ settings: D.settings });
      case 'lyric.offset':
        return ok({});
      case 'download':
        return ok({});
      default:
        return ok({});
    }
  }

  /* ---------------- 启动 ---------------- */
  function fillStaticIcons() {
    var nodes = document.querySelectorAll('[data-icon]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = icon(nodes[i].dataset.icon);
    }
  }

  async function boot() {
    S.ready = false;
    S.bootError = null;
    render();
    fillStaticIcons();
    try {
      var d = await call('bootstrap', {}, 30000);
      applyBootstrap(d);
      S.ready = true;
      await route();
    } catch (e) {
      S.bootError = (e && e.message) || '原生桥无响应';
      S.ready = true;
      render();
      updateDock(true);
    }
  }

  fillStaticIcons();
  boot();
})();
