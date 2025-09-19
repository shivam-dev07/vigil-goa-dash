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

  // Auto-update expired duties
  useEffect(() => {
    const checkExpiredDuties = () => {
      const now = new Date();
      duties.forEach(async (duty) => {
        if (duty.endTime && duty.status !== 'complete' && duty.status !== 'completed') {
          const endTime = new Date(duty.endTime);
          if (endTime < now) {
            try {
              await dutiesService.updateDuty(duty.id!, { status: 'completed' });
            } catch (error) {
              console.error('Failed to update expired duty:', error);
            }
          }
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkExpiredDuties, 60000);
    
    // Check immediately
    checkExpiredDuties();

    return () => clearInterval(interval);
  }, [duties]);

  const activeDuties = duties.filter(duty => 
    duty.status === 'active' || 
    (duty.status === 'incomplete' && duty.endTime && new Date(duty.endTime) > new Date())
  );
  const completedDuties = duties.filter(duty => 
    duty.status === 'completed' || 
    duty.status === 'complete' ||
    (duty.endTime && new Date(duty.endTime) <= new Date())
  );

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