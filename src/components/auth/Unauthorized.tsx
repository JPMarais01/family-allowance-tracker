import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function Unauthorized(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="text-center py-10 px-6">
      <div className="flex flex-col items-center gap-8">
        <div className="inline-block">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mt-6 mb-2">Access Denied</h2>
        <p className="text-gray-500">
          You don't have permission to access this page. Please contact your administrator if you
          believe this is an error.
        </p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
