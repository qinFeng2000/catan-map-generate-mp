import { activeTheme } from "./theme";

export default defineAppConfig({
  pages: ["pages/index/index"],
  window: {
    navigationBarTitleText: "卡坦岛地图生成器",
    navigationBarBackgroundColor: activeTheme.platform.navigationBarBackground,
    navigationBarTextStyle: activeTheme.platform.navigationBarTextStyle,
    backgroundColor: activeTheme.ui.page,
  },
});
