import { createContext } from 'react';
import {
  AddFamilyMemberInput,
  Family,
  FamilyMember,
  FamilySettings,
  UpdateFamilyMemberInput,
} from '../lib/types';

// Define types for our context
export type FamilyContextType = {
  family: Family | null;
  familyMembers: FamilyMember[];
  familySettings: FamilySettings | null;
  loading: boolean;
  createFamily: (name: string) => Promise<Family | null>;
  addFamilyMember: (input: AddFamilyMemberInput) => Promise<FamilyMember | null>;
  updateFamilyMember: (input: UpdateFamilyMemberInput) => Promise<FamilyMember | null>;
  deleteFamilyMember: (memberId: string) => Promise<boolean>;
  refreshFamilyData: () => Promise<void>;
};

// Create the context with a default value
export const FamilyContext = createContext<FamilyContextType | undefined>(undefined);
