# 沙漠黄主题设计

## 1. 目标

把改造前的暖黄色视觉整理为完整、可注册、可替换的 `desertYellow` 主题，中文名称为“沙漠黄”。主题覆盖首页、规则面板、指标摘要、页面地图辅助元素、导出分享图与平台导航栏，并成为默认启用主题。

现有“石板蓝”继续作为完整注册主题保留。替换默认主题仍通过 `ACTIVE_THEME_ID` 完成，不增加用户可见的运行时切换入口，也不保存主题偏好。

## 2. 设计原则

- “沙漠黄”恢复改造前的暖黄背景、暖白表面、橙色强调、较大圆角与柔和阴影，不做仅换色的近似实现。
- “石板蓝”保持当前低饱和、平面、细边框、无明显投影的效果。
- 颜色与形态都由主题定义提供，业务组件只消费语义化 CSS 变量。
- 地图资源色是游戏语义，不属于应用主题。

## 3. 不变范围

以下内容不得因主题扩展而变化：

- `RESOURCE_COLORS` 中木材、羊毛、小麦、砖块、矿石、沙漠和海洋的色值；
- 资源地块、海洋、资源图例色块与资源港口开口的选色逻辑；
- 地图生成、规则配置、版本切换、导出、缓存、加载和揭示动画；
- 页面地图与分享图使用同一场景主题的现有约束。

## 4. 沙漠黄视觉值

颜色恢复自改造前样式和场景绘制配置：

| 语义 | 色值 |
| --- | --- |
| 页面背景 | `#F5F1E8` |
| 表面 | `#FFFDF8` |
| 主色 | `#D98B16` |
| 正文 | `#29333A` |
| 次级文字 | `#73808A` |
| 边框/分隔线 | `#EEE7DA` |
| 遮罩 | `rgba(41, 51, 58, 0.32)` |
| 错误背景 | `#FFF0EB` |
| 错误文字 | `#8A3B2F` |
| 画布背景 | `#F7F4EC` |
| 数字牌 | `#FFF7DD` |
| 普通数字 | `#24313A` |
| 高概率数字 | `#C83A2F` |
| 分享摘要 | `#52616B` |
| 分享算法说明 | `#8A959C` |

形态恢复为：

- 人数选择器 `24rpx` 圆角及 `0 8rpx 22rpx rgba(41, 51, 58, 0.06)` 阴影；
- 地图卡片 `28rpx` 圆角及 `0 12rpx 30rpx rgba(41, 51, 58, 0.08)` 阴影；
- 操作按钮 `14rpx` 圆角；
- 规则面板顶部 `32rpx` 圆角；
- 关闭按钮使用圆形外观、浅暖黄背景与橙色文字；
- 主要卡片不使用石板蓝主题的实体外框。

## 5. 主题契约

`ThemeDefinition` 保留 `ui`、`scene` 和 `platform`，新增 `appearance`。`scene` 新增独立的 `algorithmText`，以准确表达原有分享图中算法说明与版本文字的不同颜色。

`appearance` 采用组件语义令牌，而不是 `flat` / `soft` 之类需要在 SCSS 再次解释的枚举：

```ts
interface ThemeAppearance {
  pickerRadius: string
  pickerBorder: string
  pickerShadow: string
  settingsRadius: string
  settingsBorder: string
  mapRadius: string
  mapBorder: string
  mapShadow: string
  actionRadius: string
  primaryActionBorder: string
  secondaryActionBorder: string
  secondaryActionText: string
  errorBorder: string
  panelRadius: string
  panelBorder: string
  dividerBorder: string
  closeRadius: string
  closeBorder: string
  closeBackground: string
  closeText: string
  closeLineHeight: string
  stepRadius: string
  stepBorder: string
  stepBackground: string
  summaryRadius: string
  summaryBorder: string
  summaryText: string
}
```

这些值全部映射为 `--theme-*` CSS 变量。组件样式不通过主题 ID 分支，也不复制两套选择器。

## 6. 注册与默认主题

新增 `src/theme/desert-yellow.ts` 并注册：

```ts
export const themeRegistry = {
  stoneBlue,
  desertYellow,
} as const

export const ACTIVE_THEME_ID: ThemeId = 'desertYellow'
```

`stoneBlue` 补齐 `appearance` 与 `algorithmText` 后，应与当前视觉一致。`desertYellow` 成为默认主题，`app.config.ts`、页面 CSS 变量、规则开关、页面地图和分享图继续统一读取 `activeTheme`。

## 7. 样式接入

- 首页选择器、规则按钮、地图卡片、操作按钮和错误卡读取外观变量；
- 规则面板、关闭按钮和步进按钮读取外观变量；
- 指标摘要读取主题圆角、边框和文字变量；
- 按钮启用、禁用、按下状态继续使用显式修饰类，避免 Taro H5 的 `disabled="false"` 属性影响正常颜色；
- `src/app.scss` 的挂载前回退色改为默认沙漠黄，避免启动时短暂出现石板蓝；
- 平台导航和背景继续由 `activeTheme.platform` 与 `activeTheme.ui.page` 提供。

## 8. 地图与分享图

主题继续只控制画布清屏色、数字牌、数字文字、图例文字及分享图文字。`createBoardScene` 的算法说明改用 `theme.scene.algorithmText`，其余场景语义保持不变。

`RESOURCE_COLORS` 与 `harborOpeningFill` 继续位于主题目录之外。切换 `stoneBlue` 或 `desertYellow` 时，七类资源色值和所有资源色块绘制命令必须完全一致。

## 9. 验证

自动验证包括：

- 两套主题均满足完整 `ThemeDefinition`；
- 注册表同时暴露 `stoneBlue` 和 `desertYellow`，默认主题为 `desertYellow`；
- CSS 变量映射覆盖全部颜色与外观令牌；
- 沙漠黄的场景颜色恢复改造前值；
- 石板蓝保持当前值；
- 两套主题下 `RESOURCE_COLORS` 与资源绘制命令均不变化；
- 现有页面、规则面板、分享和动画结构测试继续通过；
- TypeScript、完整 Vitest、H5 构建和微信小程序构建通过。

## 10. 验收标准

- 默认页面呈现原有沙漠黄风格，包括暖黄配色、圆角和柔和阴影；
- 石板蓝仍可通过修改 `ACTIVE_THEME_ID` 完整恢复；
- 页面地图和导出分享图使用同一默认主题；
- 地图资源色块与改造前、石板蓝主题下完全一致；
- 不出现运行时主题开关、主题偏好缓存或主题相关业务状态；
- 主题样式集中在主题定义和语义变量中，不新增按主题 ID 分支的组件样式。
