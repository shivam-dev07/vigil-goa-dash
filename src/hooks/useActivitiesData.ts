import { useState, useEffect } from 'react';
import { Activity } from '@/services/activities';
import { activitiesService } from '@/services/activities';

// Hook for real-time activities
export function useRealTimeActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await activitiesService.getActivities();
        setActivities(data);
        setError(null);
      } catch (err) {
        setError('Failed to load activities');
        console.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Set up real-time listener
    const unsubscribe = activitiesService.onActivitiesSnapshot(
      (newActivities) => {
        setActivities(newActivities);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, []);

  return { activities, loading, error };
}

// Hook for real-time recent activities
export function useRealTimeRecentActivities() {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await activitiesService.getRecentActivities();
        setRecentActivities(data);
        setError(null);
      } catch (err) {
        setError('Failed to load recent activities');
        console.error('Error loading recent activities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Set up real-time listener
    const unsubscribe = activitiesService.onRecentActivitiesSnapshot(
      (newActivities) => {
        setRecentActivities(newActivities);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, []);

  return { recentActivities, loading, error };
}

// Hook for activities by officer
export function useActivitiesByOfficer(officerId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!officerId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await activitiesService.getActivitiesByOfficer(officerId);
        setActivities(data);
        setError(null);
      } catch (err) {
        setError('Failed to load officer activities');
        console.error('Error loading officer activities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [officerId]);

  return { activities, loading, error };
}

// Hook for activities by duty
export function useActivitiesByDuty(dutyId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dutyId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await activitiesService.getActivitiesByDuty(dutyId);
        setActivities(data);
        setError(null);
      } catch (err) {
        setError('Failed to load duty activities');
        console.error('Error loading duty activities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [dutyId]);

  return { activities, loading, error };
}
