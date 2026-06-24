// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.supjav",
  title: "SupJAV",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "SupJAV 视频浏览与播放",
  author: "Minis",
  site: "https://supjav.com",
  detailCacheDuration: 300,
  modules: [
    {
      id: "recent",
      title: "最近更新",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "分类", type: "constant", value: "" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "4k",
      title: "4K 专区",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "分类", type: "constant", value: "tag/4k" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "chinese",
      title: "中文字幕",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "分类", type: "constant", value: "category/chinese-subtitles" },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "uncensored",
      title: "无码影片",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "分类", type: "enumeration", value: "category/uncensored-jav",
          enumOptions: [
            { title: "无码流出", value: "category/uncensored-jav" },
            { title: "无码热门", value: "tag/uncensored-popular" },
          ],
        },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "censored",
      title: "有码影片",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "分类", type: "enumeration", value: "category/censored-jav",
          enumOptions: [
            { title: "有码主流", value: "category/censored-jav" },
            { title: "有码热门", value: "tag/censored-popular" },
          ],
        },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "exclusive",
      title: "独家专区",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "分类", type: "enumeration", value: "tag/exclusive",
          enumOptions: [
            { title: "独家作品", value: "tag/exclusive" },
            { title: "VR 专区", value: "tag/vr" },
            { title: "高分好评", value: "tag/highly-recommended" },
          ],
        },
        { name: "page", title: "页码", type: "page" },
      ],
    },
    {
      id: "tag",
      title: "类型标签",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "endpoint", title: "类型", type: "enumeration", value: "tag/creampie",
          enumOptions: [
            { title: "中出", value: "tag/creampie" },
            { title: "巨乳", value: "tag/big-breasts" },
            { title: "人妻", value: "tag/married-woman" },
            { title: "熟女", value: "tag/mature-woman" },
            { title: "素人", value: "tag/amateur" },
            { title: "美少女", value: "tag/beautiful-girl" },
            { title: "口交", value: "tag/blowjob" },
            { title: "教师", value: "tag/teacher" },
            { title: "女优", value: "tag/actress" },
            { title: "制服", value: "tag/uniform" },
          ],
        },
        { name: "page", title: "页码", type: "page" },
      ],
    },
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

var SITE = "https://supjav.com";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
var HDR = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", Referer: SITE + "/" };

function absUrl(u) { if (!u) return ""; return u.indexOf("http") === 0 ? u : SITE + (u.indexOf("/") === 0 ? u : "/" + u); }
function normPage(p) { var n = Number(p); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1; }
function clean(t) { return String(t || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function pageUrl(base, p) { return p <= 1 ? base : base.replace(/\/$/, "") + "/page/" + p + "/"; }

function extractCode(text) {
  var s = String(text || "").toUpperCase().replace(/[._\s]+/g, "-").trim();
  var patterns = [/\bFC2(?:-PPV)?-\d{5,8}\b/, /\bCARIB-\d{6,8}\b/, /\b1PONDO-\d{6,8}\b/, /\bHEYZO-\d{3,6}\b/, /\b[A-Z]{2,10}-\d{2,8}[A-Z]?\b/];
  for (var i = 0; i < patterns.length; i++) { var m = s.match(patterns[i]); if (m) return m[0]; }
  return "";
}

function parseVideos(html) {
  var items = [], seen = {};
  var re = /<article[\s\S]*?<\/article>/gi;
  var m;
  while ((m = re.exec(html))) {
    var block = m[0];
    var a = block.match(/<a[^>]*href="([^"]+)"[^>]*>/);
    if (!a) continue;
    var link = absUrl(a[1]);
    if (seen[link]) continue;
    seen[link] = true;
    var img = block.match(/<img[^>]+(?:data-src|src)="([^"]+?)"/);
    var alt = block.match(/alt="([^"]+)"/);
    var title = alt ? clean(alt[1]) : (block.match(/<a[^>]*>([^<]+)<\/a>/) || [, ""])[1];
    items.push({
      id: link, type: "link", title: title || "SupJAV",
      coverUrl: img ? img[1].replace(/&amp;/g, "&") : "",
      link: link,
    });
  }
  return items;
}

async function loadList(p) {
  var ep = String(p.endpoint || "").trim();
  var page = normPage(p.page || 1);
  var url = pageUrl(ep ? SITE + "/" + ep : SITE, page);
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) throw new Error("空响应");
  var items = parseVideos(html);
  if (!items.length) throw new Error("未解析到视频");
  return items;
}

async function search(p) {
  var kw = String(p.keyword || "").trim();
  if (!kw) throw new Error("请输入关键词");
  var page = normPage(p.page || 1);
  var url = pageUrl(SITE + "/?s=" + encodeURIComponent(kw), page);
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) throw new Error("空响应");
  var items = parseVideos(html);
  if (!items.length) throw new Error("没有找到结果");
  return items;
}

async function loadDetail(link) {
  if (!link) return null;
  var url = absUrl(link);
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) return getFallback(link);

  var title = "", poster = "", videoUrl = "", tags = [], desc = "";
  var titleM = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (titleM) title = titleM[1];
  if (!title) { var h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/); if (h1) title = clean(h1[1]); }

  var imgM = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (imgM) poster = imgM[1];

  var descM = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (descM) desc = descM[1];

  // 提取视频源（m3u8）
  var m3u8 = html.match(/https?:\/\/[^"'\s]+?\.m3u8[^"'\s]*/i);
  if (m3u8) videoUrl = m3u8[0];
  if (!videoUrl) {
    var mp4 = html.match(/https?:\/\/[^"'\s]+?\.mp4[^"'\s]*/i);
    if (mp4) videoUrl = mp4[0];
  }

  var code = extractCode(title) || extractCode(link);
  var relatedItems = parseVideos(html).slice(0, 20);

  return {
    id: url, type: "video", title: title || "SupJAV", link: url,
    posterPath: poster || undefined,
    videoUrl: videoUrl || undefined,
    description: desc || (code ? "番号: " + code : ""),
    genreItems: tags.length ? tags : undefined,
    relatedItems: relatedItems.length ? relatedItems : undefined,
    customHeaders: { Referer: url, "User-Agent": UA },
  };
}

async function getFallback(link) {
  var code = extractCode(link);
  if (!code) return null;
  var url = SITE + "/?s=" + encodeURIComponent(code);
  var res = await Widget.http.get(url, { headers: HDR });
  var html = String(res.data || "");
  if (!html) return null;
  var items = parseVideos(html);
  if (!items.length) return null;
  return loadDetail(items[0].link);
}
