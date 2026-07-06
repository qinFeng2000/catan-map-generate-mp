import { Button, Picker, Text, View } from "@tarojs/components";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoardCanvas } from "@/components/BoardCanvas";
import { BoardDom } from "@/components/BoardDom";
import { MetricSummary } from "@/components/MetricSummary";
import { RulePanel } from "@/components/RulePanel";
import { BOARD_PRESETS } from "@/presets/board-presets";
import {
  createBoardScene,
  enabledRuleLines,
  getPageCanvasSize,
  getShareCanvasSize,
} from "@/renderer/board-scene";
import { createShareApi, shareImage } from "@/sharing/share-image";
import { rpx, toDisplayCanvasSize } from "@/shared/units";
import { activeTheme, themeCssVariables } from "@/theme";
import {
  getBoardVersionForPlayerOption,
  getPlayerOptionIndex,
  PLAYER_OPTIONS,
} from "./page-options";
import { openAlbumSettings, useBoardGenerator } from "./use-board-generator";
import { useCanvasWidth } from "./use-canvas-width";
import "./index.scss";

const DIAGNOSTIC_LABELS: Record<string, string> = {
  coastalDesert: "水边沙漠冲突",
  intersectionLimit: "交叉点资源冲突",
  groupRepeat: "同资源数字冲突",
  adjacentGroup: "相邻数字冲突",
  woodBrickOverlap: "木材砖块编号冲突",
  budget: "搜索预算耗尽",
};

interface PickerChangeEvent {
  detail: { value: number | string };
}

export default function IndexPage() {
  const { state, changeVersion, changeDraftRules, regenerate, dispatch } =
    useBoardGenerator();
  const canvasWidth = useCanvasWidth();
  const visibleBoard =
    state.board && state.board.version === state.version ? state.board : null;
  const displayPreset = visibleBoard
    ? BOARD_PRESETS[visibleBoard.version]
    : BOARD_PRESETS[state.version];
  const pageCanvasSize = getPageCanvasSize(displayPreset, canvasWidth);
  const pageRenderSize = toDisplayCanvasSize(
    pageCanvasSize.width,
    pageCanvasSize.height,
  );
  const [shareReady, setShareReady] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const playerOptionIndex = getPlayerOptionIndex(state.version);
  const commands = visibleBoard
    ? createBoardScene(visibleBoard, displayPreset, {
        ...pageRenderSize,
        theme: activeTheme,
        includeSummary: false,
        includeLegend: true,
      })
    : [];
  const shareDesignSize = useMemo(
    () => getShareCanvasSize(displayPreset),
    [displayPreset],
  );
  const shareRenderSize = shareDesignSize;
  const shareCommands = useMemo(
    () =>
      visibleBoard
        ? createBoardScene(visibleBoard, displayPreset, {
            ...shareRenderSize,
            theme: activeTheme,
            includeSummary: true,
            ruleLines: enabledRuleLines(
              state.appliedRules,
              visibleBoard.version,
            ),
          })
        : [],
    [visibleBoard, displayPreset, state.appliedRules, shareRenderSize],
  );
  const busy = state.status === "generating" || state.status === "exporting";

  useEffect(() => {
    setShareReady(false);
  }, [rulesOpen, visibleBoard?.createdAt, visibleBoard?.seed]);

  const handleShare = useCallback(async () => {
    if (!visibleBoard) return;
    if (!shareReady) {
      dispatch({ type: "export-failed", message: "图片仍在准备，请稍候" });
      return;
    }
    dispatch({ type: "export-started" });
    const platform = process.env.TARO_ENV === "h5" ? "h5" : "weapp";
    const result = await shareImage({
      platform,
      canvasId: "share-canvas",
      api: createShareApi(platform),
      outputWidth: shareRenderSize.width,
      outputHeight: shareRenderSize.height,
    });
    if (result.ok) {
      dispatch({ type: "export-succeeded" });
      return;
    }
    if (result.reason === "album-permission") {
      await openAlbumSettings();
      dispatch({
        type: "export-failed",
        message: "相册权限被拒绝，可预览图片或前往设置授权",
      });
      return;
    }
    dispatch({
      type: "export-failed",
      message:
        result.reason === "cancelled" ? "已取消分享" : "导出失败，请重试",
    });
  }, [
    dispatch,
    shareReady,
    shareRenderSize.height,
    shareRenderSize.width,
    visibleBoard,
  ]);

  const handlePlayerChange = useCallback(
    (event: PickerChangeEvent) => {
      const nextVersion = getBoardVersionForPlayerOption(
        Number(event.detail.value),
      );
      if (nextVersion !== state.version) changeVersion(nextVersion);
    },
    [changeVersion, state.version],
  );

  return (
    <View className="page" style={themeCssVariables(activeTheme, rpx)}>
      <View className="top-controls">
        <Picker
          className={
            busy
              ? "player-picker-control player-picker-control--disabled"
              : "player-picker-control"
          }
          mode="selector"
          range={PLAYER_OPTIONS.map((option) => option.label)}
          value={playerOptionIndex}
          disabled={busy}
          onChange={handlePlayerChange}
        >
          <View className="player-picker">
            <Text className="player-picker__label">人数</Text>
            <Text className="player-picker__value">
              {PLAYER_OPTIONS[playerOptionIndex]?.label}
            </Text>
          </View>
        </Picker>
        <Button
          className={
            busy
              ? "settings-button settings-button--disabled"
              : "settings-button"
          }
          disabled={busy}
          onClick={() => setRulesOpen(true)}
        >
          ⚙ 规则
        </Button>
      </View>
      <View
        className="map-card"
        style={{ minHeight: rpx(pageCanvasSize.height) }}
      >
        {visibleBoard && (
          <BoardDom
            key={`${visibleBoard.version}-${visibleBoard.seed}-${visibleBoard.createdAt}`}
            commands={commands}
            designWidth={pageCanvasSize.width}
            designHeight={pageCanvasSize.height}
            renderWidth={pageRenderSize.width}
            renderHeight={pageRenderSize.height}
          />
        )}
      </View>
      <View className="actions">
        <Button
          className={
            busy
              ? "action action--primary action--disabled"
              : "action action--primary"
          }
          disabled={busy}
          onClick={regenerate}
        >
          重新生成
        </Button>
        <Button
          className={
            !visibleBoard || busy
              ? "action action--secondary action--disabled"
              : "action action--secondary"
          }
          disabled={!visibleBoard || busy}
          onClick={handleShare}
        >
          分享图片
        </Button>
      </View>
      {state.dirty && (
        <Text className="dirty-note">配置已变更，点击重新生成后应用</Text>
      )}
      {state.message && (
        <View className="error-card">
          <Text>{state.message}</Text>
          {state.diagnostics &&
            Object.entries(state.diagnostics.pruned)
              .filter(([, count]) => count > 0)
              .map(([rule, count]) => (
                <Text key={rule}>
                  {DIAGNOSTIC_LABELS[rule] ?? rule}：{count} 次
                </Text>
              ))}
        </View>
      )}
      <RulePanel
        theme={activeTheme}
        version={state.version}
        rules={state.draftRules}
        disabled={busy}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onChange={changeDraftRules}
      />
      {visibleBoard && <MetricSummary metrics={visibleBoard.metrics} />}
      <Text className="algorithm-note">
        Fisher–Yates 随机排序 · 约束化生成 · 固定方向港口
      </Text>
      {visibleBoard && !rulesOpen && (
        <BoardCanvas
          canvasId="share-canvas"
          commands={shareCommands}
          designWidth={shareDesignSize.width}
          designHeight={shareDesignSize.height}
          renderWidth={shareRenderSize.width}
          renderHeight={shareRenderSize.height}
          offscreen
          onDrawn={() => setShareReady(true)}
        />
      )}
    </View>
  );
}
