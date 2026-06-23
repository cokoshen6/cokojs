// @ts-check
/** @type {WidgetMetadata} */
WidgetMetadata = {
  id: "forward.bbcrec",
  title: "BBCREC",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "BBCREC - Free Interracial Porn Videos",
  author: "Minis",
  site: "https://bbcrec.com",
  detailCacheDuration: 300,
  modules: [
    {
      id: "hot",
      title: "🔥 热门",
      functionName: "loadHot",
      type: "video",
      cacheDuration: 600,
      params: [
        { name: "sort_by", title: "刷新", type: "enumeration", value: "hot",
          enumOptions: [
            { title: "🔥 热门", value: "hot" },
            { title: "🔄 刷新", value: "refresh" },
          ],
        },
      ],
    },
  ],
};

const SITE = "https://bbcrec.com";
const CDN = "https://xcdn.tv";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const HDR = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", Referer: SITE + "/" };

const clean = t => String(t || "").replace(/<[^>]*>/g, " ").replace(/&amp;|&#39;|&quot;|&lt;|&gt;/g, "").replace(/\s+/g, " ").trim();

/** 从 Astro props 提取帖子列表 */
function parseAstroPosts(html) {
  const match = html.match(/"posts":\[1,\[([\s\S]*?)\]\](?=,)/);
  if (!match) return [];
  const posts = [];
  const blocks = match[1].split(/\],\[0,\{/g);
  let first = true;
  for (const block of blocks) {
    let src = block;
    if (first) { src = src.replace(/^\[0,\{/, ''); first = false; }
    const uidMatch = src.match(/"uid":\[0,"([^"]+)"\]/);
    if (!uidMatch) continue;
    const titleMatch = src.match(/"title":\[0,"((?:[^"\\]|\\.)*?)"\](?=[,}])/);
    const tagNames = [...src.matchAll(/"name":\[0,"([^"]+)"\]/g)].map(m => m[1]);
    posts.push({ uid: uidMatch[1], title: titleMatch ? titleMatch[1] : "", tags: tagNames });
  }
  return posts;
}

/** HTML DOM 回退解析 */
function parsePostsFromHtml(html) {
  const items = [];
  const parts = html.split(/<div[^>]*class="[^"]*post[^"]*svelte-[^"]*"[^>]*>/g);
  for (let i = 1; i < parts.length; i++) {
    const endIdx = parts[i].indexOf('</div>');
    const content = endIdx > 0 ? parts[i].substring(0, endIdx) : parts[i];
    const linkMatch = content.match(/href=["'](\/x\/[^"']+)["']/);
    if (!linkMatch) continue;
    const id = linkMatch[1].match(/\/x\/([^/]+)/)?.[1] || "";
    let title = "";
    const tMatch = content.match(/post-title[^>]*>([^<]+)</);
    if (tMatch) title = clean(tMatch[1]);
    if (!title) { const alt = content.match(/alt=["']([^"']+)["']/); if (alt) title = clean(alt[1]); }
    if (!title) continue;
    items.push({ uid: id, title, tags: (title.match(/#[\w-]+/g) || []).map(t => t.substring(1)) });
  }
  return items;
}

// ============ 热门（含全部帖子）============

async function loadHot(p = {}) {
  const type = p.sort_by || "hot";
  const url = `${SITE}/${type}/`;
  const res = await Widget.http.get(url, { headers: HDR, allow_redirects: true });
  const html = String(res.data || "");
  if (!html) throw new Error("空响应");

  let posts = parseAstroPosts(html);
  if (!posts.length) posts = parsePostsFromHtml(html);
  if (!posts.length) throw new Error("未解析到内容");

  return posts.map(item => ({
    id: item.uid, type: "link", title: item.title,
    coverUrl: `${CDN}/cdn/storage/production/bbcrec/post/${item.uid}/poster.webp`,
    link: `${SITE}/x/${item.uid}`,
    description: item.tags?.length ? "#" + item.tags.slice(0, 5).join(" #") : "",
  }));
}

// ============ 详情 ============

async function loadDetail(link) {
  if (!link) return null;
  const url = link.startsWith("http") ? link : SITE + link;
  const id = url.match(/\/x\/([^/]+)/)?.[1] || "";
  if (!id) return null;

  // 直接从 ID 构造视频和封面地址，跳过请求详情页节省时间
  const videoUrl = `${CDN}/cdn/storage/production/bbcrec/post/${id}/master.m3u8`;
  const poster = `${CDN}/cdn/storage/production/bbcrec/post/${id}/poster.webp`;

  return [{
    id: url, type: "video", title: "BBCREC", link: url,
    coverUrl: poster, detailPoster: poster, backdropPath: poster, posterPath: poster,
    videoUrl, videoSources: [{ url: videoUrl, type: "application/x-mpegURL", label: "HLS" }],
    customHeaders: { Referer: url, Origin: SITE, "User-Agent": UA },
  }];
}
