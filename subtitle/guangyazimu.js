// @ts-check
/**
 * 光鸭字幕 ForwardWidget 字幕模块
 * 站点：https://api.guangyapan.com
 * 功能：通过光鸭云盘 API 自动搜索匹配字幕，支持指纹匹配和番号识别
 */

/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: 'guangyasub',
  title: '光鸭字幕',
  version: '1.4.0',
  requiredVersion: '0.0.1',
  description: '光鸭云盘字幕库。自动从影片信息提取番号/关键词搜索匹配字幕，支持指纹匹配、文件名匹配，智能排序。',
  author: 'Minis',
  site: 'https://api.guangyapan.com',
  detailCacheDuration: 3600,
  modules: [
    {
      id: 'loadSubtitle',
      title: '加载字幕',
      functionName: 'loadSubtitle',
      type: 'subtitle',
      params: [],
    },
  ],
};

var API_BASE = 'https://api.guangyapan.com';

function getText(value) {
  return String(value || '').trim();
}

function langTag(langStr) {
  if (!langStr) return '【其他】';
  var t = String(langStr).toLowerCase();
  if (t.includes('双语') || t.includes('中英')) return '【双语】';
  if (t.includes('简') || t.includes('chs') || t.includes('zho') || t.includes('chi')) return '【简中】';
  if (t.includes('繁') || t.includes('cht')) return '【繁中】';
  if (t.includes('英') || t.includes('eng')) return '【英文】';
  return '【字幕】';
}

// 从多个值中取第一个有效数字
function firstNumber() {
  for (var i = 0; i < arguments.length; i++) {
    var n = Number(arguments[i]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

// 解析多种时长格式 → 秒数
function parseDuration(value) {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  var text = getText(value);
  if (!text) return 0;
  // 纯数字（秒）
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  // HH:MM:SS 或 MM:SS
  var hms = text.match(/(?:(\d+):)?(\d{1,2}):(\d{2})/);
  if (hms) return (Number(hms[1] || 0) * 3600) + (Number(hms[2]) * 60) + Number(hms[3]);
  // 中文 X小时X分X秒
  var zh = text.match(/(\d+)\s*小时(?:\s*(\d+)\s*分)?(?:\s*(\d+)\s*秒)?/);
  if (zh) return (Number(zh[1]) * 3600) + (Number(zh[2] || 0) * 60) + Number(zh[3] || 0);
  return 0;
}

// 秒数 → 友好格式 1:23:45 或 23:45
function formatDuration(seconds) {
  var n = Number(seconds) || 0;
  if (n <= 0) return '';
  var total = Math.floor(n);
  var h = Math.floor(total / 3600);
  var m = Math.floor((total % 3600) / 60);
  var s = total % 60;
  if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// 从文件名推断扩展名
function getExt(name) {
  if (!name) return '';
  var s = String(name).toLowerCase();
  if (s.endsWith('.srt')) return '.srt';
  if (s.endsWith('.ass')) return '.ass';
  if (s.endsWith('.ssa')) return '.ssa';
  return '';
}

// 检测哈希值文件名（不直接展示给用户）
function isHashName(name) {
  var s = getText(name).replace(/\.[a-z0-9]{2,4}$/i, '');
  return s.length >= 32 && /^[a-fA-F0-9\-]+$/.test(s);
}

// 智能番号提取
function extractAvCode(text) {
  var s = getText(text)
    .toUpperCase()
    .replace(/[._]/g, '-')
    .replace(/\s+/g, '')
    .trim();
  if (!s) return '';

  var patterns = [
    /\bFC2[-]?PPV[-]?\d{5,8}\b/i,
    /\bFC2[-]?\d{5,8}\b/i,
    /\bCARIB[-]?\d{6,8}\b/,
    /\b1PONDO[-]?\d{6,8}\b/,
    /\bHEYZO[-]?\d{3,6}\b/,
    /\bT28[-]?\d{6,8}\b/,
    /\b[A-Z]{2,10}[-]?\d{2,8}[A-Z]?\b/,
    /\b\d{6,8}\b/,
  ];

  var candidates = [s];
  var cleaned = s
    .replace(
      /\b(UNCENSORED|LEAK|OTHER|COMPLETE|FULL|HDR|WEB|BLURAY|BDRIP|WEBDL|REMUX|X264|X265|10BIT|8BIT|HEVC|AVC|AAC|MP4|MKV|AVI|2160P|1080P|720P|480P|360P)\b/g,
      ''
    )
    .replace(/\b(?:CD\d+|PART\d+|DISC\d+|EP\s*\d+|E\s*\d+)\b/g, '')
    .replace(/\s+/g, '')
    .trim();
  if (cleaned && cleaned !== s) candidates.push(cleaned);

  for (var ci = 0; ci < candidates.length; ci++) {
    var src = candidates[ci];
    for (var pi = 0; pi < patterns.length; pi++) {
      var m = src.match(patterns[pi]);
      if (m && m[0]) {
        return m[0].replace(/[-]+/g, '-').replace(/^[-]|[-]$/g, '');
      }
    }
  }
  return '';
}

function collectSearchContext(params) {
  var rawFields = [params && params.title, params && params.seriesName, params && params.description, params && params.id, params && params.link, params && params.url]
    .map(getText).filter(Boolean);
  var titleText = getText(params && params.title || params && params.seriesName);
  var avCode = extractAvCode(titleText);
  return { titleText: titleText, avCode: avCode };
}

function buildSearchKeys(params) {
  var ctx = collectSearchContext(params);
  if (!ctx.titleText && !ctx.avCode) return [];
  var keys = [];
  if (ctx.avCode) {
    keys.push(ctx.avCode);
    keys.push(ctx.avCode.replace(/[-]/g, ''));
  } else {
    var raw = ctx.titleText.toUpperCase().replace(/[^A-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (raw.length >= 3) keys.push(raw);
  }
  var unique = [];
  var seen = {};
  for (var i = 0; i < keys.length; i++) {
    if (!seen[keys[i]]) { seen[keys[i]] = true; unique.push(keys[i]); }
  }
  return unique.filter(function(k) { return k.length >= 3; });
}

async function searchApi(key) {
  var body = JSON.stringify({
    gcid: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    duration: 8402,
    name: key + '.mp4',
  });
  try {
    var res = await Widget.http.post(API_BASE + '/misc/v1/get_subtitles', body, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ForwardWidgets/1.0.2',
      },
    });
    var text =
      typeof res === 'string'
        ? res
        : res && res.data
          ? typeof res.data === 'string'
            ? res.data
            : JSON.stringify(res.data)
          : '';
    if (!text) return [];
    var data = JSON.parse(text);
    if (data.msg !== 'success' || !data.data || !data.data.list) return [];
    return data.data.list;
  } catch (err) {
    console.warn('[guangyasub] search "' + key + '" error:', err && err.message || err);
    return [];
  }
}

function normalizeItem(raw) {
  var rawName = getText(raw.name || raw.Name || '');

  // 智能解析时长（支持秒/毫秒/HMS/中文）
  var duration = firstNumber(
    parseDuration(raw.duration),
    parseDuration(raw.Duration),
    parseDuration(raw.TimeLength),
    parseDuration(raw.time_length),
    parseDuration(raw.Length),
    parseDuration(raw.length),
  );
  // API 返回毫秒时转秒
  if (duration > 86400) duration = Math.round(duration / 1000);

  var langs = (raw.languages && raw.languages.join ? raw.languages.join(',') : '') || raw.langs || '';

  var displayName =
    rawName && !isHashName(rawName)
      ? rawName
      : raw.mt === 1
        ? '指纹匹配字幕'
        : raw.mt === 0
          ? '文件名匹配字幕'
          : raw.mt === 2
            ? '网友上传字幕'
            : '光鸭字幕';

  return {
    id: raw.url || raw.gcid || raw.cid || Math.random().toString(36).slice(2),
    name: displayName,
    _rawName: rawName,
    langs: langs,
    ext: getExt(rawName) || '.srt',
    url: getText(raw.url),
    score: Number(raw.score || 0),
    fingerprintScore: Number(raw.fingerprintf_score || 0),
    mt: Number(raw.mt || 0),
    duration: duration,
    star: raw.star || '',
  };
}

function scoreItem(item, params) {
  var ctx = collectSearchContext(params);
  var title = (ctx.titleText || '').toLowerCase();
  var text = (getText(item.name) + ' ' + getText(item.langs)).toLowerCase();
  var titleLoose = title.replace(/[-_\s.]/g, '');
  var textLoose = text.replace(/[-_\s.]/g, '');
  var score = 0;

  if (ctx.avCode) {
    var codeLoose = ctx.avCode.replace(/[-]/g, '').toLowerCase();
    var nameCode = extractAvCode(item.name);
    var nameCodeLoose = nameCode.replace(/[-]/g, '').toLowerCase();
    if (codeLoose === nameCodeLoose) score += 100000;
    if (text.includes(ctx.avCode.toLowerCase()) || textLoose.includes(codeLoose)) score += 50000;
  }

  score += Number(item.fingerprintScore || 0) * 2;
  score += Number(item.score || 0);
  if (title && (text.includes(title) || textLoose.includes(titleLoose))) score += 10000;
  if (item.duration > 0) score += 50;
  if (item.mt === 1) score += 500;
  if (item.mt === 0) score += 200;
  if (item.star === '5') score += 100;

  return score;
}

// ========== loadSubtitle ==========

async function loadSubtitle(params) {
  var searchKeys = buildSearchKeys(params);
  if (searchKeys.length === 0) return [];

  var allSubs = [];

  for (var ki = 0; ki < searchKeys.length; ki++) {
    var list = await searchApi(searchKeys[ki]);
    if (list && list.length > 0) {
      allSubs = list;
      break;
    }
  }

  if (allSubs.length === 0) return [];

  // 评分
  var scored = [];
  for (var si = 0; si < allSubs.length; si++) {
    var item = normalizeItem(allSubs[si]);
    scored.push({ item: item, score: scoreItem(item, params) });
  }

  // 按文件名去重，哈希名用 URL 去重
  var nameGroups = {};
  for (var gi = 0; gi < scored.length; gi++) {
    var entry = scored[gi];
    var dedupKey =
      entry.item._rawName && !isHashName(entry.item._rawName)
        ? entry.item._rawName
            .replace(/\(\d+\)/g, '')
            .replace(/\s*\(.*?\)\s*$/g, '')
            .trim()
        : entry.item.url;
    if (!nameGroups[dedupKey] || entry.score > nameGroups[dedupKey].score) {
      nameGroups[dedupKey] = entry;
    }
  }

  var best = [];
  for (var key in nameGroups) {
    if (nameGroups.hasOwnProperty(key)) best.push(nameGroups[key]);
  }
  best.sort(function(a, b) { return b.score - a.score; });

  var result = [];
  var existKey = {};
  var maxResultCount = 10;

  for (var ri = 0; ri < best.length && result.length < maxResultCount; ri++) {
    var entry = best[ri];
    if (!entry.item.url) continue;
    var dedupeKey = entry.item._rawName.toLowerCase() + '|' + entry.item.url;
    if (existKey[dedupeKey]) continue;
    existKey[dedupeKey] = true;

    var mtMap = { 0: '文件名匹配', 1: '指纹匹配', 2: '网友上传' };
    var mtLabel = mtMap[entry.item.mt] || '系统匹配';
    var durationText = formatDuration(entry.item.duration);

    // title 直接带上时长标签，借鉴经典剧集插件的做法
    var cleanName = entry.item.name.replace(/\.(srt|ass|ssa)$/i, '');
    var ext = getExt(entry.item.name) || entry.item.ext || '.srt';

    result.push({
      id: entry.item.id,
      title: langTag(entry.item.langs) + cleanName + ext + (durationText ? ' ' + durationText : ''),
      subTitle: [
        durationText,
        mtLabel + (entry.item.mt === 1 ? ' ✓' : ''),
      ].filter(Boolean).join(' | '),
      description: [
        '匹配度: ' + entry.score,
        entry.item.langs ? '语言: ' + entry.item.langs : '',
      ].filter(Boolean).join('\n'),
      lang: entry.item.langs || 'zh',
      duration: entry.item.duration || undefined,
      count: entry.score,
      url: entry.item.url,
    });
  }

  return result;
}
