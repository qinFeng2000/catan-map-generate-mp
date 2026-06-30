import { Text, View } from '@tarojs/components'
import type { BoardMetrics } from '@/domain/board'
import './index.scss'

export function MetricSummary({ metrics }: { metrics: BoardMetrics }) {
  return <View className='metric-summary'>
    <Text>同组数字最短距离 {metrics.sameNumberMinDistance} 格</Text>
    <Text>资源概率最大差值 {metrics.resourcePipRange}</Text>
    <Text>交叉点最高概率 {metrics.intersectionMaxPips}，最大差值 {metrics.intersectionPipRange}</Text>
  </View>
}
