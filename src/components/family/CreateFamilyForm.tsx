import React, { useState } from 'react';
import { useFamily } from '../../hooks/use-family';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';

export function CreateFamilyForm(): React.ReactElement {
  const { createFamily, loading } = useFamily();
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!familyName.trim()) {
      setError('Family name is required');
      return;
    }

    try {
      const result = await createFamily(familyName);
      if (!result) {
        setError('Failed to create family. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="familyName">Family Name</Label>
        <Input
          id="familyName"
          type="text"
          value={familyName}
          onChange={e => setFamilyName(e.target.value)}
          placeholder="Enter your family name"
          disabled={loading}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Spinner className="mr-2" /> : null}
        Create Family
      </Button>
    </form>
  );
}
