# 蓝色莫兰迪可替换主题设计

## 1. 目标

将当前地图生成器改造成以低饱和石板蓝为主的平面化视觉，同时覆盖：

- 首页背景、选择器、按钮、提示与指标摘要；
- 规则设置抽屉；
- 页面中的地图承载面、数字牌、图例与辅助文字；
- 导出的分享图片背景、标题、规则摘要与指标文字；
- H5 与微信小程序的全局页面和导航栏背景。

本次建立可扩展的主题注册结构，默认启用 `stoneBlue`。主题在代码层可注册、替换，但不增加用户可见的运行时主题切换入口，不保存主题偏好。

## 2. 不变范围

以下行为与数据必须保持不变：

- 木材、羊毛、小麦、砖块、矿石、沙漠、海洋的 `RESOURCE_COLORS` 映射；
- 资源地块与港口资源类型的颜色选择逻辑；
- 地图生成、规则配置、地图切换、导出和错误处理流程；
- 地图中心向外的生成揭示动画；
- 页面与分享图复用同一地图绘图模型的现有约束。

主题定义不得包含或覆盖 `RESOURCE_COLORS`。切换已注册主题时，地图资源色块必须保持相同。

## 3. 视觉方向

采用已确认的 B 方案“石板蓝”：

| 语义 | 色值 | 用途 |
| --- | --- | --- |
| 页面背景 | `#DDE5EA` | 页面、全局背景 |
| 表面 | `#EEF2F3` | 地图承载面、选择器、抽屉、摘要 |
| 主色 | `#647D8C` | 主按钮、开关、关键状态 |
| 深色文字 | `#3E5664` | 标题、正文、深色按钮 |
| 次级文字 | `#71838D` | 说明、算法备注、弱提示 |
| 边框 | `#B9C8CF` | 控件、卡片、分隔线 |
| 遮罩 | `rgba(62, 86, 100, 0.38)` | 规则抽屉背景 |
| 错误背景 | `#E8DEDD` | 低饱和错误提示 |
| 错误文字 | `#805D5A` | 错误信息 |
| 画布背景 | `#EEF2F3` | 页面地图和分享图底色 |
| 数字牌 | `#E9EDF0` | 地块数字圆牌 |
| 高概率数字 | `#79534F` | 数字 6、8 |

视觉规则：

- 移除现有明显投影，以实体色面和 `1px`/`2rpx` 蓝灰边框表达层级；
- 圆角收敛到中等尺寸，控件和按钮不使用胶囊式外观；
- 主按钮使用石板蓝实底，次按钮使用透明底和石板蓝边框；
- 禁用态通过降低不透明度表达，不引入新的强调色；
- 错误态保留暖色语义，但使用低饱和暖灰红，避免破坏莫兰迪基调。

## 4. 主题模型

新增独立主题目录：

```text
src/theme/
  types.ts
  stone-blue.ts
  registry.ts
  css-variables.ts
  index.ts
```

`ThemeDefinition` 包含三类信息：

```ts
interface ThemeDefinition {
  id: string
  name: string
  ui: {
    page: string
    surface: string
    primary: string
    text: string
    muted: string
    border: string
    overlay: string
    dangerSurface: string
    dangerText: string
    onPrimary: string
  }
  scene: {
    canvas: string
    numberToken: string
    numberText: string
    highProbabilityNumber: string
    title: string
    mutedText: string
    summaryText: string
  }
  platform: {
    navigationBarBackground: string
    navigationBarTextStyle: "black" | "white"
  }
}
```

主题注册表使用显式 ID：

```ts
const themeRegistry = {
  stoneBlue,
} as const

export const ACTIVE_THEME_ID = "stoneBlue"
export const activeTheme = themeRegistry[ACTIVE_THEME_ID]
```

新增主题时，开发者提供完整 `ThemeDefinition` 并注册。替换默认主题只需修改 `ACTIVE_THEME_ID`。类型系统必须拒绝缺失语义色的主题。

## 5. 样式接入

`css-variables.ts` 将 `activeTheme.ui` 映射为页面根节点的 CSS 自定义属性。首页根节点设置这些变量，页面、规则抽屉和指标摘要的 SCSS 只引用语义变量，不再维护散落的业务颜色。

核心变量包括：

```text
--theme-page
--theme-surface
--theme-primary
--theme-text
--theme-muted
--theme-border
--theme-overlay
--theme-danger-surface
--theme-danger-text
--theme-on-primary
```

规则开关的 `color` 属性直接读取 `activeTheme.ui.primary`。全局导航配置读取 `activeTheme.platform`，确保替换默认主题时导航栏同步变化。

平台最外层背景保留石板蓝回退色，用于页面根节点尚未挂载的短暂阶段；实际组件颜色以主题对象和 CSS 变量为准。

## 6. 地图与分享图接入

`createBoardScene` 接收主题参数，首页显示地图与离屏分享画布传入同一 `activeTheme`。主题只控制：

- 清屏背景；
- 数字牌底色、普通数字和 6/8 数字颜色；
- 图例文字；
- 分享图标题、副标题、规则摘要与指标文字。

`RESOURCE_COLORS` 与 `harborOpeningFill` 继续作为独立地图视觉配置。陆地、海洋、资源图例色块和资源港口开口仍读取现有资源色，不读取主题注册表。

这使页面与分享图保持同一主题，同时保证主题替换不会改变地图语义色块。

## 7. 组件表现

### 7.1 首页

- 页面使用石板蓝灰背景；
- 人数选择器使用浅色表面、细边框和深色文字；
- 规则按钮使用深色文字色作为实底；
- 地图容器使用浅色表面和细边框，无明显投影；
- 主操作使用主题主色，分享操作使用描边样式；
- 指标摘要与算法说明使用表面色和次级文字色。

### 7.2 规则抽屉

- 遮罩使用主题 `overlay`；
- 抽屉和粘性标题栏使用 `surface`；
- 分隔线使用 `border`；
- 关闭按钮使用浅蓝灰底，不再使用橙色；
- 开关读取主题主色；
- 规则模型、顺序和交互保持不变。

### 7.3 状态

- 配置已变更提示使用主题主色；
- 错误卡片使用低饱和暖灰红；
- 禁用态沿用平台禁用逻辑并降低透明度；
- 生成和导出 loading、成功揭示动画不修改。

## 8. 数据流

主题不进入业务状态，不写入本地缓存：

```text
themeRegistry
  -> activeTheme
     -> 首页 CSS 变量
     -> RulePanel 开关颜色
     -> createBoardScene 页面地图
     -> createBoardScene 分享图片
     -> app.config 导航栏颜色
```

地图生成状态、规则状态与主题定义互不依赖。未来若增加运行时切换，可在 `activeTheme` 选择层引入状态，而无需改动主题定义和组件语义变量。

## 9. 验证

自动验证包括：

- 主题注册表能返回完整的 `stoneBlue` 定义；
- CSS 变量映射覆盖全部 UI 语义色；
- `RESOURCE_COLORS` 的七个现有色值保持不变；
- 页面地图与分享图使用传入主题的场景颜色；
- 资源地块、海洋和资源图例仍使用 `RESOURCE_COLORS`；
- 现有生成、规则、分享和动画结构测试继续通过；
- TypeScript 类型检查通过；
- H5 与微信小程序构建通过。

视觉检查包括：

- H5 首页、规则抽屉、错误态和禁用态；
- 2–4 人与 5–6 人地图在石板蓝承载面上的可读性；
- 页面地图与导出分享图主题一致；
- 无明显投影、无遗留橙色控件、无被主题误改的资源色块。

## 10. 验收标准

- 页面、规则抽屉、地图辅助元素和分享图均呈现石板蓝莫兰迪平面风格；
- 地图七类资源色值与改造前完全一致；
- 所有主题相关颜色集中于主题定义或平台加载回退，不在业务组件中散落新色值；
- 新主题可通过实现 `ThemeDefinition`、注册主题和修改 `ACTIVE_THEME_ID` 完成替换；
- 不出现用户可见的主题切换入口；
- 生成、规则配置、分享、缓存和动画行为无回归；
- 测试、类型检查、H5 构建和微信小程序构建全部通过。
