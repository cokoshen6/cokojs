// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.pimpbunny",
  title: "PimpBunny",
  version: "1.0.7",
  requiredVersion: "0.0.1",
  description: "PimpBunny - OnlyFans 视频浏览",
  author: "Minis",
  site: "https://pimpbunny.com",
  detailCacheDuration: 300,
  modules: [
    {
      id: "latest",
      title: "最新视频",
      functionName: "loadList",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "category",
      title: "分类浏览",
      functionName: "loadCategory",
      type: "video",
      requiresWebView: true,
      cacheDuration: 600,
      params: [
        { name: "slug", title: "分类", type: "enumeration", value: "blowjob",
          enumOptions: [
            { title: "4K", value: "4k" }, { title: "Anal", value: "anal" },
            { title: "Asian", value: "asian" }, { title: "BBC", value: "bbc" },
            { title: "BDSM", value: "bdsm" }, { title: "Big Boobs", value: "big-boobs" },
            { title: "Blowjob", value: "blowjob" }, { title: "BWC", value: "bwc" },
            { title: "Cosplay", value: "cosplay" }, { title: "Deep Throat", value: "deep-throat" },
            { title: "DP", value: "double-penetration" }, { title: "Exclusive", value: "exclusive" },
            { title: "Feet", value: "feet" }, { title: "Fetish", value: "fetish" },
            { title: "Gang Bang", value: "gang-bang" }, { title: "Latina", value: "latina" },
            { title: "Lesbian", value: "lesbian" }, { title: "Masturbation", value: "masturbation" },
            { title: "MILF", value: "milf" }, { title: "Outdoor", value: "outdoor" },
            { title: "PAWG", value: "pawg" }, { title: "Petite", value: "petite" },
            { title: "Seduction", value: "seduction" }, { title: "Sex", value: "sex" },
            { title: "Striptease", value: "striptease" }, { title: "Teen (18+)", value: "teen" },
            { title: "Threesome", value: "threesome" },
          ],
        },
        { name: "sort_by", title: "排序", type: "enumeration", value: "post_date",
          enumOptions: [
            { title: "最新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "评分最高", value: "rating" },
            { title: "时长", value: "duration" },
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
      { name: "sort_by", title: "排序", type: "enumeration", value: "post_date",
        enumOptions: [
          { title: "最新", value: "post_date" },
          { title: "最多观看", value: "video_viewed" },
          { title: "评分最高", value: "rating" },
        ],
      },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

var SITE = "https://pimpbunny.com";
var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
var HDR = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", Referer: SITE + "/" };

var normUrl = function(u) { return !u ? "" : /^https?:\/\//i.test(u) ? u : u.indexOf("//") === 0 ? "https:" + u : u.indexOf("/") === 0 ? SITE + u : SITE + "/" + u; };
var normPage = function(p) { var n = Number(p); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1; };
var clean = function(t) { return String(t || "").replace(/<[^>]*>/g, " ").replace(/&amp;|&#39;|&quot;|&lt;|&gt;/g, "").replace(/\s+/g, " ").trim(); };

/** 从一段 HTML 中提取单个视频条目 */
function parseCard(block) {
  var a = block.match(/<a[^>]*href="([^"]+)"[^>]*>/);
  if (!a) return null;
  var link = normUrl(a[1]);
  var id = link.split("/").filter(Boolean).pop() || link;

  // 优先 data-webp（真实图片），回退 src（过滤 base64）
  var webp = block.match(/data-webp="([^"]+)"/);
  var img = block.match(/<img[^>]+src="([^"]+?)"/);
  var cover = "";
  if (webp && webp[1].indexOf("http") === 0) cover = webp[1];
  else if (img && img[1].indexOf("http") === 0) cover = img[1].replace(/&amp;/g, "&");

  var alt = block.match(/alt="([^"]+)"/);
  var title = alt ? clean(alt[1]) : id;

  var durMatch = block.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*</);
  var durationText = durMatch ? clean(durMatch[1]) : "";

  return {
    id: id, type: "link", title: title,
    coverUrl: cover, link: link,
    durationText: durationText || undefined,
  };
}

/** 解析 HTML 中所有视频卡片 */
function parseCards(html) {
  var items = [];
  // 先尝试按 ui-card-video 拆分
  var parts = html.split(/<div[^>]*class="[^"]*b6m-video[^"]*"[^>]*>/g);
  for (var i = 1; i < parts.length && items.length < 40; i++) {
    // 找到闭合 </div>（卡片结束）
    var depth = 0, end = -1;
    for (var j = 0; j < parts[i].length; j++) {
      if (parts[i][j] === '<' && parts[i].substring(j, j+5) === '<div ') { depth++; j += 4; }
      else if (parts[i][j] === '<' && parts[i].substring(j, j+6) === '</div>') { depth--; j += 5; if (depth < 0) { end = j + 1; break; } }
    }
    var block = end > 0 ? parts[i].substring(0, end) : parts[i];
    var item = parseCard(block);
    if (item) items.push(item);
  }
  return items;
}

async function fetchPage(url) {
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) throw new Error("空响应");
  return parseCards(html);
}

async function loadList(p) {
  var page = normPage(p.page || 1);
  var items = await fetchPage(page > 1 ? SITE + "/videos/" + page + "/" : SITE + "/videos/");
  if (!items.length) throw new Error("未解析到视频");
  return items;
}

async function loadCategory(p) {
  var slug = String(p.slug || "blowjob").trim();
  var page = normPage(p.page || 1);
  var qs = "?videos_per_page=32&sort_by=" + encodeURIComponent(p.sort_by || "post_date");
  var base = SITE + "/categories/" + slug + "/";
  var items = await fetchPage(page > 1 ? base + page + "/" + qs : base + qs);
  if (!items.length) throw new Error("未解析到视频");
  return items;
}

async function search(p) {
  var kw = String(p.keyword || "").trim();
  if (!kw) throw new Error("请输入关键词");
  var page = normPage(p.page || 1);
  var url = SITE + "/search/?q=" + encodeURIComponent(kw) + "&sort_by=" + encodeURIComponent(p.sort_by || "post_date") + (page > 1 ? "&page=" + page : "");
  var items = await fetchPage(url);
  if (!items.length) throw new Error("没有找到结果");
  return items;
}

async function loadDetail(link) {
  if (!link) return null;
  var url = normUrl(link);
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) return null;

  var title = "";
  var h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1) title = clean(h1[1]);
  if (!title) { var og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i); if (og) title = og[1]; }

  var poster = "";
  var ogImg = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImg) poster = ogImg[1];

  var tags = [];
  var tagRe = /<a[^>]*href="\/tags\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  var tm;
  while ((tm = tagRe.exec(html))) { var n = clean(tm[2]); if (n && n.length < 50) tags.push({ id: tm[1].toLowerCase(), title: n }); }

  var videoUrl = "";
  // 提取完整 get_file URL（含尾部斜杠），排除预览版
  var srcRe = /https:[^"']*get_file[^"']*(?:_pb_)?(?:1080|720|480|360|1440)p[^"']*\.mp4\//g;
  var srcs = html.match(srcRe);
  if (srcs && srcs.length > 0) {
    for (var si = 0; si < srcs.length; si++) {
      if (srcs[si].indexOf("preview") === -1) { videoUrl = srcs[si]; break; }
    }
  }
  if (!videoUrl) {
    var fallback = html.match(/https:[^"']*get_file\/[^"']*?\/(\d+)\/(\d+)\/\d+\.mp4\//g);
    if (fallback && fallback.length > 0) {
      for (var fi = 0; fi < fallback.length; fi++) {
        if (fallback[fi].indexOf("preview") === -1) { videoUrl = fallback[fi]; break; }
      }
    }
  }

  var relatedItems = parseCards(html).slice(0, 20);

  return {
    id: url, type: "video", title: title || "PimpBunny", link: url,
    posterPath: poster || undefined, videoUrl: videoUrl || undefined,
    genreItems: tags.length ? tags.slice(0, 30) : undefined,
    relatedItems: relatedItems.length ? relatedItems : undefined,
    customHeaders: { Referer: SITE + "/", "User-Agent": UA },
  };
}
