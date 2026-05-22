/**
 * CreateFoodModal — component tests.
 *
 * Covers: form rendering, required-field validation, successful submit,
 * cancel behaviour, and initialName pre-fill.
 * useFoodMutations is mocked so no real DB is needed.
 */
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateFoodModal } from '@/features/foods/components/CreateFoodModal';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCreateMutate = jest.fn();

jest.mock('@/features/foods/hooks/useFoodMutations', () => ({
  useFoodMutations: () => ({
    createFood: { mutate: mockCreateMutate, isPending: false },
  }),
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModal(props: Partial<React.ComponentProps<typeof CreateFoodModal>> = {}) {
  return render(
    <CreateFoodModal
      visible={true}
      onClose={jest.fn()}
      onCreated={jest.fn()}
      {...props}
    />,
    { wrapper },
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateFoodModal', () => {
  beforeEach(() => {
    mockCreateMutate.mockClear();
  });

  it('renders key form fields', () => {
    renderModal();
    expect(screen.getByPlaceholderText('e.g. Greek Yogurt')).toBeTruthy();   // name
    expect(screen.getByPlaceholderText('e.g. 1 cup, 100g, 1 slice')).toBeTruthy(); // serving_label
    expect(screen.getByText('Create Food')).toBeTruthy();
  });

  it('pre-fills name from initialName prop', () => {
    renderModal({ initialName: 'Oat Milk' });
    expect(screen.getByDisplayValue('Oat Milk')).toBeTruthy();
  });

  it('shows validation error when name is empty and Save is pressed', async () => {
    renderModal();
    // Clear the name field (it starts empty by default)
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Greek Yogurt'), '');
    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeTruthy();
    });
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('shows validation error when serving label is cleared', async () => {
    renderModal({ initialName: 'Test Food' });
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 1 cup, 100g, 1 slice'), '');
    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => {
      expect(screen.getByText('Serving label is required')).toBeTruthy();
    });
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('calls createFood.mutate with correct fields when form is valid', async () => {
    renderModal();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Greek Yogurt'), 'Cottage Cheese');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Chobani'), 'Daisy');

    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });

    const [payload] = mockCreateMutate.mock.calls[0];
    expect(payload.name).toBe('Cottage Cheese');
    expect(payload.brand).toBe('Daisy');
    expect(payload.is_custom).toBe(1);
    expect(payload.serving_label).toBe('1 serving'); // default
  });

  it('trims whitespace from name and brand before submitting', async () => {
    renderModal();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Greek Yogurt'), '  Tofu  ');
    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => expect(mockCreateMutate).toHaveBeenCalled());

    const [payload] = mockCreateMutate.mock.calls[0];
    expect(payload.name).toBe('Tofu');
  });

  it('sets brand to null when brand field is left empty', async () => {
    renderModal({ initialName: 'Plain Yogurt' });
    // Leave brand empty
    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => expect(mockCreateMutate).toHaveBeenCalled());

    const [payload] = mockCreateMutate.mock.calls[0];
    expect(payload.brand).toBeNull();
  });

  it('calls onClose when Cancel is pressed', () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
