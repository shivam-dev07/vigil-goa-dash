import { UserPlus } from 'lucide-react';
import { DutyAssignmentForm } from '@/components/forms/DutyAssignmentForm';

export default function AssignDuty() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Assign Duty</h1>
      </div>

      <DutyAssignmentForm />
    </div>
  );
}