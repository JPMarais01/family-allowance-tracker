/**
 * Type definitions for the Family Allowance Tracker application
 */

// Family type
export interface Family {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

// Family member type
export interface FamilyMember {
  id: string;
  user_id: string | null;
  family_id: string;
  name: string;
  role: 'parent' | 'child';
  base_allowance: number | null;
  created_at: string;
  updated_at: string;
}

// Family settings type
export interface FamilySettings {
  family_id: string;
  budget_cycle_start_day: number;
  vacation_default_score: number;
  created_at: string;
  updated_at: string;
}

// Form input types
export interface CreateFamilyInput {
  name: string;
}

export interface AddFamilyMemberInput {
  name: string;
  role: 'parent' | 'child';
  base_allowance?: number;
}

export interface UpdateFamilyMemberInput {
  id: string;
  name?: string;
  role?: 'parent' | 'child';
  base_allowance?: number;
}
