/**
 * CalorieChart — structural and rendering tests.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CalorieChart } from '@/features/progress/components/CalorieChart';
import type { ComponentType } from 'react';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const mock = (name: string) => ({ children, ...props }: any) =>
    React.createElement(name, props, children);
  return {
    __esModule: true,
    default: mock('Svg'),
    Svg: mock('Svg'),
    G: mock('G'),
    Rect: mock('Rect'),
    Line: mock('Line'),
    Text: mock('SvgText'),
    Path: mock('Path'),
    Circle: mock('Circle'),
  };
});

const DATES = [
  '2026-05-17',
  '2026-05-18',
  '2026-05-19',
  '2026-05-20',
  '2026-05-21',
  '2026-05-22',
  '2026-05-23',
];
const KCALS = [1800, 2100, 0, 1950, 2200, 1750, 1600];
const TARGET = 2000;

describe('CalorieChart', () => {
  it('renders without crashing with empty data', () => {
    const { toJSON } = render(
      <CalorieChart dates={[]} kcals={[]} target={TARGET} width={320} />
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the correct number of bars (Rect elements) for each date', () => {
    const { UNSAFE_getAllByType } = render(
      <CalorieChart dates={DATES} kcals={KCALS} target={TARGET} width={320} />
    );
    // Each date gets one Rect bar
    const rects = UNSAFE_getAllByType('Rect' as unknown as ComponentType<unknown>);
    expect(rects.length).toBe(DATES.length);
  });

  it('renders a placeholder bar for a day with 0 kcal', () => {
    const { UNSAFE_getAllByType } = render(
      <CalorieChart dates={DATES} kcals={KCALS} target={TARGET} width={320} />
    );
    // Index 2 is kcal=0 — its bar should have the surfaceAlt fill color
    const rects = UNSAFE_getAllByType('Rect' as unknown as ComponentType<unknown>);
    // Find the zero-kcal bar by its fill prop
    const zeroBar = rects.find((r: any) => r.props.fill === '#242424'); // colors.surfaceAlt
    expect(zeroBar).toBeDefined();
  });

  it('renders the target dashed line (Line element)', () => {
    const { UNSAFE_getAllByType } = render(
      <CalorieChart dates={DATES} kcals={KCALS} target={TARGET} width={320} />
    );
    const lines = UNSAFE_getAllByType('Line' as unknown as ComponentType<unknown>);
    // At least one Line should be the dashed target line
    const targetLine = lines.find(
      (l: any) => typeof l.props.strokeDasharray === 'string' && l.props.strokeDasharray.length > 0
    );
    expect(targetLine).toBeDefined();
  });

  it('colors bars red when kcal is more than 10% over target', () => {
    // 2200 is 10% over 2000, so exactly at threshold — >10% means >2200
    // 2300 is 15% over target → danger
    const kcals = [2300, 1800, 0, 1950, 2200, 1750, 1600];
    const { UNSAFE_getAllByType } = render(
      <CalorieChart dates={DATES} kcals={kcals} target={2000} width={320} />
    );
    const rects = UNSAFE_getAllByType('Rect' as unknown as ComponentType<unknown>);
    const dangerBar = rects.find((r: any) => r.props.fill === '#FB7185'); // colors.danger
    expect(dangerBar).toBeDefined();
  });

  it('colors under-target bars with accent color', () => {
    const kcals = [1800, 1800, 1800, 1800, 1800, 1800, 1800];
    const { UNSAFE_getAllByType } = render(
      <CalorieChart dates={DATES} kcals={kcals} target={2000} width={320} />
    );
    const rects = UNSAFE_getAllByType('Rect' as unknown as ComponentType<unknown>);
    const accentBars = rects.filter((r: any) => r.props.fill === '#4ADE80'); // colors.accent
    expect(accentBars.length).toBe(7);
  });

  it('renders X-axis day labels (SvgText elements)', () => {
    const { UNSAFE_getAllByType } = render(
      <CalorieChart dates={DATES} kcals={KCALS} target={TARGET} width={320} />
    );
    // One SvgText per date for the day abbreviation
    const texts = UNSAFE_getAllByType('SvgText' as unknown as ComponentType<unknown>);
    expect(texts.length).toBeGreaterThanOrEqual(DATES.length);
  });
});
