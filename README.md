# SVG 图标清理与 Sprite 生成器

一个只在浏览器本地运行的单页工具。批量导入 SVG 后，应用会在浏览器内完成安全检查、属性规范化、内部 ID 冲突处理、重命名、预览，以及 SVG sprite 与 JSON manifest 导出。项目不使用后端、数据库、Docker、分析服务或任何运行时公网请求。

## 环境要求

- Node.js 20.19+（推荐 Node 22 LTS；当前项目也已在 Node 24 下验证）
- npm 10+ 或兼容的包管理器
- 现代桌面浏览器（Chrome、Edge、Firefox、Safari 的近期版本）

## 安装与启动

```bash
npm install
npm run dev
```

`npm run dev` 会启动 Vite，并自动打开本地页面（默认 `http://127.0.0.1:5173/`）。安装完成后应用完全离线运行，不需要网络服务。

其他命令：

```bash
npm test       # 运行 Vitest 测试
npm run build  # TypeScript 检查并生成 dist
npm run preview
```

## 使用方式

1. 点击导入区或把 `.svg` 文件拖入左侧区域。
2. 在左侧检查图标 ID、搜索、手动改名或删除文件。
3. 在中间切换浅色/深色背景、缩放、搜索和“原始/清理后”源码查看。
4. 在右侧决定是否保留原色，生成 sprite，下载 `sprite.svg` 或 `icons.json`。
5. 复制单个 `symbol` 时，只会复制当前选中图标的 symbol 片段。

## 项目结构

```text
src/
  App.tsx                   三栏页面和导入状态编排
  components/               拖拽区、列表、预览、导出、源码查看
  svg/
    parseSvg.ts             DOMParser XML 解析与根节点校验
    sanitizeSvg.ts          安全清理、颜色和 viewBox 规范化
    prefixInternalIds.ts    内部 ID 前缀化与引用同步
    processIcon.ts          单个图标处理链
    processIcons.ts         批量处理与错误隔离
    sprite.ts               symbol / sprite 生成
    manifest.ts             icons.json 生成
    iconIds.ts              文件名 ID、去重和手动改名去重
  utils/fileDownload.ts     Blob 下载与剪贴板复制
  styles.css                自写样式，无 UI 组件库
examples/10-icon-set/       9 个正常 SVG + 1 个损坏 XML 示例
```

## 安全清理规则

处理流程使用 `DOMParser` 解析，未清理内容不会通过 `innerHTML` 注入页面。原始 SVG 仅作为转义文本展示，清理后的预览使用经过处理的 data URI。

会删除或移除：

- `script`、`foreignObject`、`iframe`、`object`、`embed`
- `on*` 事件属性
- `javascript:` 链接、`http/https` 外链、外部 `src` 和外部 `url(...)`
- `<style>`、`style` 内联属性
- XML 声明、注释、`metadata`
- `sodipodi:*`、`inkscape:*` 节点、属性与命名空间声明

常用绘图节点、渐变、`clipPath`、`mask`、`use` 等会被保留。每个内部 `id` 会加上当前图标 ID 前缀，例如 `clip0` 变成 `home__clip0`，并同步更新 `url(#id)`、`href="#id"` 和 `xlink:href="#id"`，避免跨图标串引用。

## ViewBox 与颜色

- 有合法 `viewBox` 时直接使用并规范化数字空格。
- 没有 `viewBox` 但 `width`、`height` 都是纯数字时，生成 `0 0 width height`。
- 两者都没有或尺寸无效时使用 `0 0 24 24`，并显示警告。
- 根节点的 `width`、`height`、`x`、`y` 会删除；每个 symbol 保留自己的 `viewBox`。
- 默认情况下，没有设置可用颜色的图标会添加 `fill="currentColor"`。打开“保留原色”后不再自动添加该颜色。
- 显式设置的颜色（例如 `#ff0000`）始终保留；开关只控制缺失颜色的默认规范化。

## 已知限制

- 只接受文件名以 `.svg` 结尾的文件；单文件上限 1 MB，单次和当前工作区上限 50 个文件。
- `width`、`height` 只识别纯数字或科学计数法，不解析 `px`、`%`、`em` 等单位。
- 为了保证导出 sprite 不依赖外部资源，外部图片、外链、外部 `url(...)` 会被移除；依赖外部资源的图标可能变成空图形。
- 删除 `<style>` 和内联 `style` 是有意为之，复杂图标如果完全依赖 CSS 类选择器，视觉效果会变化。
- 当前输出是 SVG sprite 和 JSON manifest，不生成独立优化后的单个 SVG 文件。
- 浏览器剪贴板复制在部分安全上下文或权限设置下可能不可用，此时会给出操作反馈。

## 示例

打开 [`examples/10-icon-set`](./examples/10-icon-set/README.md)，把目录中的文件导入工作台即可复现验收场景。示例包含 10 个文件，其中 `broken.svg` 故意损坏 XML；正常文件会进入预览，损坏文件会进入错误列表。
