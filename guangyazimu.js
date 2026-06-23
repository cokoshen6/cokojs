WidgetMetadata = {
  id: "guangyasub",
  title: "光鸭字幕",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "光鸭云盘字幕库",
  author: "Minis",
  site: "https://api.guangyapan.com",
  detailCacheDuration: 3600,
  globalParams: [],
  modules: [
    {
      id: "loadSubtitle",
      title: "加载字幕",
      functionName: "loadSubtitle",
      type: "subtitle",
      params: [],
    },
  ],
};

const API_BASE = "https://api.guangyapan.com";

function getText(value) {
  return String(value || "").trim();
}

function getLangTag(langStr) {
  if (!langStr) return "【其他】";
  const t = String(langStr).toLowerCase();
  if (t.includes("简") || t.includes("chs") || t.includes("zho") || t.includes("chi")) return "【简中】";
  if (t.includes("繁") || t.includes("cht")) return "【繁中】";
  if (t.includes("双语") || t.includes("中英")) return "【双语】";
  if (t.includes("英") || t.includes("eng")) return "【英文】";
  return "【字幕】";
}

// 检测哈希值文件名（如 SHA1/MD5/UUID，不应直接展示给用户）
function isHashName(name) {
  const s = getText(name).replace(/\.[a-z0-9]{2,4}$/i, ""); // 去掉扩展名再检测
  return s.length >= 32 && /^[a-fA-F0-9\-]+$/.test(s);
}

// 智能番号提取（与迅雷看看策略一致）
function extractAvCode(text) {
  const s = getText(text).toUpperCase()
    .replace(/[._]/g, "-")
    .replace(/\s+/g, "")
    .trim();
  if (!s) return "";

  // 常见 JAV 番号模式，按优先级
  const patterns = [
    // FC2 系列
    /\bFC2[-]?PPV[-]?\d{5,8}\b/i,
    /\bFC2[-]?\d{5,8}\b/i,
    // 海外流媒体
    /\bCARIB[-]?\d{6,8}\b/,
    /\b1PONDO[-]?\d{6,8}\b/,
    /\bHEYZO[-]?\d{3,6}\b/,
    /\bT28[-]?\d{6,8}\b/,
    // 标准 JAV 番号：字母+数字 如 IPX-123, SSIS-123（通用模式覆盖所有标准编码）
    /\b[A-Z]{2,10}[-]?\d{2,8}[A-Z]?\b/,
    // 纯数字（6-8位）
    /\b\d{6,8}\b/
  ];

  const candidates = [s];
  // 清理标题中的质量标记后再试
  const cleaned = s
    .replace(/\b(UNCENSORED|LEAK|OTHER|COMPLETE|FULL|HDR|WEB|BLURAY|BDRIP|WEBDL|REMUX|X264|X265|10BIT|8BIT|HEVC|AVC|AAC|MP4|MKV|AVI|2160P|1080P|720P|480P|360P)\b/g, "")
    .replace(/\b(?:CD\d+|PART\d+|DISC\d+|EP\s*\d+|E\s*\d+)\b/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (cleaned && cleaned !== s) candidates.push(cleaned);

  for (const src of candidates) {
    for (const reg of patterns) {
      const m = src.match(reg);
      if (m && m[0]) {
        return m[0].replace(/[-]+/g, "-").replace(/^[-]|[-]$/g, "");
      }
    }
  }
  return "";
}

function collectSearchContext(params = {}) {
  const rawFields = [params.title, params.seriesName, params.description, params.id, params.link, params.url]
    .map(getText)
    .filter(Boolean);
  const rawText = rawFields.join(" ").trim();
  const titleText = getText(params.title || params.seriesName);
  const avCode = extractAvCode(titleText);  // 只用单个字段提取番号，避免空格拼接导致匹配失败
  return { rawText, titleText, avCode };
}

function buildSearchKeys(params) {
  const { rawText, titleText, avCode } = collectSearchContext(params);
  if (!rawText && !titleText) return [];
  const keys = [];
  if (avCode) {
    keys.push(avCode);
    keys.push(avCode.replace(/[-]/g, ""));
  } else {
    // 没有番号时，从原文提取字母+数字的组合（不拿中文去搜）
    const raw = (rawText || titleText || "").toUpperCase();
    const alphanum = raw.replace(/[^A-Z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
    if (alphanum.length >= 3) keys.push(alphanum);
  }
  return [...new Set(keys)].filter(k => k.length >= 3);
}

async function searchSub(key) {
  const body = JSON.stringify({
    gcid: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    duration: 8402,
    name: key + ".mp4"
  });
  try {
    const res = await Widget.http.post(
      `${API_BASE}/misc/v1/get_subtitles`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ForwardWidgets/1.0.2"
        }
      }
    );
    const text = typeof res === 'string' ? res : (res?.data ? (typeof res.data === 'string' ? res.data : JSON.stringify(res.data)) : '');
    if (!text) return [];
    const data = JSON.parse(text);
    if (data.msg !== "success" || !data.data?.list) return [];
    return data.data.list;
  } catch (err) {
    console.warn(`[guangyasub] search "${key}" error:`, err?.message || err);
    return [];
  }
}

function normalizeResult(item) {
  const rawName = getText(item.name || item.Name || "");
  const displayName = rawName && !isHashName(rawName)
    ? rawName
    : item.mt === 1 ? "指纹匹配字幕"
      : item.mt === 0 ? "文件名匹配字幕"
        : item.mt === 2 ? "网友上传字幕" : "光鸭字幕";
  return {
    id: item.url || item.gcid || item.cid || Math.random().toString(36).slice(2),
    name: displayName,
    _rawName: rawName,
    langs: item.languages?.join?.(",") || item.langs || "",
    ext: item.ext || ".srt",
    url: getText(item.url),
    down_count: Number(item.score || 0),
    duration: Math.round((item.duration || 0) / 1000),
    score: Number(item.score || 0),
    fingerprintScore: Number(item.fingerprintf_score || 0),
    mt: Number(item.mt || 0),
    star: item.star || "",
  };
}

function scoreItem(item, params) {
  const { rawText, titleText, avCode } = collectSearchContext(params);
  const title = (rawText || titleText || "").toLowerCase();
  const text = (getText(item?.name) + " " + getText(item?.langs)).toLowerCase();
  const titleLoose = title.replace(/[-_\s.]/g, "");
  const textLoose = text.replace(/[-_\s.]/g, "");
  let score = 0;

  // 番号精确匹配（权重最高）
  if (avCode) {
    const codeLoose = avCode.replace(/[-]/g, "").toLowerCase();
    const nameCode = extractAvCode(item.name);
    const nameCodeLoose = nameCode.replace(/[-]/g, "").toLowerCase();
    // 番号完全一致
    if (codeLoose === nameCodeLoose) score += 100000;
    // 番号包含
    if (text.includes(avCode.toLowerCase()) || textLoose.includes(codeLoose)) score += 50000;
  }

  // 指纹匹配（准确度高）
  score += Number(item.fingerprintScore || 0) * 2;

  // 原始评分
  score += Number(item.score || 0);

  // 文件名匹配加分
  if (title && (text.includes(title) || textLoose.includes(titleLoose))) score += 10000;

  // 时长相近加分
  if (item.duration > 0) score += 50;

  // 匹配来源权重
  if (item.mt === 1) score += 500;  // 指纹匹配
  if (item.mt === 0) score += 200;  // 文件名匹配
  if (item.star === "5") score += 100;

  return score;
}

async function loadSubtitle(params) {
  const searchKeys = buildSearchKeys(params);
  if (searchKeys.length === 0) return [];

  let allSubs = [];
  const usedKey = [];

  // 多轮搜索：先用番号精确搜，不够再用标题搜
  for (const word of searchKeys) {
    const list = await searchSub(word);
    if (list.length > 0) {
      allSubs = list;
      usedKey.push(word);
      break;
    }
  }

  if (allSubs.length === 0) return [];

  // 评分 + 去重
  const scored = allSubs.map(raw => {
    const item = normalizeResult(raw);
    return { item, score: scoreItem(item, params) };
  });

  // 按字幕文件去重，优先用原始文件名，哈希值回退到 URL 去重
  const nameGroups = {};
  for (const { item, score } of scored) {
    const dedupKey = item._rawName && !isHashName(item._rawName)
      ? item._rawName.replace(/\(\d+\)/g, "").replace(/\s*\(.*?\)\s*$/g, "").trim()
      : item.url;  // 哈希名用 URL 去重
    if (!nameGroups[dedupKey] || score > nameGroups[dedupKey].score) {
      nameGroups[dedupKey] = { item, score };
    }
  }

  const best = Object.values(nameGroups).sort((a, b) => b.score - a.score);

  const result = [];
  const existKey = new Set();
  const maxResultCount = 10;

  for (const { item, score } of best) {
    if (result.length >= maxResultCount) break;
    if (!item.url) continue;

    const dedupeKey = `${item._rawName.toLowerCase()}|${item.url}`;
    if (existKey.has(dedupeKey)) continue;
    existKey.add(dedupeKey);

    const mtMap = { 0: "文件名匹配", 1: "指纹匹配", 2: "网友上传" };
    const mtLabel = mtMap[item.mt] || "系统匹配";

    result.push({
      id: item.id,
      title: item.name,
      subTitle: `${getLangTag(item.langs)} ${mtLabel}${item.star === "5" ? " ★★★★★" : ""}${item.mt === 1 ? " [高可信]" : ""}`,
      description: [
        item.duration > 0 ? `时长 ${Math.floor(item.duration/60)}:${String(item.duration%60).padStart(2,"0")}` : "",
        `匹配度: ${score}`
      ].filter(Boolean).join(" | "),
      lang: item.langs || "zh",
      count: score,
      url: item.url,
    });
  }

  return result;
}
