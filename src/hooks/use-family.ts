import { useContext } from 'react';
import { FamilyContext, FamilyContextType } from '../contexts/family-context';

// Custom hook to use the family context
export function useFamily(): FamilyContextType {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
