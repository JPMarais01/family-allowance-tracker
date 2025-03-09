import React, { useState } from 'react';
import { useFamily } from '../../hooks/use-family';
import { FamilyMember, UpdateFamilyMemberInput } from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';

export function FamilyMembersList(): React.ReactElement {
  const { familyMembers, deleteFamilyMember, updateFamilyMember, loading } = useFamily();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateFamilyMemberInput>({
    id: '',
    name: '',
    role: 'child',
    base_allowance: 0,
  });

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member.id);
    setEditFormData({
      id: member.id,
      name: member.name,
      role: member.role,
      base_allowance: member.base_allowance || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
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

  const handleDelete = async (memberId: string) => {
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
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium">{member.name}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    {member.role === 'child' && member.base_allowance !== null && (
                      <span className="ml-2">
                        (Base Allowance: ${member.base_allowance.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleEdit(member)} variant="outline" size="sm">
                    Edit
                  </Button>
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
