import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChildScoreCard } from '../components/family/ChildScoreCard';
import { ScoreDisplay } from '../components/family/ScoreDisplay';
import { DailyScore, FamilyMember } from '../lib/types';

// Mock the hooks
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    familyMember: { id: 'test-family-member-id', role: 'parent' },
  }),
}));

vi.mock('../hooks/use-family-data', () => ({
  useFamilyData: () => ({
    loading: false,
    getFamilyByOwnerId: vi.fn().mockResolvedValue({ id: 'test-family-id', name: 'Test Family' }),
    getFamilyMembers: vi.fn().mockResolvedValue([
      { id: 'child-1', name: 'Child 1', role: 'child' },
      { id: 'child-2', name: 'Child 2', role: 'child' },
    ]),
    getDailyScore: vi.fn().mockResolvedValue({
      id: 'test-score-id',
      family_member_id: 'child-1',
      budget_cycle_id: 'test-cycle-id',
      score: 4,
      date: '2023-03-15',
      is_vacation: false,
      notes: 'Test note',
      created_at: '2023-03-15T12:00:00Z',
      updated_at: '2023-03-15T12:00:00Z',
    }),
    saveDailyScore: vi.fn().mockResolvedValue({
      id: 'test-score-id',
      family_member_id: 'child-1',
      budget_cycle_id: 'test-cycle-id',
      score: 5,
      date: '2023-03-15',
      is_vacation: false,
      notes: 'Updated note',
      created_at: '2023-03-15T12:00:00Z',
      updated_at: '2023-03-15T12:30:00Z',
    }),
    getBudgetCycleForDate: vi.fn().mockResolvedValue({
      id: 'test-cycle-id',
      family_id: 'test-family-id',
      start_date: '2023-03-01',
      end_date: '2023-03-31',
      created_at: '2023-03-01T00:00:00Z',
      updated_at: '2023-03-01T00:00:00Z',
    }),
  }),
}));

describe('ScoreDisplay Component', () => {
  it('renders "Add Score" button when no score is provided', () => {
    const onEdit = vi.fn();
    render(<ScoreDisplay score={null} onEdit={onEdit} />);

    expect(screen.getByText('No score recorded for this day.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Score' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Score' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('displays score details when a score is provided', () => {
    const onEdit = vi.fn();
    const score: DailyScore = {
      id: 'test-score-id',
      family_member_id: 'test-member-id',
      budget_cycle_id: 'test-cycle-id',
      score: 4,
      date: '2023-03-15',
      is_vacation: false,
      notes: 'Test note',
      created_at: '2023-03-15T12:00:00Z',
      updated_at: '2023-03-15T12:00:00Z',
    };

    render(<ScoreDisplay score={score} onEdit={onEdit} />);

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Daily Score')).toBeInTheDocument();
    expect(screen.getByText('Test note')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('displays vacation badge when is_vacation is true', () => {
    const onEdit = vi.fn();
    const score: DailyScore = {
      id: 'test-score-id',
      family_member_id: 'test-member-id',
      budget_cycle_id: 'test-cycle-id',
      score: 3,
      date: '2023-03-15',
      is_vacation: true,
      notes: null,
      created_at: '2023-03-15T12:00:00Z',
      updated_at: '2023-03-15T12:00:00Z',
    };

    render(<ScoreDisplay score={score} onEdit={onEdit} />);

    expect(screen.getByText('Vacation Day')).toBeInTheDocument();
  });
});

describe('ChildScoreCard Component', () => {
  const testMember: FamilyMember = {
    id: 'test-child-id',
    user_id: null,
    family_id: 'test-family-id',
    name: 'Test Child',
    role: 'child',
    base_allowance: 10,
    created_at: '2023-03-01T00:00:00Z',
    updated_at: '2023-03-01T00:00:00Z',
  };

  it('renders the child name and loads score data', async () => {
    render(<ChildScoreCard member={testMember} date={new Date('2023-03-15')} />);

    // Check that the child's name is displayed
    expect(screen.getByText('Test Child')).toBeInTheDocument();

    // Wait for the score to load
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });
});

// Additional tests would be added for ScoreInput and DailyScores components
