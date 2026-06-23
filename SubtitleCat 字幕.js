// @ts-check
/**
 * SubtitleCat Forward Widget
 * 站点：https://www.subtitlecat.com/
 * 功能：自动搜索 & 手动搜索，返回 .srt 直链供播放器在线加载
 */
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: 'subtitlecat',
  title: 'SubtitleCat 字幕',
  description: 'SubtitleCat 在线字幕加载插件。搜索关键词返回 .srt 直链供播放器在线显示。',
  author: 'Minis',
  site: 'https://www.subtitlecat.com',
  version: '1.0.0',
  requiredVersion: '0.0.1',
  modules: [
    {
      id: 'loadSubtitle',
      title: '加载字幕',
      functionName: 'loadSubtitle',
      type: 'subtitle',
      params: []
    },
    {
      id: 'search',
      title: '搜索字幕',
      description: '手动搜索 SubtitleCat 站内字幕',
      functionName: 'searchSubs',
      cacheDuration: 600,
      params: [
        { name: 'keyword', title: '关键词/番号', type: 'input', value: '' }
      ]
    }
  ],
  search: {
    title: '搜索字幕',
    functionName: 'searchSubs',
    params: [
      { name: 'keyword', title: '关键词/番号', type: 'input' }
    ]
  }
};

var SITE = 'https://www.subtitlecat.com';
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
var BASE_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh-Hans;q=0.9,zh;q=0.8,en;q=0.7',
  'Referer': SITE + '/'
};

function absUrl(url) {
  if (!url) return '';
  var u = String(url).replace(/&amp;/g, '&').trim();
  if (!u) return '';
  if (u.indexOf('//') === 0) return 'https:' + u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.indexOf('/') === 0) return SITE + u;
  return SITE + '/' + u;
}

function compact(s) {
  return String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

async function fetchHtml(url, h) {
  try {
    var res = await Widget.http.get(url, { headers: Object.assign({}, BASE_HEADERS, h || {}) });
    if (!res) return '';
    return typeof res === 'string' ? res : (res.data || res.body || '');
  } catch(e) {
    return '';
  }
}

function origSrtUrl(pageUrl) {
  // subs/1510/IPZZ-807%20jp.html → subs/1510/IPZZ-807%20jp-orig.srt
  var u = String(pageUrl || '');
  if (u.indexOf('-orig.srt') >= 0) return u;
  if (/\.html$/i.test(u)) return u.replace(/\.html$/i, '-orig.srt');
  return u + '-orig.srt';
}

function langFromText(text) {
  var m = String(text || '').match(/\(translated from ([^)]+)\)/i);
  return m ? m[1] : '';
}

function getLangTag(lang) {
  var t = String(lang || '').toLowerCase();
  if (t === 'chinese' || t === 'zh' || t === 'zh-cn' || t === 'zh-tw') return '【中】';
  if (t === 'english' || t === 'en') return '【英】';
  if (t === 'japanese' || t === 'ja' || t === 'jp') return '【日】';
  if (t === 'korean' || t === 'ko' || t === 'kr') return '【韩】';
  if (t === 'vietnamese' || t === 'vi' || t === 'vn') return '【越】';
  if (t === 'russian' || t === 'ru') return '【俄】';
  if (t === 'french' || t === 'fr') return '【法】';
  if (t === 'spanish' || t === 'es') return '【西】';
  if (t === 'german' || t === 'de') return '【德】';
  if (t === 'italian' || t === 'it') return '【意】';
  if (t === 'portuguese' || t === 'pt') return '【葡】';
  if (t === 'thai' || t === 'th') return '【泰】';
  return '【字幕】';
}

function codeFromTitle(title) {
  var m = String(title || '').match(/\[([A-Z]{2,10}-?\d{2,8})\]/i) || String(title || '').match(/\b([A-Z]{2,10}-?\d{2,8}[A-Z]?)\b/i);
  return m ? m[1].toUpperCase() : '';
}

function collectKeyword(params) {
  var parts = [];
  var fields = [params && params.title, params && params.seriesName, params && params.description, params && params.id, params && params.link, params && params.url];
  for (var i = 0; i < fields.length; i++) {
    var v = compact(fields[i]);
    if (v) parts.push(v);
  }
  var raw = parts.join(' ');
  var code = codeFromTitle(raw);
  if (code) return code;
  var title = compact(params && params.title) || compact(params && params.seriesName) || '';
  return title || compact(raw);
}

// ========== 解析搜索结果表格 ==========

function parseSearchResults(html) {
  var items = [];
  var seen = {};
  // 每一行：<tr>...<td><a href="subs/...">name</a> (translated from X)</td>...<td>N downloads</td>...<td>N languages</td>...</tr>
  var re = /<tr>[\s\S]*?<td>([\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?)<\/td>[\s\S]*?<td[^>]*>[\s\S]*?([\d.]+)\s*(?:KB|MB)[\s\S]*?<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  var m;
  while ((m = re.exec(html))) {
    var link = absUrl(m[2]);
    if (!link || seen[link]) continue;
    seen[link] = true;
    var name = compact(m[3]);
    var size = compact(m[4]) + ' KB';
    var downloads = compact(m[5]).replace(/\D/g, '');
    var languages = compact(m[6]).replace(/\D/g, '');
    // 从第一个 td 完整内容提取源语言：(translated from XXX)
    var tdContent = m[1] || '';
    var langLabel = langFromText(tdContent);
    var origUrl = origSrtUrl(link);

    items.push({
      name: name,
      link: link,
      origUrl: origUrl,
      size: size,
      downloads: parseInt(downloads, 10) || 0,
      languages: parseInt(languages, 10) || 0,
      langLabel: langLabel
    });
  }
  return items;
}

// ========== loadSubtitle ==========

async function loadSubtitle(params) {
  var keyword = collectKeyword(params);
  if (!keyword || keyword.length < 2) return [];

  var html = await fetchHtml(SITE + '/index.php?search=' + encodeURIComponent(keyword));
  var results = parseSearchResults(html);

  if (results.length === 0 && /-/.test(keyword)) {
    html = await fetchHtml(SITE + '/index.php?search=' + encodeURIComponent(keyword.replace(/-/g, '')));
    results = parseSearchResults(html);
  }

  if (results.length === 0) {
    var upper = keyword.toUpperCase();
    if (upper !== keyword) {
      html = await fetchHtml(SITE + '/index.php?search=' + encodeURIComponent(upper));
      results = parseSearchResults(html);
    }
  }

  if (results.length === 0) return [];

  var result = [];
  var exist = {};
  var maxR = Math.min(results.length, 10);

  for (var i = 0; i < maxR && result.length < 10; i++) {
    var r = results[i];
    if (!r.origUrl || exist[r.origUrl]) continue;
    exist[r.origUrl] = true;

    var tag = getLangTag(r.langLabel);
    var displayName = r.name.replace(/\.(srt|ass|ssa)$/i, '');

    result.push({
      id: 'scat-' + i + '-' + Date.now(),
      title: tag + displayName + '.srt',
      subTitle: r.size + ' | ' + r.downloads + '次下载',
      description: [r.name, r.size, r.downloads + '次下载', r.langLabel ? '源语言：' + r.langLabel : ''].filter(Boolean).join('\n'),
      lang: r.langLabel || '未知',
      count: r.downloads + (r.languages * 100),
      url: r.origUrl
    });
  }

  return result;
}

// ========== searchSubs（手动搜索） ==========

async function searchSubs(params) {
  var keyword = compact(params && params.keyword);
  if (!keyword || keyword.length < 1) return [];

  var html = await fetchHtml(SITE + '/index.php?search=' + encodeURIComponent(keyword));
  var results = parseSearchResults(html);

  if (results.length === 0 && /-/.test(keyword)) {
    html = await fetchHtml(SITE + '/index.php?search=' + encodeURIComponent(keyword.replace(/-/g, '')));
    results = parseSearchResults(html);
  }

  var items = [];
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    items.push({
      id: 'scat-' + i,
      type: 'url',
      title: r.name + ' (' + r.size + ')',
      link: r.link,
      description: (r.langLabel ? '源语言：' + r.langLabel + ' | ' : '') + r.downloads + '次下载 | ' + r.languages + '种语言可翻译',
      mediaType: 'movie'
    });
  }

  return items;
}
