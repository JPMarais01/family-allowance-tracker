import React, { useState } from 'react';
import { FamilyMember, UpdateFamilyMemberInput } from '../../lib/types';
import { useFamilyStore } from '../../stores/FamilyStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { InviteMember } from './InviteMember';

export function FamilyMembersList(): React.ReactElement {
  const { familyMembers, deleteFamilyMember, updateFamilyMember, loading } = useFamilyStore();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateFamilyMemberInput>({
    id: '',
    name: '',
    role: 'child',
    base_allowance: 0,
  });

  const handleEdit = (member: FamilyMember): void => {
    setEditingMember(member.id);
    setEditFormData({
      id: member.id,
      name: member.name,
      role: member.role,
      base_allowance: member.role === 'child' ? member.base_allowance || 0 : undefined,
    });
  };

  const handleCancelEdit = (): void => {
    setEditingMember(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target as HTMLInputElement;

    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      const result = await updateFamilyMember(editFormData);
      if (result) {
        setEditingMember(null);
      }
    } catch (err) {
      console.error('Error updating family member:', err);
    }
  };

  const handleDelete = async (memberId: string): Promise<void> => {
    if (window.confirm('Are you sure you want to remove this family member?')) {
      try {
        await deleteFamilyMember(memberId);
      } catch (err) {
        console.error('Error deleting family member:', err);
      }
    }
  };

  if (loading && familyMembers.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return <p className="text-gray-500 italic">No family members added yet.</p>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium mb-3">Family Members</h4>
      <div className="space-y-4">
        {familyMembers.map(member => (
          <div key={member.id} className="p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            {editingMember === member.id ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    name="name"
                    type="text"
                    value={editFormData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                    disabled={loading}
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                  </select>
                </div>

                {editFormData.role === 'child' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Allowance</label>
                    <Input
                      name="base_allowance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.base_allowance}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} size="sm">
                    {loading ? <Spinner className="mr-1" /> : null}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between">
                <div className="flex flex-col items-start">
                  <h5 className="font-medium">{member.name}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    {member.role === 'child' && member.base_allowance !== null && (
                      <span className="ml-2">
                        (Base Allowance: R{member.base_allowance.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleEdit(member)} variant="outline" size="sm">
                    Edit
                  </Button>
                  {!member.user_id && (
                    <InviteMember memberId={member.id} memberName={member.name} />
                  )}
                  <Button onClick={() => handleDelete(member.id)} variant="destructive" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
