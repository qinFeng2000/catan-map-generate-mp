# 卡坦岛地图生成器

基于 Taro 4、React 和 TypeScript 的离线六边形资源地图生成器，支持 H5 与微信小程序。

## 开发

```bash
pnpm install
pnpm dev:h5
pnpm dev:weapp
```

## 验证

```bash
pnpm test
pnpm typecheck
pnpm build:h5
pnpm build:weapp
```

## 设计约束

- Fisher–Yates 决定资源、数字和坐标的约束搜索顺序。
- 港口位置、类型和开口方向按版图固定。
- 5–6 人版包含规格中说明的两个数学必要例外。
- 地图与分享图片复用同一绘图模型。
- 项目不包含原游戏版权美术素材。
