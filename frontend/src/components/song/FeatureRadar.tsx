import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { AudioFeatures } from '../../types/music'
import { FEATURE_LABELS, normalizeFeature } from '../../utils/featureLabels'

interface FeatureRadarProps {
  features: AudioFeatures
}

export function FeatureRadar({ features }: FeatureRadarProps) {
  const data = FEATURE_LABELS.map(({ key, short }) => ({
    feature: short,
    value: parseFloat(normalizeFeature(key, features[key]).toFixed(2)),
    fullMark: 1,
  }))

  return (
    <div style={{ pointerEvents: 'none' }}>
      <ResponsiveContainer width="100%" height={210}>
        <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="feature"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          />
          <Radar
            dataKey="value"
            stroke="var(--color-cyan)"
            fill="var(--color-cyan)"
            fillOpacity={0.15}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
