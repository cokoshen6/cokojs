// @ts-check
/**
 * AVSubtitles ForwardWidget 字幕模块
 * 站点：https://www.avsubtitles.com
 * 功能：自动搜索 + 手动搜索字幕，返回 .srt 直链
 */

/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: 'avsubtitles',
  title: 'AVSubtitles 字幕',
  description: 'AVSubtitles 在线字幕加载插件。自动从影片信息提取关键词搜索，也支持手动搜索番号/关键词。',
  author: 'Minis',
  site: 'https://www.avsubtitles.com',
  version: '1.5.0',
  requiredVersion: '0.0.1',
  modules: [
    {
      id: 'loadSubtitle',
      title: '加载字幕',
      functionName: 'loadSubtitle',
      type: 'subtitle',
      params: [],
    },
    {
      id: 'search',
      title: '搜索字幕',
      description: '手动搜索 AVSubtitles 站内字幕',
      functionName: 'searchSubs',
      cacheDuration: 600,
      params: [
        { name: 'keyword', title: '关键词/番号', type: 'input', value: '' },
      ],
    },
  ],
  search: {
    title: '搜索字幕',
    functionName: 'searchSubs',
    params: [
      { name: 'keyword', title: '关键词/番号', type: 'input' },
    ],
  },
};

var SITE = 'https://www.avsubtitles.com';
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
var BASE_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh-Hans;q=0.9,zh;q=0.8,en;q=0.7',
  Referer: SITE + '/',
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

function strip(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchHtml(url, extraHeaders) {
  try {
    var res = await Widget.http.get(url, {
      headers: Object.assign({}, BASE_HEADERS, extraHeaders || {}),
    });
    if (!res) return '';
    return typeof res === 'string' ? res : res.data || res.body || '';
  } catch (e) {
    return '';
  }
}

function getExt(name) {
  if (!name) return '';
  var s = String(name).toLowerCase();
  if (s.endsWith('.srt')) return '.srt';
  if (s.endsWith('.ass')) return '.ass';
  if (s.endsWith('.ssa')) return '.ssa';
  return '';
}

function extractAvCode(text) {
  var m =
    String(text || '').match(/\[([A-Z]{2,10}-?\d{2,8})\]/i) ||
    String(text || '').match(/\b([A-Z]{2,10}-?\d{2,8}[A-Z]?)\b/i);
  return m ? m[1].toUpperCase() : '';
}

function collectKeyword(params) {
  var parts = [];
  var fields = [
    params && params.title,
    params && params.seriesName,
    params && params.description,
    params && params.id,
    params && params.link,
    params && params.url,
  ];
  for (var i = 0; i < fields.length; i++) {
    var v = strip(fields[i]);
    if (v) parts.push(v);
  }
  var raw = parts.join(' ');
  var code = extractAvCode(raw);
  if (code) return code;
  var title = strip(params && params.title) || strip(params && params.seriesName) || '';
  return title || raw;
}

function parseSearchResults(html) {
  var items = [];
  var seen = {};
  var re =
    /<div\s+class="card"[^>]*>[\s\S]*?<div\s+class="cover-image">[\s\S]*?<a\s+href="([^"]+)"[\s\S]*?<img\s+src="([^"]+)"[\s\S]*?<h5>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h5>([\s\S]*?)(?=<div\s+class="card"|<div\s+class="pages_navigation"|<\/body>)/gi;
  var m;
  while ((m = re.exec(html))) {
    var link = absUrl(m[3] || m[1]);
    if (!link || seen[link]) continue;
    seen[link] = true;
    var title = strip(m[4]);
    var body = m[5] || '';
    var actors = strip((body.match(/With:\s*<span[^>]*>([\s\S]*?)<\/span>/i) || [, ''])[1]);
    var avail = strip((body.match(/<span[^>]*>\s*([\d]+)\s+subtitles available/i) || [, ''])[1]);
    items.push({ link: link, title: title, actors: actors, count: avail });
  }
  return items;
}

function langFromUrl(url) {
  var lm = String(url || '').match(/\/subtitles\/([a-z]+)\//i);
  if (!lm) return 'unknown';
  var lc = lm[1].toLowerCase();
  var map = {
    zh: 'Chinese', chi: 'Chinese',
    en: 'English',
    ja: 'Japanese',
    ko: 'Korean',
    vi: 'Vietnamese',
    th: 'Thai',
    ru: 'Russian',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    pt: 'Portuguese',
    it: 'Italian',
    ar: 'Arabic',
    id: 'Indonesian',
  };
  return map[lc] || lc;
}

function langTag(lang) {
  var t = String(lang).toLowerCase();
  if (t.includes('chinese') || t === 'zh' || t === 'chi') return '【中】';
  if (t.includes('english') || t === 'en') return '【英】';
  if (t.includes('japanese') || t === 'ja') return '【日】';
  if (t.includes('korean') || t === 'ko') return '【韩】';
  if (t.includes('vietnamese') || t === 'vi') return '【越】';
  return '【字幕】';
}

// ========== loadSubtitle — 自动搜索 ==========

async function loadSubtitle(params) {
  var keyword = collectKeyword(params);
  if (!keyword || keyword.length < 2) return [];

  var html = await fetchHtml(SITE + '/search_results.php?search=' + encodeURIComponent(keyword) + '&language=&page=1');
  var cards = parseSearchResults(html);

  if (cards.length === 0 && /-/.test(keyword)) {
    html = await fetchHtml(SITE + '/search_results.php?search=' + encodeURIComponent(keyword.replace(/-/g, '')) + '&language=&page=1');
    cards = parseSearchResults(html);
  }

  if (cards.length === 0) return [];

  var movieHtml = await fetchHtml(cards[0].link);
  var subs = [];
  var subRe = /<tr>[\s\S]*?<a\s+class="link_button"\s+href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  var sm;
  while ((sm = subRe.exec(movieHtml))) {
    var infoUrl = absUrl(sm[1]);
    var subName = strip(sm[2]);
    var subCount = strip(sm[3]).replace(/\D/g, '');
    if (infoUrl) subs.push({ infoUrl: infoUrl, name: subName, count: subCount });
  }

  var result = [];
  var exist = {};

  for (var i = 0; i < subs.length && result.length < 10; i++) {
    var s = subs[i];
    var infoHtml = await fetchHtml(s.infoUrl);
    var subid = (infoHtml.match(/name="subid"\s+value="(\d+)"/i) || [])[1];
    var revid = (infoHtml.match(/name="revid"\s+value="(\d+)"/i) || [])[1];
    if (!subid || !revid || exist[subid]) continue;
    exist[subid] = true;

    var lang = langFromUrl(s.infoUrl);
    var tag = langTag(lang);
    var cleanName = (s.name || '字幕').replace(/\.(srt|ass|ssa)$/i, '');

    await fetchHtml(SITE + '/download_page.php?subid=' + encodeURIComponent(subid) + '&revid=' + encodeURIComponent(revid));

    result.push({
      id: 'avs-' + subid,
      title: tag + cleanName + '.srt',
      subTitle: lang + ' | ' + (s.count || '0') + '次下载',
      description: '语言: ' + lang + '\n来源: AVSubtitles',
      lang: lang,
      count: parseInt(s.count || '0', 10) || 0,
      url: SITE + '/download_sub.php?subid=' + encodeURIComponent(subid) + '&revid=' + encodeURIComponent(revid),
    });
  }

  return result;
}

// ========== searchSubs — 手动搜索 ==========

async function searchSubs(params) {
  var keyword = strip(params && params.keyword);
  if (!keyword || keyword.length < 1) return [];

  var html = await fetchHtml(SITE + '/search_results.php?search=' + encodeURIComponent(keyword) + '&language=&page=1');
  var cards = parseSearchResults(html);

  var items = [];
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    var descParts = [];
    if (c.actors) descParts.push('演员: ' + c.actors);
    if (c.count) descParts.push(c.count + '条字幕');
    items.push({
      id: 'avs-search-' + i,
      type: 'url',
      title: c.title,
      link: c.link,
      description: descParts.join(' | '),
      mediaType: 'movie',
    });
  }

  return items;
}

// ========== loadDetail — 搜索结果的详情页 ==========

async function loadDetail(link) {
  var html = await fetchHtml(link);
  if (!html) return null;

  var title = '';
  var tm = html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  if (tm) title = strip(tm[1]);

  var poster = '';
  var pm = html.match(/<div\s+class="cover-image">[\s\S]*?<img\s+src="([^"]+)"/i);
  if (pm) poster = absUrl(pm[1]);

  var actors = '';
  var am = html.match(/With:\s*<span[^>]*>([\s\S]*?)<\/span>/i);
  if (am) actors = strip(am[1]);

  var subCount = 0;
  var subRe = /<tr>[\s\S]*?<a\s+class="link_button"\s+href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  while (subRe.exec(html)) subCount++;

  return {
    id: link,
    type: 'url',
    title: title || '影片详情',
    link: link,
    posterPath: poster,
    description: '演员: ' + (actors || '未知') + '\n字幕数: ' + subCount + '\n来源: AVSubtitles',
  };
}
