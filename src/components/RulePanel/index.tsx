import { Button, Switch, Text, View } from "@tarojs/components";
import type { BoardVersion } from "@/domain/board";
import type { GeneratorRules } from "@/domain/rules";
import { activeTheme, type ThemeDefinition } from "@/theme";
import {
  decrementIntersectionLimit,
  incrementIntersectionLimit,
  toggleRule,
} from "./model";
import "./index.scss";

const RULE_ROWS = [
  ["avoidCoastalDesert", "水边无沙漠"],
  ["uniqueNumberGroupPerResource", "同一资源不能出现相同数字"],
  ["maximizeSameNumberDistance", "最大化相同数字之间的距离"],
  ["forbidAdjacentSameNumberGroup", "6 和 8 不相邻"],
  ["disjointWoodBrickNumbers", "木材和砖块的编号并不相同"],
  ["balanceResourcePips", "资源平衡"],
  ["fairIntersections", "交叉路口公平"],
] as const;

interface RulePanelProps {
  theme?: ThemeDefinition;
  version: BoardVersion;
  rules: GeneratorRules;
  disabled: boolean;
  open: boolean;
  onClose(): void;
  onChange(rules: GeneratorRules): void;
}

export function RulePanel({
  theme = activeTheme,
  version,
  rules,
  disabled,
  open,
  onClose,
  onChange,
}: RulePanelProps) {
  if (!open) return null;

  return (
    <View className="rule-panel-overlay">
      <View className="rule-panel">
        <View className="rule-panel__header">
          <Text>生成规则设置</Text>
          <View className="rule-panel__close" onClick={onClose}>
            x
          </View>
        </View>
        <View className="rule-panel__body">
          {RULE_ROWS.map(([key, label]) => (
            <View className="rule-row" key={key}>
              <Text>{label}</Text>
              <Switch
                disabled={disabled}
                checked={rules[key]}
                color={theme.ui.primary}
                onChange={() => onChange(toggleRule(rules, key))}
              />
            </View>
          ))}
          <View className="rule-row rule-row--limit">
            <Switch
              disabled={disabled}
              checked={rules.intersectionResourceLimitEnabled}
              color={theme.ui.primary}
              onChange={() =>
                onChange(toggleRule(rules, "intersectionResourceLimitEnabled"))
              }
            />
            <Text>交叉路口最大相同资源</Text>
            <Button
              className={
                disabled
                  ? "rule-step-button rule-step-button--disabled"
                  : "rule-step-button"
              }
              disabled={disabled}
              onClick={() => onChange(decrementIntersectionLimit(rules))}
            >
              −
            </Button>
            <Text>{rules.maxSameResourcePerIntersection}</Text>
            <Button
              className={
                disabled
                  ? "rule-step-button rule-step-button--disabled"
                  : "rule-step-button"
              }
              disabled={disabled}
              onClick={() => onChange(incrementIntersectionLimit(rules))}
            >
              ＋
            </Button>
          </View>
          {version === "extension" && (
            <Text className="rule-panel__note">
              扩充版默认启用 6 和 8 不相邻，并保留一个 6/8 同资源例外，以及一个木材/砖块共享数字。
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
