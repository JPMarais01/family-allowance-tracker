import React, { useState } from 'react';
import { AddFamilyMemberInput } from '../../lib/types';
import { useFamilyStore } from '../../stores/FamilyStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';

export function AddFamilyMemberForm(): React.ReactElement {
  const { addFamilyMember, loading } = useFamilyStore();
  const [formData, setFormData] = useState<AddFamilyMemberInput>({
    name: '',
    role: 'child',
    base_allowance: 0,
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      const result = await addFamilyMember(formData);
      if (result) {
        // Reset form after successful submission
        setFormData({
          name: '',
          role: 'child',
          base_allowance: 0,
        });
      } else {
        setError('Failed to add family member. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  return (
    <div className="mb-6">
      <h4 className="text-lg font-medium mb-3">Add Family Member</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
            disabled={loading}
          >
            <option value="parent">Parent</option>
            <option value="child">Child</option>
          </select>
        </div>

        {formData.role === 'child' && (
          <div>
            <Label htmlFor="base_allowance">Base Allowance</Label>
            <Input
              id="base_allowance"
              name="base_allowance"
              type="number"
              min="0"
              step="0.01"
              value={formData.base_allowance}
              onChange={handleChange}
              placeholder="Enter base allowance"
              disabled={loading}
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Spinner className="mr-2" /> : null}
          Add Member
        </Button>
      </form>
    </div>
  );
}
