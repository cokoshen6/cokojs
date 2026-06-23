WidgetMetadata = {
  id: "kbjfan",
  title: "KBJFan",
  author: "Minis",
  description: "KBJFan",
  version: "2.0.2",
  requiredVersion: "0.0.1",
  site: "https://www.kbjfan.com",
  modules: [
    {
      title: "Latest Korean BJ",
      functionName: "loadLatest",
      type: "video",
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "orderby", title: "排序", type: "enumeration", value: "", enumOptions: [
          { title: "默认", value: "" },
          { title: "View", value: "views" },
          { title: "Like", value: "like" },
          { title: "Comment", value: "comment_count" }
        ]}
      ]
    },
    {
      title: "Korean BJ Dance",
      functionName: "loadDance",
      type: "video",
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "orderby", title: "排序", type: "enumeration", value: "", enumOptions: [
          { title: "默认（按时间）", value: "" },
          { title: "View", value: "views" },
          { title: "Like", value: "like" },
          { title: "Comment", value: "comment_count" }
        ]}
      ]
    },
    {
      title: "Korean BJ Nude",
      functionName: "loadNude",
      type: "video",
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "orderby", title: "排序", type: "enumeration", value: "", enumOptions: [
          { title: "默认（按时间）", value: "" },
          { title: "View", value: "views" },
          { title: "Like", value: "like" },
          { title: "Comment", value: "comment_count" }
        ]}
      ]
    }
  ],
  search: null
};

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
var HEADERS = {
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

function stripTags(html) {
  return (html || "").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<br\/>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function fetchHTML(url) {
  return Widget.http.get(url, { headers: HEADERS }).then(function(resp) {
    if (!resp) return "";
    return typeof resp === "string" ? resp : (resp.data || "");
  });
}

function buildListUrl(baseUrl, page) {
  var url = baseUrl;
  if (page > 1) url += "page/" + page + "/";
  return url;
}

function loadCategory(params, baseUrl) {
  var page = 1;
  var orderby = "";
  
  if (params) {
    if (params.page) page = parseInt(params.page, 10) || 1;
    if (params.orderby) orderby = params.orderby;
  }
  
  var url = buildListUrl(baseUrl, page);
  if (orderby) url += (url.indexOf("?") === -1 ? "?" : "&") + "orderby=" + encodeURIComponent(orderby);
  
  return fetchHTML(url).then(function(html) {
    if (!html) return [{ id: "empty", type: "text", title: "加载失败" }];
    
    var results = [];
    var reg = /<posts[^>]*class="posts-item[^"]*card[^"]*ajax-item[^"]*"[^>]*>([\s\S]*?)<\/posts>/gi;
    var m;
    
    while ((m = reg.exec(html))) {
      var block = m[1];
      
      var imgM = block.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*fit-cover[^"]*"/i);
      var thumb = imgM ? imgM[1].replace(/&amp;/g, "&") : "";
      
      var titleM = block.match(/<h[23][^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h[23]>/i);
      if (!titleM) continue;
      var link = titleM[1].replace(/&amp;/g, "&");
      var title = stripTags(titleM[2]);
      if (!link || !title) continue;
      
      var dateM = block.match(/<span[^>]*title="([^"]+)"[^>]*>/);
      var date = dateM ? dateM[1].split(" ")[0] : "";
      
      var views = "";
      var vM = block.match(/icon-view[^>]*><\/svg>\s*([\d.]+[KMB]?)/i);
      if (vM) views = vM[1];
      
      var desc = date ? "📅 " + date : "";
      if (views) desc += (desc ? " | " : "") + "👁 " + views;
      
      results.push({
        id: link,
        type: "link",
        title: title,
        coverUrl: thumb,
        link: link,
        description: desc,
        backdropPath: thumb,
        posterPath: thumb,
        customHeaders: HEADERS
      });
    }
    
    // 翻页导航
    var nextPage = page + 1;
    results.push({
      id: "nav-" + nextPage,
      type: "link",
      title: "→ 翻到第 " + nextPage + " 页",
      link: baseUrl + "page/" + nextPage + "/" + (orderby ? "?orderby=" + encodeURIComponent(orderby) : ""),
      coverUrl: "",
      description: "修改「页码」参数为 " + nextPage
    });
    
    if (results.length === 0) {
      results.push({ id: "empty", type: "text", title: "没有找到视频" });
    }
    
    return results;
  });
}

function loadLatest(params) { return loadCategory(params, "https://www.kbjfan.com/"); }
function loadDance(params) { return loadCategory(params, "https://www.kbjfan.com/koreanbjdance/"); }
function loadNude(params) { return loadCategory(params, "https://www.kbjfan.com/koreanbjnude/"); }

async function loadDetail(link) {
  var url = String(link || "");
  if (url.indexOf("kbjfan.com") === -1) {
    return Promise.resolve({
      id: url,
      type: "url",
      title: url.split("/").pop() || "",
      link: url,
      customHeaders: HEADERS
    });
  }
  
  return fetchHTML(url).then(function(html) {
    if (!html) {
      return { id: url, type: "url", title: url.split("/").pop() || "", link: url, customHeaders: HEADERS };
    }
    
    var titleM = html.match(/<h1[^>]*class="article-title"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    var title = titleM ? stripTags(titleM[1]) : (url.split("/").pop() || "");
    
    var thumbM = html.match(/<img[^>]+src="([^"]+Previews[^"]+)"[^>]*class="[^"]*fit-cover[^"]*"/i) ||
                 html.match(/<img[^>]+class="[^"]*fit-cover[^"]*"[^>]+src="([^"]+Previews[^"]+)"/i);
    var thumb = thumbM ? thumbM[1].replace(/&amp;/g, "&") : "";
    
    var infoLines = [];
    var infoReg = /<p>([^<]+)<\/p>/gi;
    var im;
    while ((im = infoReg.exec(html))) {
      var t = stripTags(im[1]);
      if (t && (t.indexOf(":") !== -1 || t.indexOf("：") !== -1)) infoLines.push(t);
    }
    
    return {
      id: url,
      type: "url",
      title: title,
      link: url,
      coverUrl: thumb,
      backdropPath: thumb,
      posterPath: thumb,
      description: infoLines.join("\n"),
      customHeaders: HEADERS
    };
  });
};
