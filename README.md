# SVG 图标清理与 Sprite 生成器

一个完全在浏览器本地运行的单页工具，用于批量导入 SVG 图标，执行安全检查、属性规范化、内部 ID 冲突处理与重命名，并导出统一的 `sprite.svg` 和 `icons.json`。项目没有后端、数据库、Docker 或运行时公网依赖；安装依赖后可离线使用。

## 环境要求

- Node.js 18.18 或更高版本
- 推荐使用 Node.js 20 LTS 或 22 LTS
- npm 9 或更高版本

## 安装、启动与构建

```bash
npm install
npm run dev
```

`npm run dev` 会启动 Vite，并自动在默认浏览器打开本地页面。开发服务器仅绑定 `127.0.0.1`。

```bash
npm test
npm run build
```

- `npm test`：运行 Vitest 测试。
- `npm run build`：先执行 TypeScript 类型检查，再生成生产构建到 `dist/`。
- `npm run test:watch`：以监听模式运行测试。

## 验收样例

`examples/acceptance/` 提供了 10 个 SVG：

- 9 个有效 SVG，包含重复内部 ID、宽度/高度转换、viewBox 回退、渐变、mask、注释、metadata、外部引用、事件属性和 script 等情况。
- `10-broken.svg` 是损坏 XML。

在页面中选择或拖入这 10 个文件后：

1. 9 个有效文件进入列表并显示预览。
2. `10-broken.svg` 进入右侧错误列表，不影响其他文件。
3. 清理后不应出现 `script`、`on*` 事件属性、外部 `http/https` 引用或内联 `style`。
4. 生成 `sprite.svg` 后，每个内部 ID 都带有图标 ID 前缀，引用同步更新。

## 项目结构

```text
src/
  App.tsx                     React 三栏页面与交互状态
  styles.css                  自写响应式样式
  components/
    AppIcon.tsx               页面内联图标
    IconList.tsx              图标列表与手动改名
    PreviewModal.tsx          原始/清理后源码查看
    SvgPreview.tsx            安全预览
  lib/
    svgParser.ts              DOMParser XML 解析和根节点校验
    sanitizeSvg.ts            安全检查、节点/属性清理与属性规范化
    viewBox.ts                viewBox 提取和 width/height 转换
    iconId.ts                 文件名转 ID、重名自动编号
    prefixInternalIds.ts      内部 ID 前缀及引用同步
    iconPipeline.ts           单图标完整处理流水线
    sprite.ts                 Sprite 与 symbol 生成
    manifest.ts               icons.json 生成
    download.ts               本地文件下载与复制
    fileImport.ts             文件类型、大小和读取校验
```

## 导入规则

- 只接受扩展名为 `.svg` 或 MIME 类型为 `image/svg+xml` 的文件。
- 单文件最大 1MB。
- 一次最多处理 50 个图标，超出部分会进入错误列表。
- 非 SVG、损坏 XML、空文件或根节点不是 `<svg>` 的文件不会进入图标列表。
- ID 由文件名生成：去掉 `.svg`、转小写、空格和下划线转 `-`、移除其他字符；为空时使用 `icon-1`。
- 同名 ID 自动追加 `-2`、`-3`。手动改名后会再次检查冲突。

## 清理与规范化规则

- 使用浏览器 `DOMParser` 解析，原始内容不会直接注入 `innerHTML` 或页面 DOM。
- 删除 `script`、`foreignObject`、`iframe`、`object`、`embed`、`style`、`metadata`、XML 注释和处理指令。
- 删除 `sodipodi:*`、`inkscape:*` 节点和属性。
- 删除所有 `on*` 事件属性、内联 `style`、`javascript:`、`vbscript:` 和外部 `http/https` 引用。
- 保留路径、图形、渐变、`clipPath`、`mask`、`use`、`symbol` 等常用 SVG 绘图节点。
- 优先使用现有 `viewBox`；否则尝试用数字 `width`/`height` 生成；两者都没有时使用 `0 0 24 24` 并记录警告。
- 删除根节点的 `width`、`height`、`x`、`y`，清理空属性和多余空白。
- 默认给未设置根级 `fill` 的图标添加 `fill="currentColor"`；可通过“保留原始颜色”开关关闭。
- 每个内部 ID 加图标 ID 前缀，如 `home__clip0`，并同步更新 `url(#id)`、`href="#id"`、`xlink:href="#id"`。
- 每个输出 `symbol` 独立保留自己的 `viewBox`。

## 导出结果

生成的 `sprite.svg` 结构为：

```xml
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="home" viewBox="0 0 24 24">...</symbol>
  </defs>
</svg>
```

下载后可以直接在 HTML 中使用：

```html
<svg width="24" height="24" aria-hidden="true">
  <use href="sprite.svg#home"></use>
</svg>
```

`icons.json` 包含每个图标的 `id`、原始 `fileName`、`viewBox` 和 `warnings`。Sprite 与 Manifest 都按最终 ID 稳定排序，相同输入重复生成结果一致。

## 已知限制

- 只处理浏览器可解析的 XML；HTML 风格的宽松 SVG 修复不在范围内。
- 为安全起见，所有 `<style>` 和 `style` 属性都会被删除，依赖外部/内联 CSS 的图标外观可能简化。
- 外部 `http/https`、`javascript:` 和 SVG 数据 URI 引用会被删除，不会下载或内联远程资源。
- 目录递归导入未实现；请一次选择一个或多个 `.svg` 文件，或拖入文件。
- 该工具使用 `currentColor` 适配页面字体颜色；如需精确保留图标原始配色，请开启“保留原始颜色”。
