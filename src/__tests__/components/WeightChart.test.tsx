/**
 * WeightChart — empty state and basic render tests.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WeightChart } from '@/features/progress/components/WeightChart';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const mock = (name: string) => ({ children, ...props }: Record<string, unknown>) =>
    React.createElement(name, props, children);
  return {
    __esModule: true,
    default: mock('Svg'),
    Polyline: mock('Polyline'),
    Circle: mock('Circle'),
    Line: mock('Line'),
    Text: mock('SvgText'),
  };
});

describe('WeightChart', () => {
  it('shows empty state message when no data', () => {
    render(<WeightChart dates={[]} rawWeights={[]} smoothedWeights={[]} />);
    expect(screen.getByText('No weight data yet')).toBeTruthy();
    expect(screen.getByText(/Tap "Log weight" above/)).toBeTruthy();
  });

  it('does not show empty state when data exists', () => {
    render(
      <WeightChart
        dates={['2026-05-01']}
        rawWeights={[75]}
        smoothedWeights={[75]}
      />
    );
    expect(screen.queryByText('No weight data yet')).toBeNull();
  });

  it('renders without crashing when given multiple data points', () => {
    const { toJSON } = render(
      <WeightChart
        dates={['2026-05-01', '2026-05-02', '2026-05-03']}
        rawWeights={[75, 74.8, 74.6]}
        smoothedWeights={[75, 74.96, 74.86]}
      />
    );
    expect(toJSON()).not.toBeNull();
  });
});
