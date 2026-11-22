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
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.3"/><path d="M12 7.4V12l3 1.8"/></svg>'
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
      if (S.route.name === 'fm') syncFmNow();
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
      if (S.route.name === 'player') {
        var box = $('lyricsBox');
        var domCount = box ? box.querySelectorAll('.lyric-line').length : 0;
        if (Array.isArray(l.lyrics) && S.lyrics.length && domCount !== S.lyrics.length) {
          render();
        } else {
          syncLyrics();
        }
      }
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

  function isCurrent(song) {
    return !!(song && S.song && song.key && S.song.key === song.key);
  }

  function songRow(song, i, listName, opts) {
    opts = opts || {};
    var cur = isCurrent(song);
    var lead = cur
      ? '<span class="playmark">' + icon(S.playing ? 'wave' : 'play') + '</span>'
      : '<span class="idx">' + pad(i + 1) + '</span>';
    return '<button class="srow' + (cur ? ' now' : '') + '" data-act="play-song" data-list="' + esc(listName) + '" data-index="' + i + '">' +
      lead + art(song) +
      '<span class="meta"><span class="t">' + esc(song.name) + '</span>' +
      '<span class="s">' + esc(song.artist) + (song.album ? ' · ' + esc(song.album) : '') + '</span></span>' +
      (opts.trailing || ('<span class="dur">' + (song.duration ? fmt(song.duration) : '--:--') + '</span>')) +
      '</button>';
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

  /* ---------------- 页面 ---------------- */
  function pageHome() {
    var daily = S.daily || { songs: [], count: 0 };
    var songs = daily.songs || [];
    var fm = S.fm || { song: null, playing: false };
    var hour = new Date().getHours();
    var hi = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
    S.lists.daily = songs;

    var fmSub = fm.song ? (fm.song.artist || '') : '为你挑选不间断的下一首';
    var fmTitle = fm.song ? fm.song.name : '私人 FM';
    var dailySub = songs.length ? (songs[0].name + ' · ' + songs[0].artist) : '今日推荐生成中';

    return '<section class="page home">' +
      '<div class="greeting">' + hi + '<span>' + todayStr() + ' · 珍珠唱机</span></div>' +
      '<div class="home-main">' +
        '<div class="home-left">' +
          '<div class="feature daily" style="--h:30" data-act="route" data-route="daily" role="button" tabindex="0">' +
            '<span class="tag">DAILY MIX</span>' +
            '<div class="big">' + (songs.length || 0) + '<small>首</small></div>' +
            '<div class="sub">' + esc(dailySub) + '</div>' +
            '<span class="go">' + icon('play') + '</span>' +
          '</div>' +
          '<div class="feature fm" style="--h:190" data-act="fm-open" role="button" tabindex="0">' +
            (fm.playing ? '<span class="onair"><i></i>ON AIR</span>' : '') +
            '<span class="tag">PRIVATE FM</span>' +
            '<div class="big" style="font-size:19px">' + esc(fmTitle) + '</div>' +
            '<div class="sub">' + esc(fmSub) + '</div>' +
            '<span class="go" data-act="fm-play">' + icon('play') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="home-right">' +
          secHead('今日为你', '每日推荐', '全部', 'daily') +
          (songs.length
            ? '<div class="songlist">' + songs.slice(0, 6).map(function (s, i) { return songRow(s, i, 'daily'); }).join('') + '</div>'
            : emptyState('sparkle', '今日推荐还在路上', '稍后回来，或点下面重新生成', '重新生成', 'daily-refresh')) +
        '</div>' +
      '</div>' +
      secHead('我的歌单', (S.playlists.length || 0) + ' 个', '管理', 'playlists') +
      '<div class="rail">' + (S.playlists.length
        ? S.playlists.map(plCard).join('')
        : '<div class="empty" style="flex:1"><span>还没有本地歌单</span></div>') + '</div>' +
      '</section>';
  }

  function pagePlaylists() {
    var pls = S.playlists || [];
    var favs = S.favorites || [];
    return '<section class="page">' +
      '<div class="greeting">我的歌单<span>' + pls.length + ' 个歌单 · ' + favs.length + ' 首喜欢</span></div>' +
      secHead('我喜欢的音乐', favs.length + ' 首', '播放全部', 'play-favorites') +
      (favs.length
        ? '<div class="songlist">' + favs.slice(0, 6).map(function (s, i) { return songRow(s, i, 'favorites'); }).join('') + '</div>'
        : emptyState('heart', '还没有喜欢的歌', '在播放页点红心，会收进这里')) +
      secHead('自建歌单', String(pls.length), null, null) +
      '<div class="plgrid">' +
        pls.map(plCard).join('') +
        '<button class="pcard" data-act="playlist-create"><div class="newpl">' + icon('plus') + '新建歌单</div>' +
        '<span class="t">新建歌单</span><span class="s">整理你的收藏</span></button>' +
      '</div>' +
      '</section>';
  }

  function pagePlaylist() {
    var pl = S.playlist;
    if (!pl) return '<section class="page"><div class="loading-pad">' + skeletonList() + '</div></section>';
    var songs = pl.songs || [];
    S.lists.playlist = songs;
    return '<section class="page">' +
      '<div class="plhead" style="--h:' + hueOf(pl.name) + '">' +
        art({ name: pl.name, cover: pl.cover || '' }) +
        '<div class="info"><div class="eb">PLAYLIST</div>' +
          '<div class="t">' + esc(pl.name) + '</div>' +
          '<div class="s">' + songs.length + ' 首歌曲</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin:0 0 8px">' +
        '<button class="btn" data-act="play-list" data-list="playlist">' + icon('play') + ' 播放全部</button>' +
        '<button class="btn ghost" data-act="playlist-shuffle" data-id="' + esc(pl.id) + '">随机播放</button>' +
        '<button class="iconbtn" style="margin-left:auto" data-act="playlist-menu" data-id="' + esc(pl.id) + '" aria-label="更多">' + icon('more') + '</button>' +
      '</div>' +
      (songs.length
        ? '<div class="songlist">' + songs.map(function (s, i) { return songRow(s, i, 'playlist'); }).join('') + '</div>'
        : emptyState('playlist', '歌单还是空的', '去搜索里加几首歌进来')) +
      '</section>';
  }

  function pageSearch() {
    var st = S.search;
    var srcChips = (S.sources || []).slice(0, 6).map(function (s) {
      var on = (st.source || '') === s.name;
      return '<button class="chip' + (on ? ' on' : '') + '" data-act="search-source" data-source="' + esc(s.name) + '">' +
        esc(s.desc || s.name) + '</button>';
    }).join('');
    var body;
    if (!st.q) {
      body = emptyState('search', '想听什么？', '在上方输入歌曲、歌手或歌单名');
    } else if (st.loading) {
      body = skeletonList();
    } else if (st.tab === 'playlists') {
      body = st.playlists && st.playlists.length
        ? '<div class="plgrid">' + st.playlists.map(function (p) {
            return '<button class="pcard" data-act="open-remote-playlist" data-id="' + esc(p.id) + '" data-source="' + esc(p.source) + '">' +
              art(p, '', '<span class="cnt">' + (p.trackCount || 0) + ' 首</span>') +
              '<span class="t">' + esc(p.name) + '</span><span class="s">' + esc(p.creator || p.source) + '</span></button>';
          }).join('') + '</div>'
        : emptyState('search', '没有找到歌单', '换个关键词试试');
    } else {
      body = st.songs && st.songs.length
        ? '<div class="songlist">' + st.songs.map(function (s, i) { return songRow(s, i, 'search'); }).join('') + '</div>'
        : emptyState('search', '没有找到歌曲', '换个关键词，或切换来源试试');
    }
    return '<section class="page">' +
      '<div class="searchhead"><div class="q">' + (st.q ? '“' + esc(st.q) + '”' : '搜索') + '</div>' +
        '<div class="n">' + (st.q && !st.loading ? (st.tab === 'songs' ? (st.songs.length + ' 首') : (st.playlists.length + ' 个歌单')) : '') + '</div></div>' +
      '<div class="chips">' + srcChips + '</div>' +
      (st.q ? '<div class="tabsline">' +
        '<button class="' + (st.tab === 'songs' ? 'on' : '') + '" data-act="search-tab" data-tab="songs">歌曲</button>' +
        '<button class="' + (st.tab === 'playlists' ? 'on' : '') + '" data-act="search-tab" data-tab="playlists">歌单</button>' +
        '</div>' : '') +
      body + '</section>';
  }

  function pageDaily() {
    var d = S.daily || { songs: [], count: 0 };
    var songs = d.songs || [];
    S.lists.daily = songs;
    return '<section class="page">' +
      '<div class="dailyhero">' +
        '<div class="num">' + (songs.length || 0) + '</div>' +
        '<div class="txt"><div class="eb">DAILY RECOMMEND</div>' +
          '<div class="t">每日推荐</div>' +
          '<div class="s">根据最近的收听口味生成 · ' + todayStr() + '</div></div>' +
        '<div class="acts">' +
          '<button class="iconbtn" data-act="daily-refresh" aria-label="重新生成">' + icon('repeat') + '</button>' +
          '<button class="play" data-act="play-list" data-list="daily" aria-label="播放">' + icon('play') + '</button>' +
        '</div>' +
      '</div>' +
      (songs.length
        ? '<div class="songlist" style="margin-top:10px">' + songs.map(function (s, i) { return songRow(s, i, 'daily'); }).join('') + '</div>'
        : emptyState('sparkle', '今天还没有推荐', '点右上角重新生成一份', '重新生成', 'daily-refresh')) +
      '</section>';
  }

  function pageFm() {
    var fm = S.fm || { song: null, queue: [] };
    var cur = fm.song || S.song;
    var queue = (fm.queue || []).filter(function (s) { return !cur || s.key !== cur.key; });
    S.lists.fm = cur ? [cur].concat(queue) : queue;
    var stage;
    if (!cur) {
      stage = '<div class="fmstage"><div class="fm-disc"><div class="disc"><div class="art" style="--h:190"><span class="art-fb">FM</span></div><span class="hole"></span></div></div>' +
        '<div class="fm-info"><div class="meta"><div class="t">私人 FM</div><div class="s">开启后按你的口味连续播放</div></div>' +
        '<button class="btn accent" data-act="fm-play">开始收听</button></div></div>';
    } else {
      stage = '<div class="fmstage" style="--h:' + hueOf(cur.name) + '">' +
        '<div class="fm-disc"><div class="disc' + (S.playing ? ' spin' : '') + '">' + art(cur) + '<span class="hole"></span></div></div>' +
        '<div class="fm-info">' +
          '<div class="meta"><div class="t">' + esc(cur.name) + '</div>' +
            '<div class="s">' + esc(cur.artist) + '</div></div>' +
          '<div class="acts">' +
            '<button class="fmbtn dis" data-act="fm-dislike" aria-label="不喜欢">' + icon('close') + '</button>' +
            '<button class="fmbtn main" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
            '<button class="fmbtn" data-act="fm-skip" aria-label="跳过">' + icon('next') + '</button>' +
          '</div>' +
          '<div class="hin">' + (fm.isGenerating ? '正在生成下一批…' : '不喜欢会减少同类推荐') + '</div>' +
        '</div>' +
        '</div>';
    }
    return '<section class="page">' + stage +
      (queue.length ? secHead('接下来', queue.length + ' 首') +
        '<div class="songlist fmqueue">' + queue.slice(0, 8).map(function (s, i) { return songRow(s, i + (cur ? 1 : 0), 'fm'); }).join('') + '</div>'
        : '') +
      '</section>';
  }

  function pageQueue() {
    var q = S.queue || [];
    return '<section class="page">' +
      '<div class="qhead"><b>播放队列</b><span class="n">' + q.length + ' 首</span>' +
        '<div class="acts">' +
          '<button class="iconbtn" data-act="queue-clear" aria-label="清空">' + icon('trash') + '</button>' +
        '</div></div>' +
      (q.length ? '<div class="songlist">' + q.map(function (s, i) {
        var cur = i === S.index;
        return '<div class="srow' + (cur ? ' now' : '') + '" data-act="queue-play" data-index="' + i + '" role="button" tabindex="0">' +
          '<span class="idx">' + (cur ? icon('wave') : pad(i + 1)) + '</span>' + art(s) +
          '<span class="meta"><span class="t">' + esc(s.name) + '</span><span class="s">' + esc(s.artist) + '</span></span>' +
          '<button class="iconbtn" style="width:30px;height:30px;border:0;background:none" data-act="queue-remove" data-index="' + i + '" aria-label="移除">' + icon('close') + '</button>' +
          '</div>';
      }).join('') + '</div>' : emptyState('queue', '队列是空的', '选一首歌开始播放')) +
      '</section>';
  }

  function pageSettings() {
    var st = S.settings || {};
    var qualities = [['standard', '标准'], ['high', '较高'], ['exhigh', '极高'], ['lossless', '无损']];
    function seg(cur, opts, act) {
      return '<div class="seg">' + opts.map(function (o) {
        return '<button class="' + (cur === o[0] ? 'on' : '') + '" data-act="' + act + '" data-value="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    }
    var srcNames = (S.sources || []).map(function (s) { return s.desc || s.name; }).join('、') || '内置源';
    return '<section class="page">' +
      '<div class="greeting">设置<span>播放与下载偏好</span></div>' +
      '<div class="setgroup"><div class="gh">播放</div>' +
        '<div class="setrow"><div class="lb"><b>在线播放音质</b><span>换源时优先按此档请求</span></div>' +
          seg(st.playQuality, qualities, 'set-play-quality') + '</div>' +
        '<div class="setrow"><div class="lb"><b>播放模式</b><span>' + modeLabel(S.mode) + '</span></div>' +
          '<button class="btn ghost sm" data-act="mode-cycle">切换</button></div>' +
      '</div>' +
      '<div class="setgroup"><div class="gh">下载</div>' +
        '<div class="setrow"><div class="lb"><b>下载音质</b><span>离线文件保存档位</span></div>' +
          seg(st.downloadQuality, qualities, 'set-download-quality') + '</div>' +
        '<div class="setrow"><div class="lb"><b>下载目录</b><span>' + esc(st.downloadDir || '默认目录') + '</span></div></div>' +
        '<div class="setrow"><div class="lb"><b>同时下载数</b><span>1 到 3 之间</span></div>' +
          '<div class="seg">' + [1, 2, 3].map(function (n) {
            return '<button class="' + ((st.downloadConcurrency || 1) === n ? 'on' : '') + '" data-act="set-concurrency" data-value="' + n + '">' + n + '</button>';
          }).join('') + '</div></div>' +
      '</div>' +
      '<div class="setgroup"><div class="gh">音源</div>' +
        '<div class="setrow"><div class="lb"><b>可用音源</b><span>' + esc(srcNames) + '</span></div></div>' +
        '<div class="setrow"><div class="lb"><b>换源策略</b><span>播放失败时自动尝试其它来源</span></div>' +
          seg(st.fetchStrategy, [['fast', '响应优先'], ['balanced', '均衡'], ['quality', '品质优先']], 'set-strategy') + '</div>' +
      '</div>' +
      '<div class="setgroup"><div class="gh">歌词</div>' +
        '<div class="setrow"><div class="lb"><b>歌词偏移</b><span>播放页歌词相对音频的时间修正</span></div>' +
          '<div class="seg">' +
            '<button data-act="lyric-offset" data-value="-200">-0.2s</button>' +
            '<button data-act="lyric-offset" data-value="200">+0.2s</button>' +
            '<button data-act="lyric-offset" data-value="reset">归零</button>' +
          '</div></div>' +
      '</div>' +
      '<div class="setgroup"><div class="gh">关于</div>' +
        '<div class="setrow"><div class="lb"><b>珍珠唱机 · HTML 界面版</b><span>界面由 WebView 承载，音频与媒体通知仍由原生播放器负责</span></div></div>' +
        '<div class="setrow"><div class="lb"><b>运行模式</b><span>' + (S.connected ? 'App 内 WebView（原生桥）' : '浏览器演示（内置示例数据）') + '</span></div></div>' +
      '</div>' +
      '</section>';
  }

  function pagePlayer() {
    var s = S.song;
    if (!s) {
      return '<section class="player"><div class="pl-bg"></div>' +
        '<header class="pl-head"><button class="iconbtn" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<div class="eb">NOW PLAYING</div><span style="width:38px"></span></header>' +
        '<div style="position:relative;z-index:4;flex:1;display:grid;place-items:center;padding:20px">' +
        emptyState('disc', '还没有在播放的歌', '从首页或歌单里选一首') + '</div></section>';
    }
    var liked = !!S.liked[s.key];
    var modeIcon = S.mode === 'shuffle' ? 'shuffle' : S.mode === 'singleLoop' ? 'repeatOne' : 'repeat';
    var ly = S.lyrics && S.lyrics.length
      ? S.lyrics.map(function (l, i) {
          return '<div class="lyric-line' + (i === S.lyricIndex ? ' on' : '') + '" data-act="seek-lyric" data-ms="' + (l[0] || 0) + '">' + esc(l[1] || '') + '</div>';
        }).join('')
      : '<div class="no-lyric">' + (S.loading ? '正在加载歌词…' : '暂无歌词') + '</div>';

    return '<section class="player">' +
      '<div class="pl-bg">' + art(s) + '</div>' +
      '<header class="pl-head">' +
        '<button class="iconbtn" data-act="back" aria-label="返回">' + icon('chevronLeft') + '</button>' +
        '<div class="eb">NOW PLAYING</div>' +
        '<button class="iconbtn" data-act="route" data-route="queue" aria-label="队列">' + icon('queue') + '</button>' +
      '</header>' +
      '<div class="pl-body">' +
        '<div class="pl-left">' +
          '<div class="turntable">' +
            '<div class="disc' + (S.playing ? ' spin' : '') + '">' + art(s) + '<span class="hole"></span></div>' +
            '<div class="arm' + (S.playing ? ' on' : '') + '">' +
              '<svg viewBox="0 0 100 120" aria-hidden="true">' +
                '<circle cx="86" cy="16" r="10" fill="#241f1c" stroke="rgba(255,255,255,.24)" stroke-width="1.6"/>' +
                '<rect x="80.4" y="18" width="11" height="82" rx="5.5" fill="url(#armG)"/>' +
                '<circle cx="86" cy="101" r="5.5" fill="#f3c18e"/>' +
                '<defs><linearGradient id="armG" x1="1" y1="0" x2="0" y2="1">' +
                  '<stop offset="0" stop-color="#e6e0d8"/><stop offset=".55" stop-color="#a49b90"/><stop offset="1" stop-color="#6b635a"/>' +
                '</linearGradient></defs>' +
              '</svg>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pl-right">' +
          '<div class="pl-meta"><div class="t">' + esc(s.name) + '</div>' +
            '<div class="s">' + esc(s.artist) + (s.album ? ' · ' + esc(s.album) : '') + '</div></div>' +
          '<div class="pl-lyrics" id="lyricsBox">' + ly + '</div>' +
          '<div class="pl-seek">' +
            '<div class="seekbar" id="seekbar"><div class="track"><i id="seekFill" style="width:0%"></i></div>' +
              '<input id="seekInput" type="range" min="0" max="1000" value="0" step="1" aria-label="进度"></div>' +
            '<div class="pl-time"><span id="posLabel">0:00</span><span id="durLabel">0:00</span></div>' +
          '</div>' +
          '<div class="pl-controls">' +
            '<button class="cb" data-act="mode-cycle" aria-label="播放模式">' + icon(modeIcon) + '</button>' +
            '<button class="cb" data-act="prev" aria-label="上一首">' + icon('prev') + '</button>' +
            '<button class="main" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
            '<button class="cb" data-act="next" aria-label="下一首">' + icon('next') + '</button>' +
            '<button class="cb' + (liked ? ' liked' : '') + '" data-act="like" aria-label="喜欢">' + icon(liked ? 'heartFill' : 'heart') + '</button>' +
          '</div>' +
          '<div class="pl-foot">' +
            '<button data-act="add-to-playlist">加入歌单</button>' +
            '<button data-act="download">下载</button>' +
            '<button data-act="route" data-route="queue">队列 ' + (S.queue.length || 0) + '</button>' +
          '</div>' +
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
    if (!S.ready) { view.innerHTML = bootScreen(); updateDock(true); return; }
    if (S.route.name === 'player') {
      view.innerHTML = pagePlayer();
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
    if (S.route.name === 'player') { dockEl.classList.add('hidden'); return; }
    dockEl.classList.remove('hidden');
    var key = (S.song && S.song.key || 'none') + '|' + S.route.name + '|' + S.playing;
    if (!force && S._dockSongKey === key) { updateMiniProgress(); return; }
    S._dockSongKey = key;
    var tabs = navItems().map(function (t) {
      return '<button class="tab' + (S.route.name === t[0] ? ' on' : '') + '" data-act="route" data-route="' + t[0] + '">' +
        icon(t[2]) + '<span>' + t[1] + '</span></button>';
    }).join('');
    var mini;
    if (S.song) {
      mini = '<div class="mini" data-act="route" data-route="player">' + art(S.song) +
        '<div class="meta"><div class="t">' + esc(S.song.name) + '</div>' +
        '<div class="s">' + esc(S.song.artist) + '</div></div>' +
        '<div class="l1"><i id="miniFill" style="width:0%"></i></div>' +
        '<button class="mb play" data-act="toggle" aria-label="播放/暂停">' + icon(S.playing ? 'pause' : 'play') + '</button>' +
        '<button class="mb" data-act="next" aria-label="下一首">' + icon('next') + '</button></div>';
    } else {
      mini = '<div class="mini idle" data-act="route" data-route="player">' +
        '<div class="art" style="--h:30"><span class="art-fb">♪</span></div>' +
        '<div class="meta"><div class="t">还没有在播放</div><div class="s">选一首歌开始</div></div>' +
        '<button class="mb play" data-act="goto-daily" aria-label="每日推荐">' + icon('play') + '</button></div>';
    }
    dockEl.innerHTML = mini + '<div class="tabsnav">' + tabs + '</div>';
    updateMiniProgress();
  }

  function updateMiniProgress() {
    var fill = $('miniFill');
    if (!fill) return;
    var total = S.durationMs || 0;
    fill.style.width = total > 0 ? Math.min(100, (S.positionMs / total) * 100) + '%' : '0%';
  }

  function syncProgress() {
    var fill = $('seekFill');
    var pos = $('posLabel');
    var dur = $('durLabel');
    var input = $('seekInput');
    if (fill) {
      var total = S.durationMs || 0;
      fill.style.width = total > 0 ? Math.min(100, (S.positionMs / total) * 100) + '%' : '0%';
    }
    if (pos) pos.textContent = fmtMs(S.positionMs);
    if (dur) dur.textContent = fmtMs(S.durationMs);
    if (input && !input.__dragging) {
      input.value = S.durationMs > 0 ? Math.round((S.positionMs / S.durationMs) * 1000) : 0;
    }
    updateMiniProgress();
  }

  function syncLyrics(force) {
    var box = $('lyricsBox');
    if (!box) return;
    var lines = box.querySelectorAll('.lyric-line');
    if (!lines.length) return;
    for (var i = 0; i < lines.length; i++) {
      lines[i].classList.toggle('on', i === S.lyricIndex);
    }
    if (S.lyricIndex >= 0 && lines[S.lyricIndex] && (force || S._lastLyricIndex !== S.lyricIndex)) {
      S._lastLyricIndex = S.lyricIndex;
      var el = lines[S.lyricIndex];
      var top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
      box.scrollTo({ top: Math.max(0, top), behavior: force ? 'auto' : 'smooth' });
    }
  }

  function syncPlayer() {
    var box = $('lyricsBox');
    if (!box) return;
    var btn = document.querySelector('.pl-controls .main');
    if (btn) btn.innerHTML = icon(S.playing ? 'pause' : 'play');
    var disc = document.querySelector('.turntable .disc');
    if (disc) disc.classList.toggle('spin', S.playing);
    var arm = document.querySelector('.turntable .arm');
    if (arm) arm.classList.toggle('on', S.playing);
    var like = document.querySelector('.pl-controls .cb.liked, .pl-controls .cb[data-act="like"]');
    if (like && S.song) {
      var isLiked = !!S.liked[S.song.key];
      like.classList.toggle('liked', isLiked);
      like.innerHTML = icon(isLiked ? 'heartFill' : 'heart');
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
    if (e.target.id !== 'seekInput') return;
    var input = e.target;
    input.__dragging = true;
    var bar = $('seekbar');
    if (bar) bar.classList.add('active');
    var ratio = Number(input.value) / 1000;
    var fill = $('seekFill');
    if (fill) fill.style.width = (ratio * 100) + '%';
    var pos = $('posLabel');
    if (pos) pos.textContent = fmtMs(ratio * S.durationMs);
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'seekInput') return;
    var input = e.target;
    input.__dragging = false;
    var bar = $('seekbar');
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
          daily: { songs: D.daily, count: D.daily.length, hasNew: true },
          fm: { song: D.fm[0] || null, playing: false, queue: D.fm.slice(1) },
          player: { song: null, index: -1, playing: false, positionMs: 0, durationMs: 0, mode: 'listLoop', queue: [] },
          liked: Object.keys(demo.liked)
        });
      case 'home.refresh':
        return ok({
          daily: { songs: D.daily, count: D.daily.length, hasNew: true },
          playlists: D.playlists, favorites: D.favorites,
          fm: { song: demo.queue[demo.index] || D.fm[0] || null, playing: demo.playing, queue: D.fm.slice(1) },
          sources: D.sources
        });
      case 'playlists':
        return ok({ items: D.playlists, favorites: D.favorites });
      case 'playlist.detail':
        return ok({ name: (D.playlists.find(function (p) { return p.id === payload.id; }) || {}).name || '歌单',
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
