// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.pimpbunny",
  title: "PimpBunny",
  version: "1.0.2",
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
var np = function(p) { var n = Number(p); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1; };
var clean = function(t) { return String(t || "").replace(/<[^>]*>/g, " ").replace(/&amp;|&#39;|&quot;|&lt;|&gt;/g, "").replace(/\s+/g, " ").trim(); };

/** 从 HTML 提取所有 \u89c6\u9891\u5361\u7247 */
function parseVideos(html) {
  var items = [], seen = {};
  // \u6bcf\u5f20\u5361\u7247\u4e3a <a class="ui-card-link__..." href="/videos/.../"> ... </a>
  // \u5305\u542b <img src="..." alt="..."> \u548c\u65f6\u957f
  var re = /<a[^>]*class="[^"]*ui-card-link__[^"]*"[^>]*href="(https?:\/\/[^"]+\/videos\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  var m;
  while ((m = re.exec(html))) {
    var link = normUrl(m[1]), id = link.split("/").filter(Boolean).pop() || link;
    if (seen[id]) continue;
    seen[id] = true;
    var inner = m[2];
    // data-webp 含真实封面 URL，data:image base64 是缩略图占位
    var webp = inner.match(/data-webp="([^"]+)"/);
    var imgMatch = webp && webp[1] && webp[1].startsWith('http') ? webp : inner.match(/<img[^>]+src="([^"]+?)"/);
    var srcVal = imgMatch ? imgMatch[1] : '';
    var alt = inner.match(/alt="([^"]+)"/);
    var dur = inner.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*[^<]*</);
    var views = inner.match(/([\d.]+[KM]?)\s*(?:views?|hour|minute|ago)/i);
    items.push({
      id: id, type: "link", title: clean(alt ? alt[1] : id),
      coverUrl: srcVal.replace(/&amp;/g, "&").replace(/^data:image.*/, ""),
      link: link,
      rating: views ? function(s){if(!s)return 0;var m=s.match(/^([\d.]+)\s*([KM]?)$/i);if(!m)return 0;var n=parseFloat(m[1]),u=m[2].toUpperCase();return u==="K"?Math.round(n*1000):u==="M"?Math.round(n*1000000):Math.round(n);}(views[1]):undefined,
      durationText: dur ? clean(dur[1]) : undefined,
    });
  }
  return items;
}

async function fetchPage(url) {
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) throw new Error("\u7a7a\u54cd\u5e94");
  return parseVideos(html);
}

async function loadList(p) {
  var page = np(p.page || 1);
  var items = await fetchPage(page > 1 ? SITE + "/videos/" + page + "/" : SITE + "/videos/");
  if (!items.length) throw new Error("\u672a\u89e3\u6790\u5230\u89c6\u9891");
  return items;
}

async function loadCategory(p) {
  var slug = String(p.slug || "blowjob").trim();
  var page = np(p.page || 1);
  var qs = "?videos_per_page=32&sort_by=" + encodeURIComponent(p.sort_by || "post_date");
  var base = SITE + "/categories/" + slug + "/";
  var items = await fetchPage(page > 1 ? base + page + "/" + qs : base + qs);
  if (!items.length) throw new Error("\u672a\u89e3\u6790\u5230\u89c6\u9891");
  return items;
}

async function search(p) {
  var kw = String(p.keyword || "").trim();
  if (!kw) throw new Error("\u8bf7\u8f93\u5165\u5173\u952e\u8bcd");
  var page = np(p.page || 1);
  var url = SITE + "/search/?q=" + encodeURIComponent(kw) + "&sort_by=" + encodeURIComponent(p.sort_by || "post_date") + (page > 1 ? "&page=" + page : "");
  var items = await fetchPage(url);
  if (!items.length) throw new Error("\u6ca1\u6709\u627e\u5230\u7ed3\u679c");
  return items;
}

async function loadDetail(link) {
  if (!link) return null;
  var url = normUrl(link);
  var res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  var html = String(res.data || "");
  if (!html) return null;

  var title = (html.match(/<h1[^>]*>([^<]+)<\/h1>/) || [])[1];
  if (!title) { var og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i); if (og) title = og[1]; }
  var poster = (html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || [])[1];

  var tags = [];
  var tagRe = /<a[^>]*href="\/tags\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  var tm;
  while ((tm = tagRe.exec(html))) { var n = clean(tm[2]); if (n && n.length < 50) tags.push({ id: tm[1].toLowerCase(), title: n }); }

  var videoUrl = "";
  var srcRe = /get_file[^"']*(?:720p|1080p|480p|360p|240p)[^"']*\.mp4|get_file[^"']*\.mp4/g;
  var srcs = html.match(srcRe);
  if (srcs) { videoUrl = SITE + "/" + srcs[srcs.length - 1].replace(/^\//, ""); }

  return {
    id: url, type: "video", title: clean(title || "PimpBunny"), link: url,
    posterPath: poster || undefined, videoUrl: videoUrl || undefined,
    genreItems: tags.length ? tags.slice(0, 30) : undefined,
    relatedItems: parseVideos(html).slice(0, 20).length ? undefined : undefined,
  };
}
