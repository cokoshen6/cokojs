// @ts-check
/**
 * OK.XXX ForwardWidgets 模块
 * 
 * 站点结构：
 * - 首页(最新): / -> 分页 /{page}/
 * - 热门: /popular/ -> /popular/{page}/
 * - 流行: /trending/ -> /trending/{page}/
 * - 频道: /channels/ -> /channels/{page}/
 * - 频道视频: /sites/{slug}/ -> /sites/{slug}/{page}/
 * - 女优: /models/ -> /models/{page}/
 * - 女优视频: /models/{slug}/ -> /models/{slug}/{page}/
 * - 标签: /tags/ -> /tags/{letter}/
 * - 标签视频: /tags/{tag}/ -> /tags/{tag}/{page}/
 * - 搜索: /search/?q={keyword} -> /search/?q={keyword}&page={page}
 * - 详情: /video/{id}/
 * - 视频URL: /get_file/13/{hash}/{id_prefix}/{id}/{id}_{quality}.mp4/
 * - 截图: https://static.ok.xxx/contents/videos_screenshots/{id_prefix}/{id}/640x360/{n}.jpg
 */

/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.okxxx",
  title: "OK.XXX",
  version: "1.2.1",
  requiredVersion: "0.0.1",
  description: "OK.XXX 免费色情视频 - 最新/热门/流行/频道/女优/标签/搜索",
  author: "Minis",
  site: "https://ok.xxx",
  detailCacheDuration: 60,
  modules: [
    // === 最新视频 ===
    {
      id: "newest",
      title: "最新",
      description: "最新上传视频",
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "constant",
          value: "https://ok.xxx/",
        },
        { name: "from", title: "页码", type: "page" },
      ],
    },
    // === 热门视频 ===
    {
      id: "popular",
      title: "热门",
      description: "热门视频",
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "constant",
          value: "https://ok.xxx/popular/",
        },
        { name: "from", title: "页码", type: "page" },
      ],
    },
    // === 流行趋势 ===
    {
      id: "trending",
      title: "流行",
      description: "流行趋势视频",
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "url",
          title: "列表地址",
          type: "constant",
          value: "https://ok.xxx/trending/",
        },
        { name: "from", title: "页码", type: "page" },
      ],
    },
    // === 频道视频（手动输入地址） ===
    {
      id: "channelVideos",
      title: "频道视频",
      description: "输入频道网址查看视频",
      functionName: "loadPage",
      cacheDuration: 600,
      params: [
        {
          name: "url",
          title: "频道地址",
          type: "input",
          placeholders: [
            { title: "Brazzers", value: "https://ok.xxx/sites/brazzers/" },
            { title: "Reality Kings", value: "https://ok.xxx/sites/realitykings/" },
            { title: "Naughty America", value: "https://ok.xxx/sites/naughty-america/" },
            { title: "Nubiles Porn", value: "https://ok.xxx/sites/nubiles-porn/" },
            { title: "Blacked", value: "https://ok.xxx/sites/blacked-com/" },
            { title: "Bang Bros", value: "https://ok.xxx/sites/bangbros/" },
            { title: "Vixen", value: "https://ok.xxx/sites/vixen/" },
          ],
        },
        { name: "from", title: "页码", type: "page" },
      ],
    },
    // === 网页搜索（通用地址浏览） ===
    {
      id: "webBrowse",
      title: "网页搜索",
      description: "输入任意 ok.xxx 地址或搜索词浏览视频",
      functionName: "loadWebBrowse",
      cacheDuration: 300,
      params: [
        {
          name: "query",
          title: "地址或关键词",
          type: "input",
          placeholders: [
            { title: "搜索: asian", value: "asian" },
            { title: "搜索: bbc", value: "bbc" },
            { title: "频道: brazzers", value: "/sites/brazzers/" },
            { title: "女优: angela white", value: "/models/angela-white/" },
            { title: "标签: anal", value: "/tags/anal/" },
            { title: "标签: 中出", value: "/tags/creampie/" },
          ],
        },
        { name: "from", title: "页码", type: "page" },
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

// =============================================
// 解析工具函数
// =============================================

/**
 * 适配来自不同来源列表页的 URL，补全域名
 */
function normalizeUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return "https://ok.xxx" + url;
  return url;
}

/**
 * 从视频ID提取截图路径前缀
 * 视频ID 746662 → idPrefix=746000 （向下取整到千）
 */
function getScreenshotPrefix(id) {
  const num = parseInt(id, 10) || 0;
  return Math.floor(num / 1000) * 1000;
}

/**
 * 构建缩略图URL
 */
function getThumbnailUrl(id) {
  const prefix = getScreenshotPrefix(id);
  return `https://static.ok.xxx/contents/videos_screenshots/${prefix}/${id}/640x360/1.jpg`;
}

/**
 * 从列表 item 提取视频 ID
 */
function parseVideoId(item, $) {
  const link = item("a[href*='/video/']").first();
  const href = normalizeUrl(link.attr("href") || "");
  const id = href.match(/\/video\/(\d+)\//)?.[1] || "";
  if (!id) return null;
  
  const title = link.attr("title") || link.text().trim() || "Unknown";
  const infoText = item(".thumb-bl-info").text().trim() || "";
  const durationMatch = infoText.match(/(\d+:\d+(?::\d+)?)/);
  const durationText = durationMatch ? durationMatch[1] : "";
  const viewsMatch = infoText.match(/([\d.]+[KM]?)\s*$/) || infoText.match(/([\d.]+[KM]?)\s*ago\s*$/);
  const rating = parseViewCount(viewsMatch ? viewsMatch[1] : "");
  
  const siteName = item("a[href*='/sites/']").first().text().trim();
  
  const models = [];
  item("a[href*='/models/']").each((j, el) => {
    const n = $(el).text().trim();
    if (n) models.push(n);
  });
  
  return {
    id: `okxxx:${id}`,
    type: "url",
    title,
    posterPath: getImgSrc(item("img").first()) || getThumbnailUrl(id),
    rating,
    durationText,
    link: `https://ok.xxx/video/${id}/`,
    genreItems: siteName
      ? [{ id: siteName.toLowerCase().replace(/\s+/g, "-"), title: siteName }]
      : undefined,
    peoples: models.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      title: name,
    })),
  };
}

/**
 * 解析浏览量字符串为数字
 * "39K" → 39000, "1.2M" → 1200000
 */
function parseViewCount(str) {
  if (!str) return 0;
  const m = str.match(/^([\d.]+)([KM]?)$/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  const unit = m[2];
  if (unit === "K") return Math.round(num * 1000);
  if (unit === "M") return Math.round(num * 1000000);
  return Math.round(num);
}

/**
 * 从 img 元素提取图片URL（处理懒加载）
 */
function getImgSrc($el) {
  // 懒加载：data-original 是真实图片，src 可能是占位图
  const dataOrig = $el.attr("data-original");
  if (dataOrig && !dataOrig.startsWith("data:")) return dataOrig;
  const src = $el.attr("src");
  if (src && !src.startsWith("data:")) return src;
  const dataSrc = $el.attr("data-src");
  if (dataSrc && !dataSrc.startsWith("data:")) return dataSrc;
  return dataOrig || src || dataSrc || "";
}

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// =============================================
// 列表页加载函数
// =============================================

async function loadPage(params = {}) {
  try {
    const baseUrl = params.url || "https://ok.xxx/";
    const page = Number(params.page || params.from || 1);
    const url = page > 1 ? `${baseUrl.replace(/\/+$/, "")}/${page}/` : baseUrl;
    
    const res = await Widget.http.get(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    
    const html = res.data;
    if (!html) throw new Error("空响应");
    
    const $ = Widget.html.load(html);
    const videos = [];
    
    $(".item.thumb-bl").each((i, el) => {
      const item = Widget.html.load(el);
      const v = parseVideoId(item, $);
      if (v) videos.push(v);
    });
    
    return videos;
  } catch (error) {
    console.error("[OKXXX] loadPage 失败:", error.message || error);
    throw error;
  }
}

// =============================================
// 网页浏览（通用URL/搜索输入，合并loadChannels/models/tags功能）
// =============================================

async function loadWebBrowse(params = {}) {
  try {
    const query = (params.query || "").trim();
    const page = Number(params.page || params.from || 1);
    let url = "";
    
    if (query.startsWith("http://") || query.startsWith("https://")) {
      url = query;
    } else if (query.startsWith("/")) {
      url = "https://ok.xxx" + query;
    } else if (query) {
      url = page > 1
        ? `https://ok.xxx/search/?q=${encodeURIComponent(query)}&page=${page}`
        : `https://ok.xxx/search/?q=${encodeURIComponent(query)}`;
    } else {
      throw new Error("请输入搜索关键词或 ok.xxx 地址");
    }
    
    if (page > 1 && !url.includes("search?")) {
      url = url.replace(/\/+$/, "") + `/${page}/`;
    }
    
    const res = await Widget.http.get(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    
    const html = res.data;
    if (!html) throw new Error("空响应");
    
    const $ = Widget.html.load(html);
    const videos = [];
    
    $(".item.thumb-bl").each((i, el) => {
      const item = Widget.html.load(el);
      const v = parseVideoId(item, $);
      if (v) videos.push(v);
    });
    
    return videos;
  } catch (error) {
    console.error("[OKXXX] loadWebBrowse 失败:", error.message || error);
    throw error;
  }
}

// =============================================
// 搜索
// =============================================

async function search(params = {}) {
  try {
    const keyword = params.keyword || "";
    const page = Number(params.page || 1);
    if (!keyword.trim()) throw new Error("请输入搜索关键词");
    
    const url = page > 1
      ? `https://ok.xxx/search/?q=${encodeURIComponent(keyword.trim())}&page=${page}`
      : `https://ok.xxx/search/?q=${encodeURIComponent(keyword.trim())}`;
    
    const res = await Widget.http.get(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    
    const html = res.data;
    if (!html) throw new Error("空响应");
    
    const $ = Widget.html.load(html);
    const videos = [];
    
    $(".item.thumb-bl").each((i, el) => {
      const item = Widget.html.load(el);
      const v = parseVideoId(item, $);
      if (v) videos.push(v);
    });
    
    return videos;
  } catch (error) {
    console.error("[OKXXX] search 失败:", error.message || error);
    throw error;
  }
}

// =============================================
// 详情页函数
// =============================================

async function loadDetail(link) {
  try {
    if (!link) return null;
    
    // 从完整URL或 detail: 格式中提取ID
    let id = "";
    const urlMatch = link.match(/\/video\/(\d+)\//);
    if (urlMatch) {
      id = urlMatch[1];
    } else if (link.startsWith("detail:")) {
      id = link.replace("detail:", "");
    }
    if (!id) return null;
    
    const url = `https://ok.xxx/video/${id}/`;
    
    const res = await Widget.http.get(url, {
      headers: {
        "User-Agent": UA,
        Referer: "https://ok.xxx/",
      },
    });
    
    const html = res.data;
    if (!html) return null;
    
    const $ = Widget.html.load(html);
    
    // 标题
    const title = $("h1").text().trim() || $("title").text().replace(/^Video.*?-\s*/, "").replace(/\s*-\s*OK\.XXX$/, "").trim();
    
    // 封面
    const posterEl = $("img[src*='videos_screenshots']").first();
    let posterPath = posterEl.attr("src") || getThumbnailUrl(id);
    if (posterPath && !posterPath.startsWith("http")) {
      posterPath = getThumbnailUrl(id);
    }
    
    // 描述/标签信息
    const descEl = $(".block-des, .video-info .text, [class*='description']").first();
    const description = descEl.text().trim() || "";
    
    // 提取标签
    const tags = [];
    $(".video-tags a, .video-tags li a, ul[class*='tag'] a").each((i, el) => {
      const tagName = $(el).text().trim();
      const tagHref = normalizeUrl($(el).attr("href") || "");
      if (tagName && tagHref.includes("/tags/")) {
        tags.push({
          id: tagName.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-"),
          title: tagName,
        });
      }
    });
    
    // 提取频道
    const channels = [];
    $("a[href*='/sites/']").each((i, el) => {
      const name = $(el).text().trim();
      if (name) {
        channels.push({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          title: name,
        });
      }
    });
    
    // 提取时长和浏览量
    const durationText = $("meta[property='video:duration']").attr("content") || "";
    const duration = durationText ? parseInt(durationText, 10) : 0;
    const durationFormatted = duration ? formatDuration(duration) : "";
    
    // 视频URL - 从页面脚本中提取 get_file 链接
    // get_file 返回 302 → CDN 直链
    let videoUrl = "";
    const urlMatch2 = html.match(/let url = '([^']+)'/);
    if (urlMatch2) {
      videoUrl = urlMatch2[1];
    }
    // 提取预览URL（direct MP4 360p）
    let previewUrl = "";
    const previewMatch = html.match(/\$history_preview\s*=\s*"([^"]+)"/);
    if (previewMatch) {
      previewUrl = previewMatch[1];
    }
    
    // 视频URL - get_file 返回 302 → CDN 直链
    // AVPlayer 自动跟随重定向，不需要手动解析
    const resolvedUrl = videoUrl || previewUrl || "";
    
    // 提取相关视频
    const relatedItems = [];
    $(".related-videos .item.thumb-bl").each((i, el) => {
      const item = Widget.html.load(el);
      const linkEl = item("a[href*='/video/']").first();
      const href = normalizeUrl(linkEl.attr("href") || "");
      const rid = href.match(/\/video\/(\d+)\//)?.[1] || "";
      if (!rid) return;
      
      const rtitle = linkEl.attr("title") || linkEl.text().trim() || "";
      const rimg = item("img").first();
      const rposter = getImgSrc(rimg) || getThumbnailUrl(rid);
      
      const rInfoText = item(".thumb-bl-info").text().trim() || "";
      const rDurationMatch = rInfoText.match(/(\d+:\d+(?::\d+)?)/);
      
      relatedItems.push({
        id: `okxxx:${rid}`,
        type: "url",
        title: rtitle || "Related",
        posterPath: rposter.startsWith("http") ? rposter : getThumbnailUrl(rid),
        backdropPath: rposter.startsWith("http") ? rposter : getThumbnailUrl(rid),
        durationText: rDurationMatch ? rDurationMatch[1] : "",
        link: `https://ok.xxx/video/${rid}/`,
      });
      
      if (relatedItems.length >= 20) return false;
    });
    
    return {
      id: `okxxx:${id}`,
      type: "detail",
      title: title || `Video #${id}`,
      posterPath: posterPath,
      description: description,
      durationText: durationFormatted || "",
      duration: duration,
      genreItems: [...tags, ...channels].slice(0, 20),
      relatedItems: relatedItems.slice(0, 20),
      videoUrl: resolvedUrl || undefined,
      previewUrl: previewUrl || undefined,
      playerType: "system",
      customHeaders: {
        "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://ok.xxx/",
        "Origin": "https://ok.xxx",
      },
    };
  } catch (error) {
    console.error("[OKXXX] loadDetail 失败:", error.message || error);
    return null;
  }
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
