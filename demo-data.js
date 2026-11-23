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
    s(101, 'Super Star', 'S.H.E', '2013年 快乐2世代', 219),
    s(102, '一个人', '普沛腾', '终极一班', 241),
    s(103, '七秒钟的记忆', '徐良 & 孙羽幽', '七秒钟的记忆', 233),
    s(104, '不只是朋友', '李玖哲', '不，完美', 256),
    s(105, '你要的爱', '戴佩妮', '怎样', 248),
    s(106, '匿名的好友', '杨宗纬', '原色', 262),
    s(107, 'Always Online', '林俊杰', 'JJ陆', 212),
    s(108, '后会无期', '汪苏泷', '万有引力', 236),
    s(109, '海岸线', '李志', '1701', 288),
    s(110, '旧磁带', '落日飞车', 'Cassa Nova', 232),
    s(111, '星河入梦', '房东的猫', '柔软', 224),
    s(112, '风起时', '毛不易', '小王', 259),
    s(113, 'Love Story', 'Taylor Swift', 'Fearless', 235),
    s(114, 'A Thousand Miles', 'Vanessa Carlton', 'Be Not Nobody', 237),
    s(115, 'Always Remember Us This Way', 'Lady Gaga', 'A Star Is Born', 210),
    s(116, 'Call Me Maybe', 'Carly Rae Jepsen', 'Kiss', 193),
    s(117, 'Havana', 'Camila Cabello', 'Camila', 217),
    s(118, 'Attention', 'Charlie Puth', 'Voicenotes', 211),
    s(119, 'Viva La Vida', 'Coldplay', 'Viva la Vida', 242),
    s(120, 'Shape of You', 'Ed Sheeran', 'Divide', 233)
  ];
  songs.forEach(function (x, i) {
    if (i >= 1 && i <= 7) {
      x.source = 'kuwo';
      x.bitrate = 0;
      x.key = 'kuwo|' + x.id;
    }
  });
  songs[0].source = 'netease'; songs[0].bitrate = 320;
  var pics = ['img/card-daily.jpg', 'img/card-rec1.jpg', 'img/card-rec3.jpg', 'img/card-rec2.jpg', 'img/card-rec1.jpg'];
  songs.forEach(function (s, i) { if (i < 5) s.cover = pics[i]; });

  var fmSong = {
    id: 'fm-1', source: 'netease', name: 'In the Meadow',
    artist: 'Brian Cran', album: 'Piano and Light',
    cover: 'img/card-fm.jpg', duration: 173, bitrate: 320, key: 'netease|fm-1'
  };

  var playlists = [
    { id: 'pl-1', name: '我喜欢的音乐', count: 6, cover: '', isDefault: true }
  ];
  var playlistMeta = { 'pl-empty': { name: '我喜欢的音乐' } };

  window.NGNL_DEMO = {
    songs: songs,
    playlists: playlists,
    playlistMeta: playlistMeta,
    favorites: songs.slice(0, 6),
    daily: songs.slice(0, 12),
    dailyCount: 30,
    fm: [fmSong].concat(songs.slice(6, 11)),
    playlistSongs: {
      'pl-1': songs.slice(0, 6),
      'pl-2': songs.slice(4, 8),
      'pl-3': songs.slice(6, 12),
      'pl-4': songs.slice(0, 8),
      'pl-empty': []
    },
    settings: {
      playQuality: 'exhigh',
      downloadQuality: 'lossless',
      fetchStrategy: 'balanced',
      strictMode: false,
      downloadDir: '/storage/emulated/0/Music/珍珠唱机',
      downloadConcurrency: 1,
      sources: ['netease', 'kuwo', 'qq'],
      priority: ['kuwo', 'netease', 'qq', 'kugou'],
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
