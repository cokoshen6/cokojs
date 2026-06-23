// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.bilibili",
  title: "BiliBili",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "哔哩哔哩视频搜索与播放",
  author: "Minis",
  site: "https://www.bilibili.com",
  detailCacheDuration: 300,
  globalParams: [
    { name: "sessdata", title: "SESSDATA (可选)", type: "input", value: "" },
  ],
  modules: [
    {
      id: "category",
      title: "分区浏览",
      functionName: "loadCategory",
      type: "video",
      cacheDuration: 600,
      params: [
        { name: "rid", title: "分区", type: "enumeration", value: "1",
          enumOptions: [
            { title: "全站", value: "0" },
            { title: "动画", value: "1" },
            { title: "音乐", value: "3" },
            { title: "游戏", value: "4" },
            { title: "娱乐", value: "5" },
            { title: "影视", value: "181" },
            { title: "纪录片", value: "177" },
            { title: "知识", value: "36" },
            { title: "科技", value: "188" },
            { title: "运动", value: "234" },
            { title: "汽车", value: "223" },
            { title: "生活", value: "160" },
            { title: "美食", value: "211" },
            { title: "动物圈", value: "217" },
            { title: "鬼畜", value: "119" },
            { title: "舞蹈", value: "129" },
            { title: "时尚", value: "155" },
            { title: "电影", value: "23" },
            { title: "电视剧", value: "11" },
          ],
        },
      ],
    },
    {
      id: "recommend",
      title: "首页推荐",
      functionName: "loadRecommend",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "following",
      title: "关注动态",
      functionName: "loadFollowing",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
    {
      id: "hot",
      title: "热门视频",
      functionName: "loadHot",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }],
    },
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "order", title: "排序", type: "enumeration", value: "totalrank",
        enumOptions: [
          { title: "综合", value: "totalrank" },
          { title: "最新", value: "pubdate" },
          { title: "最多播放", value: "click" },
          { title: "最多弹幕", value: "dm" },
        ],
      },
      { name: "duration", title: "时长", type: "enumeration", value: "0",
        enumOptions: [
          { title: "全部", value: "0" },
          { title: "10分钟以下", value: "1" },
          { title: "10-30分钟", value: "2" },
          { title: "30-60分钟", value: "3" },
          { title: "60分钟以上", value: "4" },
        ],
      },
      { name: "page", title: "页码", type: "page" },
    ],
  },
};

var API = "https://api.bilibili.com";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function buildHeaders(sessdata) {
  var h = { "User-Agent": UA, Referer: "https://www.bilibili.com/" };
  if (sessdata) h.Cookie = "SESSDATA=" + encodeURIComponent(sessdata);
  return h;
}

// ========== 纯 JS MD5 实现 ==========
var md5 = (function() {
  var hex = function(v) { return (v < 16 ? "0" : "") + v.toString(16); };
  var md5cycle = function(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  };
  var add32 = function(a, b) { return (a + b) & 0xFFFFFFFF; };
  var cmn = function(q, a, b, x, s, t) { return add32((add32(a, q) + add32(x, t)) << s | (add32(a, q) + add32(x, t)) >>> (32 - s), b); };
  var ff = function(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); };
  var gg = function(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); };
  var hh = function(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); };
  var ii = function(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); };

  return function(s) {
    var x = [], i, l = s.length, n = l * 8;
    for (i = 0; i < 64; i++) x[i] = 0;
    for (i = 0; i < l; i++) x[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    x[i >> 2] |= 0x80 << ((i % 4) * 8);
    if (i > 55) { md5cycle(x.slice(0, 16), x); x = x.slice(16).concat([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]); }
    x[14] = n;
    var a = [1732584193, -271733879, -1732584194, 271733878];
    for (i = 0; i < x.length; i += 16) md5cycle(a, x.slice(i, i + 16));
    return a.map(function(v) { return hex((v) & 0xFF) + hex((v >> 8) & 0xFF) + hex((v >> 16) & 0xFF) + hex((v >> 24) & 0xFF); }).join("");
  };
})();

// ========== WBI 签名 ==========
var wbiKey = { mixin: "", expires: 0 };

async function getWbiKey(sessdata) {
  if (wbiKey.expires > Date.now()) return wbiKey.mixin;
  try {
    var res = await Widget.http.get(API + "/x/web-interface/nav", { headers: buildHeaders(sessdata) });
    var d = res && res.data;
    if (!d || d.code !== 0) throw new Error("nav err");
    var wbi = d.data && d.data.wbi_img;
    if (!wbi) throw new Error("no wbi");
    var img = wbi.img_url.split("/").pop().split(".")[0];
    var sub = wbi.sub_url.split("/").pop().split(".")[0];
    wbiKey.mixin = (img + sub).split("").sort().join("");
    wbiKey.expires = Date.now() + 3600000;
    return wbiKey.mixin;
  } catch (e) {
    throw new Error("WBI key 获取失败: " + (e.message || e));
  }
}

async function wbiSign(params, sessdata) {
  var mixin = await getWbiKey(sessdata);
  params.wts = Math.floor(Date.now() / 1000);
  var keys = Object.keys(params).sort();
  var q = [];
  for (var i = 0; i < keys.length; i++) {
    q.push(keys[i] + "=" + encodeURIComponent(String(params[keys[i]])));
  }
  params.w_rid = md5(q.join("&") + mixin);
  return params;
}

function buildUrl(base, params) {
  var qs = Object.keys(params).map(function(k) { return k + "=" + encodeURIComponent(String(params[k])); }).join("&");
  return base + "?" + qs;
}

// ========== 解析搜索结果 ==========

function parseVideoItem(v) {
  return {
    id: v.bvid || v.aid,
    type: "link",
    title: String(v.title || "").replace(/<[^>]*>/g, ""),
    coverUrl: v.pic || "",
    link: "bilibili:" + (v.bvid || v.aid),
    rating: v.stat && v.stat.view,
    durationText: v.duration ? (function(s) {
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      return h > 0 ? h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec : m + ":" + (sec < 10 ? "0" : "") + sec;
    })(v.duration) : undefined,
    description: v.author || "",
  };
}

// ========== 首页推荐 ==========

async function loadRecommend(p) {
  var page = Number(p.page) || 1;
  var sd = p.sessdata || "";
  var params = { fresh_type: 4, page: page, web_location: 1315873 };
  await wbiSign(params, sd);
  var url = buildUrl(API + "/x/web-interface/wbi/index/top/feed/rcmd", params);
  var res = await Widget.http.get(url, { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("推荐获取失败");
  var list = d.data && d.data.item || [];
  return list.map(function(v) {
    return {
      id: v.bvid || v.aid, type: "link",
      title: String(v.title || "").replace(/<[^>]*>/g, ""),
      coverUrl: v.pic || "",
      link: "bilibili:" + (v.bvid || v.aid),
      rating: v.stat && v.stat.view,
      description: (v.owner && v.owner.name) || "",
      durationText: v.duration ? (function(s) {
        var h = Math.floor(s / 60), m = s % 60;
        return h > 0 ? h + ":" + (m < 10 ? "0" : "") + m : m + ":" + (s < 10 ? "0" : "") + s;
      })(v.duration) : undefined,
    };
  });
}

// ========== 关注动态 ==========

async function loadFollowing(p) {
  var page = Number(p.page) || 1;
  var sd = p.sessdata || "";
  var params = { type: "video", page: page };
  var url = buildUrl(API + "/x/polymer/web-dynamic/v1/feed/all", params);
  var res = await Widget.http.get(url, { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("关注动态获取失败");
  var items = d.data && d.data.items || [];
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var modules = item.modules || {};
    var mdt = modules.module_dynamic || {};
    var major = mdt.major || {};
    var archive = major.archive || {};
    if (!archive.bvid && !archive.aid) continue;
    result.push({
      id: archive.bvid || archive.aid, type: "link",
      title: String(archive.title || "").replace(/<[^>]*>/g, ""),
      coverUrl: archive.cover || "",
      link: "bilibili:" + (archive.bvid || archive.aid),
      rating: archive.stat && archive.stat.view,
      durationText: archive.duration_text || undefined,
      description: modules.module_author ? modules.module_author.name || "" : "",
    });
  }
  if (!result.length) throw new Error("关注动态暂无更新");
  return result;
}

// ========== 热门列表 ==========

async function loadHot(p) {
  var page = Number(p.page) || 1;
  var sd = p.sessdata || "";
  var url = API + "/x/web-interface/ranking/v2?rid=0&type=all";
  var res = await Widget.http.get(url, { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("热门获取失败");
  var list = d.data && d.data.list || [];
  return list.map(parseVideoItem);
}

// ========== 搜索 ==========

async function search(p) {
  var kw = String(p.keyword || "").trim();
  if (!kw) throw new Error("请输入关键词");
  var page = Number(p.page) || 1;
  var sd = p.sessdata || "";
  var params = {
    keyword: kw, search_type: "video", page: page,
    order: p.order || "totalrank", duration: p.duration || "0",
  };
  await wbiSign(params, sd);
  var url = buildUrl(API + "/x/web-interface/search/type", params);
  var res = await Widget.http.get(url, { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("搜索失败");
  var result = d.data && d.data.result || [];
  if (!result.length) throw new Error("没有找到结果");
  return result.map(parseVideoItem);
}

// ========== 详情 ==========

async function loadDetail(link) {
  if (!link || link.indexOf("bilibili:") !== 0) return null;
  var bvid = link.replace("bilibili:", "");
  if (!bvid) return null;
  // loadDetail 只接收 link 参数，通过闭包或全局变量获取 sessdata
  // 实际运行时 ForwardWidget 会把返回 type:"video" + videoUrl 交给播放器
  var sd = "";

  // 获取视频信息
  var infoUrl = API + "/x/web-interface/view?bvid=" + encodeURIComponent(bvid);
  var infoRes = await Widget.http.get(infoUrl, { headers: buildHeaders(sd) });
  var infoData = infoRes && infoRes.data;
  if (!infoData || infoData.code !== 0) return null;
  var v = infoData.data;
  if (!v) return null;

  var title = v.title || bvid;
  var poster = v.pic || "";
  var aid = v.aid;
  var pages = v.pages || [];

  // 解析分 P 索引（link 格式：bilibili:BVxxx 或 bilibili:BVxxx:2）
  var pageIndex = 0;
  var parts2 = link.split(":");
  if (parts2.length >= 3) pageIndex = parseInt(parts2[2], 10) || 0;
  if (pageIndex < 0 || pageIndex >= pages.length) pageIndex = 0;

  var cid = pages[pageIndex] && pages[pageIndex].cid;

  // 构建分 P 列表
  var episodeItems = [];
  for (var ei = 0; ei < pages.length; ei++) {
    episodeItems.push({
      id: "ep:" + pages[ei].cid,
      title: (ei + 1) + ": " + (pages[ei].part || "P" + (ei+1)),
      link: "bilibili:" + bvid + ":" + ei,
    });
  }

  // 相关推荐
  var relatedItems = [];
  if (v.bvid) {
    var relRes = await Widget.http.get(API + "/x/web-interface/archive/related?bvid=" + encodeURIComponent(v.bvid), { headers: buildHeaders(sd) });
    var relData = relRes && relRes.data;
    if (relData && relData.data) {
      relatedItems = (relData.data || []).map(function(item) {
        return {
          id: item.bvid, type: "link", title: String(item.title || "").replace(/<[^>]*>/g, ""),
          coverUrl: item.pic || "", link: "bilibili:" + item.bvid,
          durationText: item.duration ? (function(s){var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?h+":"+(m<10?"0":"")+m+":"+(sec<10?"0":""):m+":"+(sec<10?"0":"")+(sec||"00");})(item.duration) : undefined,
        };
      });
    }
  }

  // 获取播放 URL（使用无需 WBI 签名的老版 API，最高 1080P）
  var videoUrl = "";
  if (cid && v.aid) {
    try {
      var playUrl = API + "/x/player/playurl?avid=" + v.aid + "&cid=" + cid + "&qn=80&platform=html5&otype=json";
      var playRes = await Widget.http.get(playUrl, { headers: buildHeaders(sd) });
      var playData = playRes && playRes.data;
      if (playData && playData.code === 0 && playData.data) {
        var durl = playData.data.durl;
        if (durl && durl[0]) videoUrl = durl[0].url;
      }
    } catch (e) {
      // 播放地址获取失败不影响详情展示
    }
  }

  return {
    id: link, type: "video", title: title, link: link,
    posterPath: poster || undefined,
    videoUrl: videoUrl || undefined,
    videoSources: videoUrl ? [{ url: videoUrl, type: "video/mp4", label: "1080P" }] : undefined,
    description: (v.desc || "") + "\nUP主: " + (v.owner ? v.owner.name : ""),
    rating: v.stat ? v.stat.view : undefined,
    genreItems: (v.tid && v.tname) ? [{ id: String(v.tid), title: v.tname }] : undefined,
    episodeItems: episodeItems.length > 1 ? episodeItems : undefined,
    relatedItems: relatedItems.length ? relatedItems : undefined,
    customHeaders: { Referer: "https://www.bilibili.com/" },
  };
}
