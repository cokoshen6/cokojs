// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.bilibili",
  title: "BiliBili",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "哔哩哔哩视频浏览",
  author: "Minis",
  site: "https://www.bilibili.com",
  detailCacheDuration: 300,
  globalParams: [
    { name: "sessdata", title: "SESSDATA (可选)", type: "input", value: "" },
  ],
  modules: [
    { id: "category", title: "分区浏览", functionName: "loadCategory", type: "video", cacheDuration: 600,
      params: [{ name: "rid", title: "分区", type: "enumeration", value: "3",
        enumOptions: [
          { title: "全站", value: "0" }, { title: "动画", value: "1" },
          { title: "音乐", value: "3" }, { title: "游戏", value: "4" },
          { title: "娱乐", value: "5" }, { title: "影视", value: "181" },
          { title: "纪录片", value: "177" }, { title: "知识", value: "36" },
          { title: "科技", value: "188" }, { title: "运动", value: "234" },
          { title: "汽车", value: "223" }, { title: "生活", value: "160" },
          { title: "美食", value: "211" }, { title: "动物圈", value: "217" },
          { title: "鬼畜", value: "119" }, { title: "舞蹈", value: "129" },
          { title: "时尚", value: "155" }, { title: "电影", value: "23" },
          { title: "电视剧", value: "11" },
        ],
      }] },
    { id: "recommend", title: "首页推荐", functionName: "loadRecommend", type: "video", cacheDuration: 600, params: [{ name: "page", title: "页码", type: "page" }] },
    { id: "following", title: "关注动态", functionName: "loadFollowing", type: "video", cacheDuration: 600, params: [{ name: "page", title: "页码", type: "page" }] },
    { id: "hot", title: "热门视频", functionName: "loadHot", type: "video", cacheDuration: 600, params: [{ name: "page", title: "页码", type: "page" }] },
  ],
  search: { title: "搜索", functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "order", title: "排序", type: "enumeration", value: "totalrank",
        enumOptions: [{ title: "综合", value: "totalrank" }, { title: "最新", value: "pubdate" }, { title: "最多播放", value: "click" }, { title: "最多弹幕", value: "dm" }] },
      { name: "duration", title: "时长", type: "enumeration", value: "0",
        enumOptions: [{ title: "全部", value: "0" }, { title: "10分钟以下", value: "1" }, { title: "10-30分钟", value: "2" }, { title: "30-60分钟", value: "3" }, { title: "60分钟以上", value: "4" }] },
      { name: "page", title: "页码", type: "page" },
    ] },
};

var API="https://api.bilibili.com", UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var WBI_MIXIN="0000001112233344444444455667777788888999aaaaaabbbbccccddeeffffff";
function hd(sd){var h={"User-Agent":UA,Referer:"https://www.bilibili.com/"};if(sd) h.Cookie="SESSDATA="+encodeURIComponent(sd);return h;}

var md5=(function(){
  var H=[1732584193,-271733879,-1732584194,271733878],S=[[7,12,17,22],[5,9,14,20],[4,11,16,23],[6,10,15,21]];
  var T=[-680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329,-165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734,-378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651,-198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551];
  var O=[];
  for(var z=0;z<64;z++){var f=z<16?function(a,b,c,d,x,s,t){return ((a+(b&c|~b&d)+x+t)<<s|(a+(b&c|~b&d)+x+t)>>>(32-s))+b;}:z<32?function(a,b,c,d,x,s,t){return ((a+(b&d|c&~d)+x+t)<<s|(a+(b&d|c&~d)+x+t)>>>(32-s))+b;}:z<48?function(a,b,c,d,x,s,t){return ((a+(b^c^d)+x+t)<<s|(a+(b^c^d)+x+t)>>>(32-s))+b;}:function(a,b,c,d,x,s,t){return ((a+(c^(b|~d))+x+t)<<s|(a+(c^(b|~d))+x+t)>>>(32-s))+b;};O.push(f);}
  function r(x){var s="";for(var j=0;j<4;j++) s+="0123456789abcdef"[(x>>(j*8+4))&0xF]+"0123456789abcdef"[(x>>(j*8))&0xF];return s;}
  return function(s){
    var n=((s.length+8)>>6)+1,b=new Array(n*16),i,a=H[0],c=H[1],d=H[2],e=H[3];
    for(i=0;i<n*16;i++) b[i]=0;
    for(i=0;i<s.length;i++) b[i>>2]|=s.charCodeAt(i)<<((i%4)*8);
    b[i>>2]|=0x80<<((i%4)*8);b[n*16-2]=s.length*8;
    for(i=0;i<b.length;i+=16){var oa=a,ob=c,oc=d,od=e;
      for(var j=0;j<64;j++){var k=j<16?j:j<32?(5*j+1)%16:j<48?(3*j+5)%16:(7*j)%4;var t=O[j](a,c,d,b[i+k],S[j>>4][j%4],T[j]);a=d;d=c;c=t;}
      a+=oa;c+=ob;d+=oc;e+=od;}
    return r(a)+r(c)+r(d)+r(e);
  };
})();

function wbiSign(p){p.wts=Math.floor(Date.now()/1000);var k=Object.keys(p).sort();p.w_rid=md5(k.map(function(k){return k+"="+String(p[k]);}).join("&")+"&wts="+p.wts+WBI_MIXIN);return p;}
function qs(u){var k=Object.keys(u).sort();return "?"+k.map(function(k){return k+"="+String(u[k]);}).join("&");}
function pv(v){return{id:v.bvid||v.aid,type:"link",title:String(v.title||"").replace(/<[^>]*>/g,""),coverUrl:v.pic||"",link:"bilibili:"+(v.bvid||v.aid),rating:v.stat&&v.stat.view,durationText:v.duration?function(s){var h=Math.floor(s/60),m=s%60;return h>0?h+":"+(m<10?"0":"")+m:"0:"+(s<10?"0":"")+s;}(v.duration):undefined,description:v.author||(v.owner&&v.owner.name)||""};}

async function loadRecommend(p){var sd=p.sessdata||"",params={fresh_type:4,page:Number(p.page)||1,web_location:1315873};wbiSign(params);var r=await Widget.http.get(API+"/x/web-interface/wbi/index/top/feed/rcmd"+qs(params),{headers:hd(sd)});var d=r&&r.data;if(!d||d.code!==0) throw new Error("推荐获取失败");var l=d.data&&d.data.item||[];if(!l.length) throw new Error("暂无推荐");return l.map(pv);}
async function loadCategory(p){var sd=p.sessdata||"",r=await Widget.http.get(API+"/x/web-interface/ranking/v2?rid="+(p.rid||"0")+"&type=all",{headers:hd(sd)});var d=r&&r.data;if(!d||d.code!==0) throw new Error("分区获取失败");var l=d.data&&d.data.list||[];if(!l.length) throw new Error("该分区暂无内容");return l.map(pv);}
async function loadFollowing(p){var sd=p.sessdata||"",r=await Widget.http.get(API+"/x/polymer/web-dynamic/v1/feed/all?type=video&page="+(Number(p.page)||1),{headers:hd(sd)});var d=r&&r.data;if(!d||d.code!==0) throw new Error("关注动态获取失败");var items=d.data&&d.data.items||[],res=[];for(var i=0;i<items.length;i++){var a=(((items[i].modules||{}).module_dynamic||{}).major||{}).archive||{};if(!a.bvid)continue;res.push({id:a.bvid,type:"link",title:String(a.title||"").replace(/<[^>]*>/g,""),coverUrl:a.cover||"",link:"bilibili:"+a.bvid,rating:a.stat&&a.stat.view,durationText:a.duration_text||undefined});}if(!res.length) throw new Error("关注动态暂无更新");return res;}
async function loadHot(p){var sd=p.sessdata||"",r=await Widget.http.get(API+"/x/web-interface/ranking/v2?rid=0&type=all",{headers:hd(sd)});var d=r&&r.data;if(!d||d.code!==0) throw new Error("热门获取失败");var l=d.data&&d.data.list||[];return l.map(pv);}
async function search(p){var kw=String(p.keyword||"").trim();if(!kw) throw new Error("请输入关键词");var sd=p.sessdata||"",params={keyword:kw,search_type:"video",page:Number(p.page)||1,order:p.order||"totalrank",duration:p.duration||"0"};wbiSign(params);var r=await Widget.http.get(API+"/x/web-interface/search/type"+qs(params),{headers:hd(sd)});var d=r&&r.data;if(!d||d.code!==0) throw new Error("搜索失败");var res=d.data&&d.data.result||[];if(!res.length) throw new Error("没有找到结果");return res.map(pv);}

async function loadDetail(link){
  if(!link||link.indexOf("bilibili:")!==0) return null;
  var bvid=link.replace("bilibili:",""), pi=0;
  if(bvid.indexOf(":")>0){var pp=bvid.split(":");pi=parseInt(pp[1],10)||0;bvid=pp[0];}

  var ir=await Widget.http.get(API+"/x/web-interface/view?bvid="+encodeURIComponent(bvid),{headers:hd()});
  var id=ir&&ir.data;if(!id||id.code!==0) return null;
  var v=id.data;if(!v) return null;
  var aid=v.aid,pg=v.pages||[];
  if(pi<0||pi>=pg.length) pi=0;
  var cid=pg[pi]&&pg[pi].cid;

  var eps=[];for(var ei=0;ei<pg.length;ei++) eps.push({id:"ep:"+pg[ei].cid,title:(ei+1)+": "+(pg[ei].part||"P"+(ei+1)),type:"url",link:"bilibili:"+bvid+":"+ei});

  var vu="";
  if(cid&&aid){try{var fr=await Widget.http.get(API+"/x/player/playurl?avid="+aid+"&cid="+cid+"&qn=80&platform=ios&otype=json&fourk=1",{headers:hd()});var fd=fr&&fr.data;if(fd&&fd.code===0&&fd.data&&fd.data.durl) vu=fd.data.durl[0].url;}catch(e){}}
  return{id:link,type:"video",title:v.title||bvid,link:link,posterPath:v.pic||undefined,videoUrl:vu||undefined,videoSources:vu?[{url:vu,type:"video/mp4",label:"1080P"}]:undefined,description:(v.desc||"")+"\nUP主: "+(v.owner?v.owner.name:""),rating:v.stat?v.stat.view:undefined,genreItems:(v.tid&&v.tname)?[{id:String(v.tid),title:v.tname}]:undefined,episodeItems:eps.length>1?eps:undefined,relatedItems:undefined,customHeaders:{Referer:"https://www.bilibili.com/"}};
}
