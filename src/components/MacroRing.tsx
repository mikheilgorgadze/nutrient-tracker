import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSize, fontWeight } from '@/lib/theme/tokens';

interface MacroRingProps {
  /** Calories consumed */
  kcal: number;
  /** Calorie target */
  kcalTarget: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  proteinTarget_g: number;
  carbsTarget_g: number;
  fatTarget_g: number;
  /** Outer ring diameter in px, default 140 */
  size?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes SVG arc stroke-dasharray/dashoffset for a progress circle.
 * cx/cy = center, r = radius, progress = 0..1
 */
function arcProps(progress: number, circumference: number) {
  const clamped = clamp(progress, 0, 1);
  return {
    strokeDasharray: circumference,
    strokeDashoffset: circumference * (1 - clamped),
  };
}

const STROKE_OUTER = 10;
const STROKE_INNER = 7;
const GAP = 4;

export function MacroRing({
  kcal,
  kcalTarget,
  protein_g,
  carbs_g,
  fat_g,
  proteinTarget_g,
  carbsTarget_g,
  fatTarget_g,
  size = 140,
}: MacroRingProps) {
  const cx = size / 2;
  const cy = size / 2;

  // Outer ring — kcal
  const rOuter = (size - STROKE_OUTER) / 2;
  const circumOuter = 2 * Math.PI * rOuter;
  const kcalArc = arcProps(kcalTarget > 0 ? kcal / kcalTarget : 0, circumOuter);
  const kcalColor =
    kcal >= kcalTarget
      ? colors.danger
      : kcal >= kcalTarget * 0.9
      ? colors.warning
      : colors.accent;

  // Inner rings — protein, carbs, fat
  const rProtein = rOuter - STROKE_OUTER / 2 - GAP - STROKE_INNER / 2;
  const rCarbs = rProtein - STROKE_INNER - GAP;
  const rFat = rCarbs - STROKE_INNER - GAP;

  const circumProtein = 2 * Math.PI * rProtein;
  const circumCarbs = 2 * Math.PI * rCarbs;
  const circumFat = 2 * Math.PI * rFat;

  const proteinArc = arcProps(proteinTarget_g > 0 ? protein_g / proteinTarget_g : 0, circumProtein);
  const carbsArc = arcProps(carbsTarget_g > 0 ? carbs_g / carbsTarget_g : 0, circumCarbs);
  const fatArc = arcProps(fatTarget_g > 0 ? fat_g / fatTarget_g : 0, circumFat);

  const kcalRemaining = Math.max(0, kcalTarget - kcal);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track circles */}
        <Circle cx={cx} cy={cy} r={rOuter} stroke={colors.border} strokeWidth={STROKE_OUTER} fill="none" />
        <Circle cx={cx} cy={cy} r={rProtein} stroke={colors.border} strokeWidth={STROKE_INNER} fill="none" />
        <Circle cx={cx} cy={cy} r={rCarbs} stroke={colors.border} strokeWidth={STROKE_INNER} fill="none" />
        <Circle cx={cx} cy={cy} r={rFat} stroke={colors.border} strokeWidth={STROKE_INNER} fill="none" />

        {/* Progress arcs — rotate -90deg so arc starts at 12 o'clock */}
        <Circle
          cx={cx} cy={cy} r={rOuter}
          stroke={kcalColor}
          strokeWidth={STROKE_OUTER}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={kcalArc.strokeDasharray}
          strokeDashoffset={kcalArc.strokeDashoffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
        <Circle
          cx={cx} cy={cy} r={rProtein}
          stroke={colors.protein}
          strokeWidth={STROKE_INNER}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={proteinArc.strokeDasharray}
          strokeDashoffset={proteinArc.strokeDashoffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
        <Circle
          cx={cx} cy={cy} r={rCarbs}
          stroke={colors.carbs}
          strokeWidth={STROKE_INNER}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={carbsArc.strokeDasharray}
          strokeDashoffset={carbsArc.strokeDashoffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
        <Circle
          cx={cx} cy={cy} r={rFat}
          stroke={colors.fat}
          strokeWidth={STROKE_INNER}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={fatArc.strokeDasharray}
          strokeDashoffset={fatArc.strokeDashoffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Center label */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.kcalValue} numberOfLines={1}>{Math.round(kcalRemaining)}</Text>
        <Text style={styles.kcalLabel}>kcal left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  kcalLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
});
