// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "kbjfan",
  title: "KBJFan",
  author: "Minis",
  description: "KBJFan - 韩国 BJ 视频",
  version: "2.0.4",
  requiredVersion: "0.0.1",
  site: "https://www.kbjfan.com",
  modules: [
    {
      id: "latest",
      title: "Latest Korean BJ",
      functionName: "loadLatest",
      type: "video",
      requiresWebView: true,
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "orderby", title: "排序", type: "enumeration", value: "", enumOptions: [
          { title: "默认", value: "" },
          { title: "View", value: "views" },
          { title: "Like", value: "like" },
          { title: "Comment", value: "comment_count" },
        ]},
      ],
    },
    {
      id: "dance",
      title: "Korean BJ Dance",
      functionName: "loadDance",
      type: "video",
      requiresWebView: true,
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "orderby", title: "排序", type: "enumeration", value: "", enumOptions: [
          { title: "默认（按时间）", value: "" },
          { title: "View", value: "views" },
          { title: "Like", value: "like" },
          { title: "Comment", value: "comment_count" },
        ]},
      ],
    },
    {
      id: "nude",
      title: "Korean BJ Nude",
      functionName: "loadNude",
      type: "video",
      requiresWebView: true,
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "orderby", title: "排序", type: "enumeration", value: "", enumOptions: [
          { title: "默认（按时间）", value: "" },
          { title: "View", value: "views" },
          { title: "Like", value: "like" },
          { title: "Comment", value: "comment_count" },
        ]},
      ],
    },
  ],
};

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
var HDR = {
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function strip(s) {
  return (s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").replace(/&amp;/g, "&").replace(/&quot;|&#39;/g, "'").replace(/&lt;|<|&gt;|>/g, "").trim();
}

async function fetchHtml(url) {
  try {
    var res = await Widget.http.get(url, { headers: HDR });
    if (!res) return "";
    return typeof res === "string" ? res : (res.data || "");
  } catch (e) {
    return "";
  }
}

async function loadCategory(params, baseUrl) {
  var page = params && params.page ? (parseInt(params.page, 10) || 1) : 1;
  var orderby = params && params.orderby || "";
  var url = baseUrl + (page > 1 ? "page/" + page + "/" : "");
  if (orderby) url += (url.indexOf("?") === -1 ? "?" : "&") + "orderby=" + encodeURIComponent(orderby);

  var html = await fetchHtml(url);
  if (!html) return [];

  var results = [];
  var re = /<posts[^>]*class="posts-item[^"]*card[^"]*ajax-item[^"]*"[^>]*>([\s\S]*?)<\/posts>/gi;
  var m;
  while ((m = re.exec(html))) {
    var block = m[1];
    var imgM = block.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*fit-cover[^"]*"/i);
    var thumb = imgM ? imgM[1].replace(/&amp;/g, "&") : "";
    var titleM = block.match(/<h[23][^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h[23]>/i);
    if (!titleM) continue;
    var link = titleM[1].replace(/&amp;/g, "&");
    var title = strip(titleM[2]);
    if (!link || !title) continue;

    var dateM = block.match(/<span[^>]*title="([^"]+)"[^>]*>/);
    var date = dateM ? dateM[1].split(" ")[0] : "";
    var views = "";
    var vM = block.match(/icon-view[^>]*><\/svg>\s*([\d.]+[KMB]?)/i);
    if (vM) views = vM[1];

    results.push({
      id: link, type: "link", title: title,
      coverUrl: thumb, link: link,
      description: (date ? "📅 " + date : "") + (views ? " | 👁 " + views : ""),
      backdropPath: thumb, posterPath: thumb,
    });
  }

  return results;
}

async function loadLatest(params) { return loadCategory(params, "https://www.kbjfan.com/"); }
async function loadDance(params) { return loadCategory(params, "https://www.kbjfan.com/koreanbjdance/"); }
async function loadNude(params) { return loadCategory(params, "https://www.kbjfan.com/koreanbjnude/"); }

async function loadDetail(link) {
  var url = String(link || "");
  var fallback = { id: url, type: "url", title: url.split("/").pop() || "", link: url };

  var html = await fetchHtml(url);
  if (!html) return fallback;

  // 提取标题
  var title = "";
  var titleM = html.match(/<h1[^>]*class="article-title"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
  if (titleM) title = strip(titleM[1]);
  if (!title) title = url.split("/").pop() || "";

  // 提取封面
  var thumb = "";
  var thumbM = html.match(/<img[^>]+src="([^"]+Previews[^"]+)"[^>]*class="[^"]*fit-cover[^"]*"/i) ||
               html.match(/<img[^>]+class="[^"]*fit-cover[^"]*"[^>]+src="([^"]+Previews[^"]+)"/i);
  if (thumbM) thumb = thumbM[1].replace(/&amp;/g, "&");

  // 提取信息行
  var infoLines = [];
  var infoRe = /<p>([^<]+)<\/p>/gi;
  var im;
  while ((im = infoRe.exec(html))) {
    var t = strip(im[1]);
    if (t && (t.indexOf(":") !== -1 || t.indexOf("：") !== -1)) infoLines.push(t);
  }

  // 从 DPlayer 提取视频源（直接匹配 <source src= 无需登录）
  var videoUrl = "";
  // source src 可能在 #posts-pay 里，无论登录与否都在 HTML 中（nosrc 不影响 source 子元素）
  var srcRe = /<source[^>]+src="([^"]+\.mp4[^"]*)"/i;
  var srcM = html.match(srcRe);
  if (srcM) videoUrl = srcM[1];

  // 回退：从 script 配置中提取
  if (!videoUrl) {
    var jsonRe = /"url"\s*:\s*"([^"]+\.mp4[^"]*)"/i;
    var jsonM = html.match(jsonRe);
    if (jsonM) videoUrl = jsonM[1];
  }

  return {
    id: url,
    type: "video",
    title: title,
    link: url,
    coverUrl: thumb,
    backdropPath: thumb,
    posterPath: thumb,
    description: infoLines.join("\n"),
    videoUrl: videoUrl || undefined,
    videoSources: videoUrl ? [{ url: videoUrl, type: "video/mp4", label: "MP4" }] : undefined,
    playerType: "app",
  };
}
