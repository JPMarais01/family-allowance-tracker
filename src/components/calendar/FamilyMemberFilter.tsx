import * as React from 'react';
import { useFamily } from '../../hooks/use-family';
import { FamilyMember } from '../../lib/types';
import { cn } from '../../lib/utils';

interface FamilyMemberFilterProps {
  selectedMemberId?: string;
  onMemberSelect: (memberId: string) => void;
  className?: string;
}

export function FamilyMemberFilter({
  selectedMemberId,
  onMemberSelect,
  className,
}: FamilyMemberFilterProps): React.ReactElement {
  const { familyMembers, loading } = useFamily();

  // Filter to only show children
  const childMembers = React.useMemo(
    () => familyMembers.filter(member => member.role === 'child'),
    [familyMembers]
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onMemberSelect(e.target.value);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <label htmlFor="family-member-filter" className="text-sm font-medium">
        Child:
      </label>
      <select
        id="family-member-filter"
        value={selectedMemberId || ''}
        onChange={handleChange}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={loading || childMembers.length === 0}
      >
        {childMembers.length === 0 ? (
          <option value="">No children found</option>
        ) : (
          <>
            <option value="">All children</option>
            {childMembers.map((member: FamilyMember) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
}
