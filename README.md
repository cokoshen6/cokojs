# fwight

ForwardWidget 字幕插件集合 — 为视频播放器提供在线字幕加载功能。

## 插件列表

### 📝 字幕插件

| 文件 | 站点 | 版本 | 功能 |
|------|------|------|------|
| `AVSubtitles.js` | [avsubtitles.com](https://www.avsubtitles.com) | 1.4.0 | 自动搜索 + 手动搜索字幕，返回 .srt 直链 |
| `SubtitleCat.js` | [subtitlecat.com](https://www.subtitlecat.com) | 1.1.0 | 自动搜索 + 手动搜索字幕，返回 .srt 直链 |
| `guangyazimu.js` | [guangyapan.com](https://api.guangyapan.com) | 1.3.0 | 光鸭云盘字幕库，API 指纹匹配 + 番号识别 |

### 🎬 视频浏览插件

| 文件 | 站点 | 功能 |
|------|------|------|
| `spankbang.js` | [spankbang.com](https://spankbang.com) | 热门/标签浏览/搜索/详情播放 (HLS+MP4) |
| `okxxx.js` | [ok.xxx](https://ok.xxx) | 最新/热门/流行/频道/女优/标签/搜索/详情播放 |
| `bbcrec.js` | [bbcrec.com](https://bbcrec.com) | 热门帖子浏览/详情播放 (HLS) |

## 通用特性

- **字幕插件** — 从播放器传递的影片信息自动提取关键词/番号搜索匹配字幕，支持手动搜索
- **视频插件** — 热门/标签浏览/搜索/详情页播放，支持 HLS 自适应流和 MP4 直链
- **多语言** — 自动识别字幕语言，带语言标签
- **智能排序** — 光鸭字幕支持指纹匹配优先、番号精确匹配、文件名匹配等多维度评分排序

## 使用方式

1. 将 .js 文件放入 ForwardWidget 配置目录
2. 在视频播放器中选择对应的插件
3. 自动搜索或手动输入关键词查找内容
4. 点击结果即可播放/加载
