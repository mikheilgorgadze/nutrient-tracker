/**
 * Nutrition label scan tests.
 * Covers: analyzeLabelPhoto parsing, useLabelScan hook states,
 * and CreateFoodModal scan button + pre-fill behaviour.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// ── AI mock ───────────────────────────────────────────────────────────────────

const mockCreate = jest.fn();

jest.mock('@/lib/ai/client', () => ({
  getClient: jest.fn(() => ({ messages: { create: mockCreate } })),
  getApiKey: jest.fn(() => 'test-key'),
}));

// ── Image picker / manipulator mocks ──────────────────────────────────────────

const mockLaunch = jest.fn();
const mockManipulate = jest.fn();

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunch(...args),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulate(...args),
  SaveFormat: { JPEG: 'jpeg' },
}));

// ── Other mocks ───────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/features/foods/hooks/useFoodMutations', () => ({
  useFoodMutations: () => ({
    createFood: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/hooks/useDb', () => ({
  useDb: () => ({}),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_LABEL = {
  name: 'Greek Yogurt',
  brand: 'Chobani',
  serving_label: '3/4 cup (170g)',
  serving_size_g: 170,
  kcal_per_serving: 100,
  protein_g: 17,
  carbs_g: 6,
  fat_g: 0,
};

function makeApiResponse(json: object) {
  return {
    content: [{ type: 'text', text: JSON.stringify(json) }],
  };
}

function setupSuccessfulScan() {
  mockLaunch.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///photo.jpg' }],
  });
  mockManipulate.mockResolvedValue({ base64: 'abc123' });
  mockCreate.mockResolvedValue(makeApiResponse(MOCK_LABEL));
}

// ── analyzeLabelPhoto unit tests ───────────────────────────────────────────────

import { analyzeLabelPhoto } from '@/lib/ai/analyze';

describe('analyzeLabelPhoto', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns parsed label on valid response', async () => {
    mockCreate.mockResolvedValue(makeApiResponse(MOCK_LABEL));
    const result = await analyzeLabelPhoto('base64data');
    expect(result.name).toBe('Greek Yogurt');
    expect(result.kcal_per_serving).toBe(100);
    expect(result.protein_g).toBe(17);
  });

  it('strips markdown fences from response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n' + JSON.stringify(MOCK_LABEL) + '\n```' }],
    });
    const result = await analyzeLabelPhoto('base64data');
    expect(result.name).toBe('Greek Yogurt');
  });

  it('throws ParseError when required fields are missing', async () => {
    mockCreate.mockResolvedValue(makeApiResponse({ name: 'Incomplete' }));
    await expect(analyzeLabelPhoto('base64data')).rejects.toThrow();
  });

  it('throws ParseError on invalid JSON', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'not json' }] });
    await expect(analyzeLabelPhoto('base64data')).rejects.toThrow();
  });
});

// ── CreateFoodModal label scan integration ─────────────────────────────────────

import { CreateFoodModal } from '@/features/foods/components/CreateFoodModal';

describe('CreateFoodModal — label scan', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the "Scan nutrition label" button', () => {
    render(
      <CreateFoodModal visible={true} onClose={jest.fn()} onCreated={jest.fn()} />
    );
    expect(screen.getByLabelText('Scan nutrition label')).toBeTruthy();
  });

  it('pre-fills form fields after a successful scan', async () => {
    setupSuccessfulScan();

    render(
      <CreateFoodModal visible={true} onClose={jest.fn()} onCreated={jest.fn()} />
    );

    fireEvent.press(screen.getByLabelText('Scan nutrition label'));

    await waitFor(() => {
      expect(screen.getByText('Label scanned — edit below')).toBeTruthy();
    });

    // Name field should contain the scanned product name
    expect(screen.getByDisplayValue('Greek Yogurt')).toBeTruthy();
    expect(screen.getByDisplayValue('Chobani')).toBeTruthy();
    expect(screen.getByDisplayValue('3/4 cup (170g)')).toBeTruthy();
  });

  it('shows error message when scan fails', async () => {
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockManipulate.mockResolvedValue({ base64: 'abc123' });
    mockCreate.mockRejectedValue(new Error('Network timeout'));

    render(
      <CreateFoodModal visible={true} onClose={jest.fn()} onCreated={jest.fn()} />
    );

    fireEvent.press(screen.getByLabelText('Scan nutrition label'));

    await waitFor(() => {
      expect(screen.getByText(/Scan failed/)).toBeTruthy();
    });
  });

  it('does nothing when user cancels image picker', async () => {
    mockLaunch.mockResolvedValue({ canceled: true });

    render(
      <CreateFoodModal visible={true} onClose={jest.fn()} onCreated={jest.fn()} />
    );

    fireEvent.press(screen.getByLabelText('Scan nutrition label'));

    await waitFor(() => {
      // Button label should revert to idle state, not show error
      expect(screen.getByText('Scan nutrition label')).toBeTruthy();
    });
  });
});
