import { Text, View } from "@tarojs/components";
import type { CSSProperties } from "react";
import type { DrawCommand } from "@/renderer/commands";
import { rpx } from "@/shared/units";
import { createBoardDomScene, type BoardDomLayer } from "./model";
import "./index.scss";

interface Props {
  commands: readonly DrawCommand[];
  designWidth: number;
  designHeight: number;
  renderWidth: number;
  renderHeight: number;
}

type RevealStyle = CSSProperties & { "--board-reveal-delay"?: string };

const layerClassName = (layer: BoardDomLayer): string =>
  [
    "board-dom__layer",
    layer.kind === "text" ? "board-dom__text" : "",
    layer.revealRole ? `board-dom__layer--${layer.revealRole}` : "",
  ]
    .filter(Boolean)
    .join(" ");

const layerStyle = (layer: BoardDomLayer): RevealStyle => ({
  ...layer.style,
  ...(layer.revealDelayMs === undefined
    ? {}
    : { "--board-reveal-delay": `${layer.revealDelayMs}ms` }),
});

export function BoardDom({
  commands,
  designWidth,
  designHeight,
  renderWidth,
  renderHeight,
}: Props) {
  const scene = createBoardDomScene(
    commands,
    renderWidth,
    renderHeight,
    designWidth,
  );

  return (
    <View
      className="board-dom"
      style={{ height: rpx(designHeight), backgroundColor: scene.background }}
    >
      {scene.layers.map((layer) =>
        layer.kind === "text" ? (
          <Text
            key={layer.key}
            className={layerClassName(layer)}
            style={layerStyle(layer)}
          >
            {layer.text}
          </Text>
        ) : (
          <View
            key={layer.key}
            className={layerClassName(layer)}
            style={layerStyle(layer)}
          />
        ),
      )}
    </View>
  );
}
