/* 网页版演示数据：浏览器直接打开 index.html 时使用；App 内 WebView 由原生桥注入真实数据。 */
(function () {
  function s(id, name, artist, album, duration) {
    return {
      id: String(id),
      source: 'netease',
      name: name,
      artist: artist,
      album: album || '',
      cover: '',
      duration: duration || 0,
      bitrate: 320,
      key: 'netease|' + id
    };
  }

  var songs = [
    s(101, '夜航西飞', '陈鸿宇', '与荒野', 268),
    s(102, '雨落长街', '房东的猫', '春生', 214),
    s(103, '晚风告白', '颜人中', '晚安', 236),
    s(104, '灯塔与船', '刘昊霖', '鱼干铺里', 245),
    s(105, '雾中列车', '朴树', '猎户星座', 302),
    s(106, '缓慢降落', '郭顶', '飞行器的执行周期', 279),
    s(107, '光年之外的信', '岑宁儿', 'Nothing is Under Control', 251),
    s(108, '午后三点', '万能青年旅店', '冀西南林路行', 341),
    s(109, '海岸线', '李志', '1701', 288),
    s(110, '旧磁带', '落日飞车', 'Cassa Nova', 232),
    s(111, '星河入梦', '房东的猫', '柔软', 224),
    s(112, '风起时', '毛不易', '小王', 259),
    s(113, '城市褶皱', '草东没有派对', '丑奴儿', 246),
    s(114, '半醒', '陈粒', '洄游', 233),
    s(115, '盐和光', 'deca joins', '浴室', 271),
    s(116, '无人接听', '告五人', '我肯定在几百年前就说过爱你', 262),
    s(117, '海边的房间', '王喂马', '海边的房间', 238),
    s(118, '低空飞行', '声音玩具', '劳动公园', 315),
    s(119, '琥珀', '文雀', '迷路记', 287),
    s(120, '月光旅人', '鲸鱼马戏团', '鲸鱼马戏团', 354)
  ];

  var playlists = [
    { id: 'pl-1', name: '深夜慢行', count: 24, cover: '', isDefault: true },
    { id: 'pl-2', name: '通勤电波', count: 18, cover: '', isDefault: false },
    { id: 'pl-3', name: '午后独处', count: 31, cover: '', isDefault: false },
    { id: 'pl-4', name: '公路与海', count: 12, cover: '', isDefault: false }
  ];

  window.NGNL_DEMO = {
    songs: songs,
    playlists: playlists,
    favorites: songs.slice(0, 6),
    daily: songs.slice(0, 12),
    fm: songs.slice(6, 12),
    playlistSongs: {
      'pl-1': songs.slice(0, 8),
      'pl-2': songs.slice(4, 12),
      'pl-3': songs.slice(8, 16),
      'pl-4': songs.slice(12, 20)
    },
    settings: {
      playQuality: 'exhigh',
      downloadQuality: 'lossless',
      fetchStrategy: 'balanced',
      strictMode: false,
      downloadDir: '/storage/emulated/0/Music/珍珠唱机',
      downloadConcurrency: 1,
      sources: ['netease', 'kuwo', 'qq'],
      priority: ['netease', 'kuwo', 'qq'],
      commonSources: ['netease', 'kuwo'],
      allSources: ['netease', 'kuwo', 'qq', 'kugou', 'migu', 'bilibili'],
      extSourceNames: {}
    },
    sources: [
      { name: 'netease', desc: '网易云音乐', common: true },
      { name: 'kuwo', desc: '酷我音乐', common: true },
      { name: 'qq', desc: 'QQ 音乐', common: true }
    ]
  };
})();
