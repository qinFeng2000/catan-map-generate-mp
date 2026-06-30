# 卡坦岛地图生成器

## 项目目标

离线 Taro 4 六边形资源地图生成器，支持 H5 与微信小程序。借鉴卡坦版图规则结构，不使用原游戏美术素材。

## 架构

```text
src/
  domain/       版图、资源、数字、港口和规则类型
  presets/      两种版图的坐标、数量、海洋环和固定港口模板
  generator/    洗牌、候选生成、硬规则检查、评分和候选选择
  geometry/     六边形、邻接、交叉点、距离和港口开口坐标
  renderer/     平台无关绘图指令和 Canvas 执行器
  storage/      版本化本地缓存
  sharing/      H5 与微信小程序图片导出
  pages/index/  首页状态和 UI 编排
  components/   BoardCanvas、RulePanel、MetricSummary
```

## 开发计划（2026-06-30）

- [x] Task 1: Taro 4 React TypeScript 脚手架
- [x] Task 2: 领域类型、规则默认值、固定预设
- [x] Task 3: 六边形几何与拓扑
- [x] Task 4: Fisher–Yates 与约束资源放置
- [x] Task 5: 约束数字放置与硬规则校验
- [x] Task 6: 可解释评分与候选比较
- [x] Task 7: 批量生成编排与诊断
- [x] Task 8: 绘图指令与 Canvas 渲染
- [x] Task 9: 版本化存储与页面状态
- [x] Task 10: 生成器页面、规则面板、指标
- [x] Task 11: H5/微信 PNG 导出
- [x] Task 12: 集成验证与 README
- [x] Task 13: Canvas 清晰度与地图可读性优化
  - Canvas 设置真实像素缓冲区，避免 CSS/rpx 拉伸导致模糊
  - 地图区域收紧边距，让岛屿在页面与分享图中更填满
  - 去除地块白色间隔、数字黑色边框，放大数字
  - 沙漠不展示中心数字或符号
  - 分享图片使用更大离屏输出尺寸，并按实际尺寸导出
- [x] Task 14: 首页交互重组与地图拖拽缩放
  - 顶部版本 tab 改为“基础版 / 航海 / 文明”，后两项置灰并点击提示 TODO
  - 人数选择改为 Picker，2–4 人映射基础版地图，5–6 人映射扩充版地图
  - 规则设置改为设置按钮打开的弹窗
  - 地块颜色图例移动到 Canvas 地图内部绘制
  - 地图展示层支持拖拽、双指缩放，并提供重置为展示全部按钮
- [x] Task 15: 修复 H5 dev 启动缺少 React Refresh webpack 插件
  - 定位 `pnpm run dev:h5` 在 Taro React H5 开发模式下缺少可选 peer dependency
  - 显式补齐开发依赖并验证 H5 构建/启动
- [x] Task 16: 迁移微信小程序绘图到新版 Canvas 2D
  - `BoardCanvas` 使用 `id + type="2d"`，通过 SelectorQuery 获取 canvas node
  - 绘图执行器改为标准 `CanvasRenderingContext2D` 同步绘制，不再依赖旧版 `CanvasContext.draw()`
  - 微信分享导出改为传入 canvas 实例，H5 保持 DOM Canvas 下载路径
- [x] Task 17: 去除地图拖拽缩放层并简化 Canvas 2D 展示
  - 首页主地图不再使用 `BoardViewport` / `MovableArea` / `MovableView`
  - 页面 Canvas 外观尺寸直接使用 rpx，内部 backing store 保持按显示像素绘制
  - `BoardCanvas` 可见态直接输出 Canvas，减少 Canvas 2D 节点外层包装
- [x] Task 18: 暂时隐藏未完成玩法入口
  - 首页暂时不展示顶部玩法 tab，避免暴露航海/文明等未完成功能
  - 人数选择继续承担基础版/扩充版地图切换
  - 清理未使用的 tab 配置、样式与点击提示逻辑
- [x] Task 19: 修复规则面板被 Canvas 2D 遮挡
  - 规则面板打开时暂停渲染页面主 Canvas 与离屏分享 Canvas
  - 关闭规则面板后重新等待分享 Canvas 绘制完成
  - 提高规则面板层级，降低小程序 Canvas 同层渲染遮挡风险
- [x] Task 20: 5–6 人默认启用 6 和 8 不相邻
  - 新增 `defaultRulesForVersion`：扩充版默认 `forbidAdjacentSameNumberGroup: true`
  - 切换人数时重置 draft 规则并重新生成
  - 规则面板与分享图文案同步为「6 和 8 不相邻」
- [x] Task 21: 海洋港口集中配置化
  - 新增 `src/presets/coastal-config.ts` 统一管理海洋环推导、港口槽位表与校验
  - `board-presets.ts` 仅负责陆地形状与资源/数字袋，海洋与港口由 `buildCoastalPreset` 注入

## 验证命令

```bash
npx pnpm@11.7.0 test
npx pnpm@11.7.0 typecheck
npx pnpm@11.7.0 build:h5
npx pnpm@11.7.0 build:weapp
```

## 实施记录

- **2026-06-30**：按 `docs/superpowers/plans/2026-06-30-catan-map-generator.md` 完成首版实现。39 项单元测试通过，TypeScript 检查通过，H5/weapp 构建通过。
- 分支：`feature/catan-map-generator`
- 补充依赖：`vite`（Vitest 4）、`@babel/preset-react`、`@babel/preset-typescript`；`config/index.ts` 增加 `@` 路径别名。
- **2026-06-30**：优化 5–6 人生成默认预算。基础版保持 200 候选 × 400 尝试；5–6 人改为 16 候选 × 80 尝试，并提高让出主线程频率。固定 seed 基准从约 5.6s 降到约 1.0s。
- **2026-06-30**：优化 Canvas 清晰度与地图可读性。Canvas 绘图缓冲区按设备像素比放大，地图区域收紧边距；地块描边改为同色以去除白缝，数字 token 去黑色边框并放大，沙漠不再显示中心标记；分享图宽度提升到 1600 并按实际离屏尺寸导出。
- **2026-06-30**：完成首页交互重组。顶部 tab 改为基础版/航海/文明，航海和文明置灰并点击提示 TODO；人数选择改为 Picker；规则设置改为设置按钮打开弹窗；地块颜色图例改为 Canvas 内绘制；地图展示层支持拖拽、双指缩放和“展示全部”重置。
- **2026-06-30**：修复微信小程序 `wx.getSystemInfoSync is deprecated` 告警。运行时尺寸读取改为优先使用 `getWindowInfo` / `getDeviceInfo`，仅在旧环境缺少新 API 时兜底。
- **2026-06-30**：修复地图展示不全。`BoardViewport` 的可移动区域尺寸改为稳定的字符串 style，并在地图重新生成、切换版本或尺寸变化时自动重置拖拽/缩放状态，避免沿用旧视图导致裁切。
- **2026-06-30**：修复微信页面 Canvas 被 DPR 坐标放大裁切。页面交互 Canvas 改为使用逻辑设计坐标绘制，避免旧 CanvasContext 只展示局部地图；分享图仍使用独立大尺寸输出。
- **2026-06-30**：精简港口显示。港口仅保留资源/通用三角色块，不再显示 `2:1` / `3:1` 文本。
- **2026-06-30**：按实际显示像素修正页面地图缩放。页面交互 Canvas 使用 `rpx -> px` 后的显示尺寸生成绘图坐标，不乘 DPR，避免微信 CanvasContext 按过大坐标裁切地图；分享图继续使用独立大图尺寸。
- **2026-06-30**：页面地图改为 2 倍显示像素 backing store，外观尺寸不变但 Canvas 内部按 2x px 绘制；资源色块说明移动到 Canvas 顶部，并为地图主体预留顶部间隔。
- **2026-06-30**：页面地图改为真正的 2 倍图展示结构。Canvas 内容 view 使用 2 倍设计尺寸，外层 `BoardViewport` 通过 `transform: scale(0.5)` 缩回原展示尺寸，从而保留更精细的绘制结果。
- **2026-06-30**：调整 2 倍图缩放层级。`MovableView` 保持原展示尺寸以保证拖拽/缩放边界稳定，内部内容 view 使用 2 倍尺寸并 `scale(0.5)` 展示，避免和 `MovableView` 自身 transform 冲突。
- **2026-06-30**：修复分享图导出不完整。微信导出时显式传入完整源区域 `x/y/width/height`，离屏分享 Canvas 宿主保留真实尺寸并放到屏幕外，避免被 `0x0` 容器裁切后只导出局部。
- **2026-06-30**：修复重新生成后页面 Canvas 白屏。`BoardCanvas` 绘制改为等待 Taro `nextTick`，确保重新挂载后的原生 Canvas 节点已创建；同时在组件卸载或重挂载时取消旧绘制回调，避免旧异步绘制覆盖新画布状态。
- **2026-06-30**：修复 5–6 人分享预览横向裁切。分享图改为固定 1200px 宽、至少 1800px 高的竖版画布，避免微信图片预览按高度展示时裁掉左右；离屏 Canvas 使用真实 `px` 尺寸绘制，并从负坐标隐藏改为透明固定层，减少导出源区域被布局裁切的风险。
- **2026-06-30**：优化分享图底部文案布局。左下角仅保留规则说明，评分与差值类指标移动到右下角右对齐，避免规则较多时文字重叠。
- **2026-06-30**：修复 H5 dev 启动失败。`@tarojs/plugin-framework-react@4.2.0` 在 webpack H5 开发模式会加载 React Refresh 插件，但该插件是 optional peer dependency，pnpm 不会自动安装；已显式加入 `@pmmmwh/react-refresh-webpack-plugin` 开发依赖。
- **2026-06-30**：迁移微信绘图到新版 Canvas 2D。页面与分享 Canvas 增加 `type="2d"`，绘制时通过 SelectorQuery 获取 canvas node 并使用标准 2D context 同步绘图；微信图片导出改为向 `canvasToTempFilePath` 传入 canvas 实例，避免继续依赖旧版 `canvasId` 接口。
- **2026-06-30**：去除主地图拖拽缩放层级。首页主地图直接渲染 `BoardCanvas`，移除 `BoardViewport`、`MovableArea`、`MovableView` 和 2 倍内容 View 的 `scale(0.5)` 结构；可见 Canvas 外观尺寸使用 rpx，Canvas 2D backing store 继续按显示像素绘制。
- **2026-06-30**：暂时隐藏未完成玩法入口。首页移除顶部玩法 tab 和航海/文明 TODO 点击提示，保留人数选择作为当前地图版本入口；同步清理 `GAME_MODE_TABS` 配置与 tab 样式。
- **2026-06-30**：修复规则面板被 Canvas 2D 遮挡。规则面板打开时不渲染页面主 Canvas 与离屏分享 Canvas，关闭后重新等待分享 Canvas 绘制完成；同时将 `rule-panel-overlay` 层级提高到 `9999`。
- **2026-06-30**：规则面板关闭按钮文案改为 `x`，并调整为更紧凑的圆形按钮。
- **2026-06-30**：5–6 人扩充版默认启用「6 和 8 不相邻」。通过 `defaultRulesForVersion('extension')` 设置 `forbidAdjacentSameNumberGroup: true`；切换人数时同步重置 draft 规则；扩充版仍保留一个 6/8 同资源例外与一个木材/砖块共享数字例外。
- **2026-06-30**：海洋港口集中配置化。新增 `coastal-config.ts` 存放 `COASTAL_CONFIGS`、海洋环推导 `seaBoundary`、港口构建与 `validateCoastalConfig`；`board-presets.ts` 通过 `buildCoastalPreset` 注入 `seaCoords` 与 `harbors`。
- **2026-07-01**：放大地图左上角资源色块图例。字号、色块尺寸与行间距适度上调，提升移动端阅读性。

## 已知改进点

1. 5–6 人生成速度已通过版本级默认预算改善；若后续需要在 1s 内继续提高评分质量，可进一步优化数字搜索剪枝或做“先出图、后台提质”的渐进生成。
2. H5 分享依赖 Canvas DOM，需等离屏 Canvas `onDrawn` 后再导出。
3. 微信开发者工具需手动打开 `project.config.json` 做 Canvas 清晰度与相册权限验收。
