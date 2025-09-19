import { useState, useEffect } from 'react';
import { 
  Officer, 
  Duty, 
  ComplianceLog,
  officersService,
  dutiesService,
  complianceService 
} from '@/services/firestore';

export const useRealTimeOfficers = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = officersService.onOfficersSnapshot(
      (data) => {
        setOfficers(data);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, []);

  return { officers, loading, error };
};

export const useRealTimeDuties = () => {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = dutiesService.onDutiesSnapshot(
      (data) => {
        setDuties(data);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const activeDuties = duties.filter(duty => duty.status === 'active');
  const completedDuties = duties.filter(duty => duty.status === 'completed');

  return { 
    duties, 
    activeDuties, 
    completedDuties, 
    loading, 
    error 
  };
};

export const useRealTimeCompliance = () => {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = complianceService.onComplianceSnapshot(
      (data) => {
        setLogs(data);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const recentLogs = logs.slice(0, 10); // Latest 10 logs

  return { logs, recentLogs, loading, error };
};