import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize } from '@/lib/theme/tokens';

export interface CalorieChartProps {
  dates: string[];      // last N dates, oldest first, YYYY-MM-DD
  kcals: number[];      // daily kcal totals matching dates
  target: number;       // daily kcal target
  width: number;
  height?: number;      // default 180
}

const PADDING = { top: 12, right: 8, bottom: 24, left: 8 };
const OVER_TARGET_THRESHOLD = 1.1; // >10% over = danger color
const PLACEHOLDER_BAR_HEIGHT = 4;

/** Returns 'Mon', 'Tue', etc. from a YYYY-MM-DD string. */
function dayAbbrev(dateStr: string): string {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return DAYS[d.getDay()];
}

export function CalorieChart({
  dates,
  kcals,
  target,
  width,
  height = 180,
}: CalorieChartProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const count = Math.max(dates.length, 1);
  const BAR_GAP = 4;
  const totalGap = BAR_GAP * (count - 1);
  const barWidth = Math.max((chartW - totalGap) / count, 2);

  // Compute max for scaling — use target * 1.3 as minimum ceiling so the
  // target line is always somewhere in the middle of the chart.
  const maxKcal = Math.max(target * 1.3, ...kcals);

  /** Map a kcal value to a y-coordinate (SVG, top = 0). */
  function toY(kcal: number): number {
    return PADDING.top + chartH - (kcal / maxKcal) * chartH;
  }

  const targetY = toY(target);

  return (
    <View style={[styles.container, { width }]}>
      <Svg width={width} height={height} accessibilityLabel="calorie bar chart">
        {/* Target dashed line */}
        <Line
          x1={PADDING.left}
          y1={targetY}
          x2={width - PADDING.right}
          y2={targetY}
          stroke={colors.textTertiary}
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Bars */}
        <G>
          {dates.map((date, i) => {
            const kcal = kcals[i] ?? 0;
            const x = PADDING.left + i * (barWidth + BAR_GAP);
            const label = dayAbbrev(date);

            let barColor: string;
            let barH: number;
            let barY: number;

            if (kcal === 0) {
              // Placeholder: a tiny flat bar at the bottom
              barH = PLACEHOLDER_BAR_HEIGHT;
              barY = PADDING.top + chartH - PLACEHOLDER_BAR_HEIGHT;
              barColor = colors.surfaceAlt;
            } else {
              barH = Math.max((kcal / maxKcal) * chartH, PLACEHOLDER_BAR_HEIGHT);
              barY = PADDING.top + chartH - barH;
              barColor =
                kcal > target * OVER_TARGET_THRESHOLD
                  ? colors.danger
                  : colors.accent;
            }

            return (
              <React.Fragment key={date}>
                <Rect
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  fill={barColor}
                  rx={3}
                  ry={3}
                  accessibilityLabel={`${label} ${kcal} kcal`}
                />
                {/* X-axis label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={PADDING.top + chartH + 14}
                  textAnchor="middle"
                  fontSize={fontSize.xs}
                  fill={colors.textTertiary}
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
});
