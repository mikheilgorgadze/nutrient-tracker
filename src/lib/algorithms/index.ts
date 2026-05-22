export { mifflinBMR, baselineTDEE, adaptiveTDEE, ACTIVITY_MULTIPLIERS } from './tdee';
export type { BMRParams, WeeklyDataPoint, TDEEEstimate } from './tdee';

export { dailyTargets } from './targets';
export type { GoalParams, MacroTargets } from './targets';

export { ewma, weeklyRateOfChange, toWeeklyAverages } from './trends';

export { macrosForServings, sumMacros } from './macros';
