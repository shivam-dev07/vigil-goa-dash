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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Officer interface
export interface Officer {
  id?: string;
  badgeId: string;
  name: string;
  email: string;
  phone: string;
  rank: string;
  station: string;
  status: 'active' | 'inactive' | 'on-duty';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Duty interface
export interface Duty {
  id?: string;
  officerId: string;
  officerName: string;
  officerBadge: string;
  type: 'naka' | 'patrol';
  location: {
    name: string;
    coordinates: [number, number];
    geofence?: {
      radius: number; // for naka
      polygon?: [number, number][]; // for patrol
    };
  };
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'assigned' | 'active' | 'completed' | 'missed';
  checkInTime?: Timestamp;
  checkOutTime?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Compliance Log interface
export interface ComplianceLog {
  id?: string;
  dutyId: string;
  officerId: string;
  officerName: string;
  action: 'check-in' | 'check-out' | 'patrol-update' | 'geofence-violation' | 'incident-report';
  location: {
    name: string;
    coordinates: [number, number];
  };
  timestamp: Timestamp;
  details?: string;
  photoUrl?: string;
  createdAt: Timestamp;
}

// Officers service
export const officersService = {
  // Get all officers
  async getOfficers(): Promise<Officer[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'officers'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Officer));
  },

  // Add new officer
  async addOfficer(officer: Omit<Officer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'officers'), {
      ...officer,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  // Update officer
  async updateOfficer(id: string, updates: Partial<Officer>): Promise<void> {
    const officerRef = doc(db, 'officers', id);
    await updateDoc(officerRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Listen to officers in real-time
  onOfficersSnapshot(callback: (officers: Officer[]) => void) {
    return onSnapshot(
      query(collection(db, 'officers'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const officers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Officer));
        callback(officers);
      }
    );
  }
};

// Duties service
export const dutiesService = {
  // Get all duties
  async getDuties(): Promise<Duty[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'duties'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Duty));
  },

  // Add new duty
  async addDuty(duty: Omit<Duty, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'duties'), {
      ...duty,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  // Update duty status
  async updateDuty(id: string, updates: Partial<Duty>): Promise<void> {
    const dutyRef = doc(db, 'duties', id);
    await updateDoc(dutyRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Listen to duties in real-time
  onDutiesSnapshot(callback: (duties: Duty[]) => void) {
    return onSnapshot(
      query(collection(db, 'duties'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const duties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Duty));
        callback(duties);
      }
    );
  }
};

// Compliance logs service
export const complianceService = {
  // Get compliance logs
  async getComplianceLogs(): Promise<ComplianceLog[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'compliance'), orderBy('timestamp', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ComplianceLog));
  },

  // Add compliance log
  async addComplianceLog(log: Omit<ComplianceLog, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'compliance'), {
      ...log,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Listen to compliance logs in real-time
  onComplianceSnapshot(callback: (logs: ComplianceLog[]) => void) {
    return onSnapshot(
      query(collection(db, 'compliance'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ComplianceLog));
        callback(logs);
      }
    );
  }
};