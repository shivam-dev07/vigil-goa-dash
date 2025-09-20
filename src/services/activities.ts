import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Activity interface based on the Firestore structure
export interface Activity {
  id?: string;
  title: string;
  description: string;
  type: 'check-in' | 'check-out' | 'patrol-update' | 'geofence-violation' | 'incident-report' | 'other';
  officerId: string;
  dutyId?: string;
  location: string; // Coordinates as string "lat, lng"
  timestamp: Timestamp | Date;
  createdAt?: Timestamp;
}

// Activities service
export const activitiesService = {
  // Get all activities
  async getActivities(): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'activities'), orderBy('timestamp', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  },

  // Get recent activities (last 20)
  async getRecentActivities(): Promise<Activity[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'activities'), orderBy('timestamp', 'desc'))
    );
    return querySnapshot.docs.slice(0, 20).map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  },

  // Get activities by officer
  async getActivitiesByOfficer(officerId: string): Promise<Activity[]> {
    const q = query(
      collection(db, 'activities'),
      where('officerId', '==', officerId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  },

  // Get activities by duty
  async getActivitiesByDuty(dutyId: string): Promise<Activity[]> {
    const q = query(
      collection(db, 'activities'),
      where('dutyId', '==', dutyId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  },

  // Add new activity
  async addActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'activities'), {
      ...activity,
      timestamp: activity.timestamp instanceof Date ? Timestamp.fromDate(activity.timestamp) : activity.timestamp,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Update activity
  async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    const activityRef = doc(db, 'activities', id);
    await updateDoc(activityRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete activity
  async deleteActivity(id: string): Promise<void> {
    const activityRef = doc(db, 'activities', id);
    await deleteDoc(activityRef);
  },

  // Listen to activities in real-time
  onActivitiesSnapshot(callback: (activities: Activity[]) => void) {
    return onSnapshot(
      query(collection(db, 'activities'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Activity));
        callback(activities);
      }
    );
  },

  // Listen to recent activities in real-time
  onRecentActivitiesSnapshot(callback: (activities: Activity[]) => void) {
    return onSnapshot(
      query(collection(db, 'activities'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const activities = snapshot.docs.slice(0, 20).map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Activity));
        callback(activities);
      }
    );
  }
};
