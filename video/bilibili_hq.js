// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.bilibili",
  title: "BiliBili HQ",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "哔哩哔哩高画质版（支持 1080P+ / 4K）",
  author: "Minis",
  site: "https://www.bilibili.com",
  detailCacheDuration: 300,
  globalParams: [
    { name: "sessdata", title: "SESSDATA (推荐)", type: "input", value: "" },
    { name: "prefer_quality", title: "优先画质", type: "enumeration", value: "112",
      enumOptions: [
        { title: "4K (需大会员)", value: "120" },
        { title: "1080P60 (需大会员)", value: "116" },
        { title: "1080P+ (需大会员)", value: "112" },
        { title: "1080P", value: "80" },
        { title: "720P", value: "64" },
      ],
    },
  ],
  modules: [
    {
      id: "category",
      title: "分区浏览",
      functionName: "loadCategory",
      type: "video",
      cacheDuration: 600,
      params: [
        { name: "rid", title: "分区", type: "enumeration", value: "3",
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

// ========== 纯 JS MD5（基于 crypt 算法，兼容所有环境）==========
var md5 = (function() {
  var hex_chr = "0123456789abcdef";
  function rhex(n) { var s = ""; for (var j = 0; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0xF] + hex_chr[(n >> (j * 8)) & 0xF]; return s; }
  function str2blks(s) {
    var nblk = ((s.length + 8) >> 6) + 1;
    var blks = new Array(nblk * 16);
    for (var i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < s.length; i++) blks[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8);
    blks[nblk * 16 - 2] = s.length * 8;
    return blks;
  }
  function add(x, y) { var l = (x & 0xFFFF) + (y & 0xFFFF); return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xFFFF); }
  function add5(a, b, c, d, e) { return add(add(add(add(a, b), c), d), e); }
  function cmn(q, a, b, x, s, t) { return add((add(a, q) + add(x, t)) << s | (add(a, q) + add(x, t)) >>> (32 - s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  
  return function(s) {
    var x = str2blks(s);
    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (var i = 0; i < x.length; i += 16) {
      var oa = a, ob = b, oc = c, od = d;
      a = ff(a, b, c, d, x[i+0], 7, -680876936); d = ff(d, a, b, c, x[i+1], 12, -389564586);
      c = ff(c, d, a, b, x[i+2], 17, 606105819); b = ff(b, c, d, a, x[i+3], 22, -1044525330);
      a = ff(a, b, c, d, x[i+4], 7, -176418897); d = ff(d, a, b, c, x[i+5], 12, 1200080426);
      c = ff(c, d, a, b, x[i+6], 17, -1473231341); b = ff(b, c, d, a, x[i+7], 22, -45705983);
      a = ff(a, b, c, d, x[i+8], 7, 1770035416); d = ff(d, a, b, c, x[i+9], 12, -1958414417);
      c = ff(c, d, a, b, x[i+10], 17, -42063); b = ff(b, c, d, a, x[i+11], 22, -1990404162);
      a = ff(a, b, c, d, x[i+12], 7, 1804603682); d = ff(d, a, b, c, x[i+13], 12, -40341101);
      c = ff(c, d, a, b, x[i+14], 17, -1502002290); b = ff(b, c, d, a, x[i+15], 22, 1236535329);
      a = gg(a, b, c, d, x[i+1], 5, -165796510); d = gg(d, a, b, c, x[i+6], 9, -1069501632);
      c = gg(c, d, a, b, x[i+11], 14, 643717713); b = gg(b, c, d, a, x[i+0], 20, -373897302);
      a = gg(a, b, c, d, x[i+5], 5, -701558691); d = gg(d, a, b, c, x[i+10], 9, 38016083);
      c = gg(c, d, a, b, x[i+15], 14, -660478335); b = gg(b, c, d, a, x[i+4], 20, -405537848);
      a = gg(a, b, c, d, x[i+9], 5, 568446438); d = gg(d, a, b, c, x[i+14], 9, -1019803690);
      c = gg(c, d, a, b, x[i+3], 14, -187363961); b = gg(b, c, d, a, x[i+8], 20, 1163531501);
      a = gg(a, b, c, d, x[i+13], 5, -1444681467); d = gg(d, a, b, c, x[i+2], 9, -51403784);
      c = gg(c, d, a, b, x[i+7], 14, 1735328473); b = gg(b, c, d, a, x[i+12], 20, -1926607734);
      a = hh(a, b, c, d, x[i+5], 4, -378558); d = hh(d, a, b, c, x[i+8], 11, -2022574463);
      c = hh(c, d, a, b, x[i+11], 16, 1839030562); b = hh(b, c, d, a, x[i+14], 23, -35309556);
      a = hh(a, b, c, d, x[i+1], 4, -1530992060); d = hh(d, a, b, c, x[i+4], 11, 1272893353);
      c = hh(c, d, a, b, x[i+7], 16, -155497632); b = hh(b, c, d, a, x[i+10], 23, -1094730640);
      a = hh(a, b, c, d, x[i+13], 4, 681279174); d = hh(d, a, b, c, x[i+0], 11, -358537222);
      c = hh(c, d, a, b, x[i+3], 16, -722521979); b = hh(b, c, d, a, x[i+6], 23, 76029189);
      a = hh(a, b, c, d, x[i+9], 4, -640364487); d = hh(d, a, b, c, x[i+12], 11, -421815835);
      c = hh(c, d, a, b, x[i+15], 16, 530742520); b = hh(b, c, d, a, x[i+2], 23, -995338651);
      a = ii(a, b, c, d, x[i+0], 6, -198630844); d = ii(d, a, b, c, x[i+7], 10, 1126891415);
      c = ii(c, d, a, b, x[i+14], 15, -1416354905); b = ii(b, c, d, a, x[i+5], 21, -57434055);
      a = ii(a, b, c, d, x[i+12], 6, 1700485571); d = ii(d, a, b, c, x[i+3], 10, -1894986606);
      c = ii(c, d, a, b, x[i+10], 15, -1051523); b = ii(b, c, d, a, x[i+1], 21, -2054922799);
      a = ii(a, b, c, d, x[i+8], 6, 1873313359); d = ii(d, a, b, c, x[i+15], 10, -30611744);
      c = ii(c, d, a, b, x[i+6], 15, -1560198380); b = ii(b, c, d, a, x[i+13], 21, 1309151649);
      a = ii(a, b, c, d, x[i+4], 6, -145523070); d = ii(d, a, b, c, x[i+11], 10, -1120210379);
      c = ii(c, d, a, b, x[i+2], 15, 718787259); b = ii(b, c, d, a, x[i+9], 21, -343485551);
      a = add(a, oa); b = add(b, ob); c = add(c, oc); d = add(d, od);
    }
    return rhex(a) + rhex(b) + rhex(c) + rhex(d);
  };
})();

// ========== WBI 签名（硬编码 mixin key，WBI key 几小时一变）==========
var WBI_MIXIN = "0000001112233344444444455667777788888999aaaaaabbbbccccddeeffffff";

function wbiSign(params) {
  params.wts = Math.floor(Date.now() / 1000);
  var keys = Object.keys(params).sort();
  var q = [];
  for (var i = 0; i < keys.length; i++) {
    q.push(keys[i] + "=" + String(params[keys[i]]));
  }
  params.w_rid = md5(q.join("&") + "&wts=" + params.wts + WBI_MIXIN);
  return params;
}

function buildUrl(base, params) {
  var qs = Object.keys(params).map(function(k) { return k + "=" + String(params[k]); }).join("&");
  return base + "?" + qs;
}

// ========== 解析 ==========
function parseVideoItem(v) {
  return {
    id: v.bvid || v.aid, type: "link",
    title: String(v.title || "").replace(/<[^>]*>/g, ""),
    coverUrl: v.pic || "",
    link: "bilibili:" + (v.bvid || v.aid),
    rating: v.stat && v.stat.view,
    durationText: v.duration ? (function(s){
      var h = Math.floor(s / 60), m = s % 60;
      return h > 0 ? h + ":" + (m < 10 ? "0" : "") + m : "0:" + (s < 10 ? "0" : "") + s;
    })(v.duration) : undefined,
    description: v.author || (v.owner && v.owner.name) || "",
  };
}

async function loadRecommend(p) {
  var sd = p.sessdata || "";
  var params = { fresh_type: 4, page: Number(p.page) || 1, web_location: 1315873 };
  wbiSign(params);
  var res = await Widget.http.get(buildUrl(API + "/x/web-interface/wbi/index/top/feed/rcmd", params), { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("推荐获取失败");
  var list = d.data && d.data.item || [];
  if (!list.length) throw new Error("暂无推荐");
  return list.map(parseVideoItem);
}

// ========== 分区浏览 ==========

async function loadCategory(p) {
  var sd = p.sessdata || "";
  var rid = String(p.rid || "0");
  var url = API + "/x/web-interface/ranking/v2?rid=" + rid + "&type=all";
  var res = await Widget.http.get(url, { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("分区获取失败");
  var list = d.data && d.data.list || [];
  if (!list.length) throw new Error("该分区暂无内容");
  return list.map(parseVideoItem);
}

async function loadFollowing(p) {
  var sd = p.sessdata || "";
  var url = buildUrl(API + "/x/polymer/web-dynamic/v1/feed/all", { type: "video", page: Number(p.page) || 1 });
  var res = await Widget.http.get(url, { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("关注动态获取失败");
  var items = d.data && d.data.items || [];
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var archive = (((items[i].modules || {}).module_dynamic || {}).major || {}).archive || {};
    if (!archive.bvid) continue;
    result.push({ id: archive.bvid, type: "link", title: String(archive.title || "").replace(/<[^>]*>/g, ""), coverUrl: archive.cover || "", link: "bilibili:" + archive.bvid, rating: archive.stat && archive.stat.view, durationText: archive.duration_text || undefined });
  }
  if (!result.length) throw new Error("关注动态暂无更新");
  return result;
}

async function loadHot(p) {
  var sd = p.sessdata || "";
  var res = await Widget.http.get(API + "/x/web-interface/ranking/v2?rid=0&type=all", { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("热门获取失败");
  var list = d.data && d.data.list || [];
  return list.map(parseVideoItem);
}

async function search(p) {
  var kw = String(p.keyword || "").trim();
  if (!kw) throw new Error("请输入关键词");
  var sd = p.sessdata || "";
  var params = { keyword: kw, search_type: "video", page: Number(p.page) || 1, order: p.order || "totalrank", duration: p.duration || "0" };
  wbiSign(params);
  var res = await Widget.http.get(buildUrl(API + "/x/web-interface/search/type", params), { headers: buildHeaders(sd) });
  var d = res && res.data;
  if (!d || d.code !== 0) throw new Error("搜索失败");
  var result = d.data && d.data.result || [];
  if (!result.length) throw new Error("没有找到结果");
  return result.map(parseVideoItem);
}

async function loadDetail(link) {
  if (!link || link.indexOf("bilibili:") !== 0) return null;
  var bvid = link.replace("bilibili:", "");
  if (!bvid) return null;
  // 解析分 P 索引
  var pageIndex = 0;
  if (bvid.indexOf(":") > 0) { var pp = bvid.split(":"); pageIndex = parseInt(pp[1],10)||0; bvid = pp[0]; }

  // 尝试从 Widget.storage 读取 sessdata
  var sd = "";
  var preferQn = 112;
  try { var stored = Widget.storage.get("sessdata"); if (stored) sd = stored; } catch(e) {}
  try { if (arguments[1] && arguments[1].sessdata) sd = arguments[1].sessdata; } catch(e) {}
  try { var qStr = Widget.storage.get("prefer_quality"); if (qStr) preferQn = parseInt(qStr,10) || 112; } catch(e) {}
  try { if (arguments[1] && arguments[1].prefer_quality) preferQn = parseInt(arguments[1].prefer_quality,10) || 112; } catch(e) {}

  var infoRes = await Widget.http.get(API + "/x/web-interface/view?bvid=" + encodeURIComponent(bvid), { headers: buildHeaders(sd) });
  var infoData = infoRes && infoRes.data;
  if (!infoData || infoData.code !== 0) return null;
  var v = infoData.data;
  if (!v) return null;

  var title = v.title || bvid;
  var poster = v.pic || "";
  var aid = v.aid;
  var pages = v.pages || [];
  if (pageIndex < 0 || pageIndex >= pages.length) pageIndex = 0;
  var cid = pages[pageIndex] && pages[pageIndex].cid;

  // 分 P 列表
  var episodeItems = [];
  for (var ei = 0; ei < pages.length; ei++) {
    episodeItems.push({ id: "ep:" + pages[ei].cid, title: (ei+1) + ": " + (pages[ei].part || "P"+(ei+1)), link: "bilibili:" + bvid + ":" + ei });
  }

  // 稳定获取播放 URL（WBI 高画质 → 老 API fallback）
  var videoUrl = "";
  if (cid && aid) {
    try {
      var hqP = { bvid: bvid, cid: cid, qn: preferQn, fnval: 0, fnver: 0, fourk: 1, platform: "html5", web_location: 1315873 };
      wbiSign(hqP);
      var hqR = await Widget.http.get(buildUrl(API + "/x/player/wbi/playurl", hqP), { headers: buildHeaders(sd) });
      var hqD = hqR && hqR.data;
      if (hqD && hqD.code === 0 && hqD.data && hqD.data.durl) videoUrl = hqD.data.durl[0].url;
    } catch(e) {}
    try {
      var fbR = await Widget.http.get(API + "/x/player/playurl?avid=" + aid + "&cid=" + cid + "&qn=80&platform=html5&otype=json", { headers: buildHeaders(sd) });
      var fbD = fbR && fbR.data;
      if (fbD && fbD.code === 0 && fbD.data && fbD.data.durl) videoUrl = videoUrl || fbD.data.durl[0].url;
    } catch(e) {}
  }

  return {
    id: link, type: "video", title: title, link: link,
    posterPath: poster || undefined,
    videoUrl: videoUrl || undefined,
    videoSources: videoUrl ? [{ url: videoUrl, type: "video/mp4", label: "HQ" }] : undefined,
    description: (v.desc || "") + "\nUP主: " + (v.owner ? v.owner.name : ""),
    rating: v.stat ? v.stat.view : undefined,
    genreItems: (v.tid && v.tname) ? [{ id: String(v.tid), title: v.tname }] : undefined,
    episodeItems: episodeItems.length > 1 ? episodeItems : undefined,
    relatedItems: undefined,
    customHeaders: { Referer: "https://www.bilibili.com/" },
  };
}

// ========== （弹幕功能已移除）==========
