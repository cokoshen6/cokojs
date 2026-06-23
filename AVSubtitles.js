WidgetMetadata = {
  id: 'avsubtitles',
  title: 'AVSubtitles 字幕',
  description: 'AVSubtitles 在线字幕加载插件',
  author: 'Minis',
  site: 'https://www.avsubtitles.com',
  version: '1.3.0',
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
      description: '手动搜索 AVSubtitles',
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

var SITE = 'https://www.avsubtitles.com';
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
  } catch(e) { return ''; }
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

function parseSearchResults(html) {
  var items = [];
  var seen = {};
  var re = /<div\s+class="card"[^>]*>[\s\S]*?<div\s+class="cover-image">[\s\S]*?<a\s+href="([^"]+)"[\s\S]*?<img\s+src="([^"]+)"[\s\S]*?<h5>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h5>([\s\S]*?)(?=<div\s+class="card"|<div\s+class="pages_navigation"|<\/body>)/gi;
  var m;
  while ((m = re.exec(html))) {
    var link = absUrl(m[3] || m[1]);
    if (!link || seen[link]) continue;
    seen[link] = true;
    var title = compact(m[4]);
    var body = m[5] || '';
    var actors = compact((body.match(/With:\s*<span[^>]*>([\s\S]*?)<\/span>/i) || [,''])[1]);
    var avail = compact((body.match(/<span[^>]*>\s*([\d]+)\s+subtitles available/i) || [,''])[1]);
    items.push({ link: link, title: title, actors: actors, count: avail });
  }
  return items;
}

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

  // Get the movie page to find actual subtitle info URLs
  var movieHtml = await fetchHtml(cards[0].link);
  var subs = [];
  var subRe = /<tr>[\s\S]*?<a\s+class="link_button"\s+href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  var sm;
  while ((sm = subRe.exec(movieHtml))) {
    var infoUrl = absUrl(sm[1]);
    var subName = compact(sm[2]);
    var subCount = compact(sm[3]).replace(/\D/g, '');
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
    // Extract language from URL path
    var lang = 'unknown';
    var lm = s.infoUrl.match(/\/subtitles\/([a-z]+)\//i);
    if (lm) {
      var lc = lm[1].toLowerCase();
      if (lc === 'zh' || lc === 'chi') lang = 'Chinese';
      else if (lc === 'en') lang = 'English';
      else if (lc === 'ja') lang = 'Japanese';
      else if (lc === 'ko') lang = 'Korean';
      else if (lc === 'vi') lang = 'Vietnamese';
      else if (lc === 'th') lang = 'Thai';
      else if (lc === 'ru') lang = 'Russian';
      else if (lc === 'fr') lang = 'French';
      else if (lc === 'de') lang = 'German';
      else if (lc === 'es') lang = 'Spanish';
      else if (lc === 'pt') lang = 'Portuguese';
      else if (lc === 'it') lang = 'Italian';
      else if (lc === 'ar') lang = 'Arabic';
      else if (lc === 'id') lang = 'Indonesian';
    }
    var tag = '【' + (lang === 'unknown' ? '字幕' : lang.slice(0, 1)) + '】';
    // Visit download_page first to seed session
    await fetchHtml(SITE + '/download_page.php?subid=' + encodeURIComponent(subid) + '&revid=' + encodeURIComponent(revid));
    // Return download_sub as subtitle url
    var dlUrl = SITE + '/download_sub.php?subid=' + encodeURIComponent(subid) + '&revid=' + encodeURIComponent(revid);
    result.push({
      id: 'avs-' + subid,
      title: tag + (s.name || '字幕') + '.srt',
      subTitle: lang + ' | ' + (s.count || '') + '次下载',
      description: ['语言: ' + lang, s.name || '', '来源: AVSubtitles'].filter(Boolean).join('\n'),
      lang: lang,
      count: parseInt(s.count || '0', 10),
      url: dlUrl
    });
  }

  return result;
}

async function searchSubs(params) {
  var keyword = compact(params && params.keyword);
  if (!keyword || keyword.length < 1) return [];

  var html = await fetchHtml(SITE + '/search_results.php?search=' + encodeURIComponent(keyword) + '&language=&page=1');
  var items = [];
  var cards = parseSearchResults(html);

  for (var i = 0; i < cards.length; i++) {
    items.push({
      id: 'avs-' + i,
      type: 'url',
      title: cards[i].title,
      link: cards[i].link,
      description: [cards[i].actors ? '演员: ' + cards[i].actors : '', cards[i].count ? cards[i].count + '条字幕' : ''].filter(Boolean).join(' | '),
      mediaType: 'movie'
    });
  }

  return items;
}
