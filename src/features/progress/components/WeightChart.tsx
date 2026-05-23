import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight } from '@/lib/theme/tokens';

interface WeightChartProps {
  dates: string[];
  rawWeights: number[];
  smoothedWeights: number[];
  width?: number;
  height?: number;
}

const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };

function mapToSvg(
  values: number[],
  minY: number,
  maxY: number,
  chartW: number,
  chartH: number,
): string {
  if (values.length === 0) return '';
  return values
    .map((v, i) => {
      const x = PADDING.left + (i / Math.max(values.length - 1, 1)) * chartW;
      const y = PADDING.top + chartH - ((v - minY) / Math.max(maxY - minY, 0.01)) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function WeightChart({
  dates,
  rawWeights,
  smoothedWeights,
  width = 320,
  height = 200,
}: WeightChartProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  if (rawWeights.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Ionicons name="scale-outline" size={36} color={colors.textTertiary} />
        <Text style={styles.emptyText}>No weight data yet</Text>
        <Text style={styles.emptySubtext}>Tap "Log weight" above to start tracking</Text>
      </View>
    );
  }

  const all = [...rawWeights, ...smoothedWeights];
  const dataMin = Math.min(...all);
  const dataMax = Math.max(...all);
  const pad = (dataMax - dataMin) * 0.05 || 1;
  const minY = dataMin - pad;
  const maxY = dataMax + pad;

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const rawPoints = mapToSvg(rawWeights, minY, maxY, chartW, chartH);
  const smoothPoints = mapToSvg(smoothedWeights, minY, maxY, chartW, chartH);

  // Y-axis labels (3 ticks)
  const yTicks = [minY, (minY + maxY) / 2, maxY];

  // Tooltip position
  const tooltipPoint =
    tooltipIdx !== null
      ? {
          x: PADDING.left + (tooltipIdx / Math.max(rawWeights.length - 1, 1)) * chartW,
          y:
            PADDING.top +
            chartH -
            ((rawWeights[tooltipIdx] - minY) / (maxY - minY)) * chartH,
          weight: rawWeights[tooltipIdx],
          date: dates[tooltipIdx] ?? '',
        }
      : null;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Y axis ticks */}
        {yTicks.map((tick, i) => {
          const y = PADDING.top + chartH - ((tick - minY) / (maxY - minY)) * chartH;
          return (
            <React.Fragment key={i}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={width - PADDING.right}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
              />
              <SvgText
                x={PADDING.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={fontSize.xs}
                fill={colors.textTertiary}
              >
                {tick.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Raw weight line — dimmed */}
        {rawPoints.length > 0 && (
          <Polyline
            points={rawPoints}
            fill="none"
            stroke={colors.textTertiary}
            strokeWidth={1}
          />
        )}

        {/* Smoothed EWMA line — bright */}
        {smoothPoints.length > 0 && (
          <Polyline
            points={smoothPoints}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Tap targets (invisible) + dots on tapped point */}
        {rawWeights.map((w, i) => {
          const x = PADDING.left + (i / Math.max(rawWeights.length - 1, 1)) * chartW;
          const y = PADDING.top + chartH - ((w - minY) / (maxY - minY)) * chartH;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={tooltipIdx === i ? 5 : 10}
              fill={tooltipIdx === i ? colors.accent : 'transparent'}
              onPress={() => setTooltipIdx(tooltipIdx === i ? null : i)}
            />
          );
        })}

        {/* Tooltip vertical line */}
        {tooltipPoint && (
          <Line
            x1={tooltipPoint.x}
            y1={PADDING.top}
            x2={tooltipPoint.x}
            y2={PADDING.top + chartH}
            stroke={colors.accent}
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}
      </Svg>

      {/* Tooltip label */}
      {tooltipPoint && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{tooltipPoint.date}</Text>
          <Text style={styles.tooltipWeight}>{tooltipPoint.weight.toFixed(1)} kg</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  tooltip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  tooltipDate: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  tooltipWeight: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
});
