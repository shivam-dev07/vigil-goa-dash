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
  staff_id: string;
  staff_name: string;
  staff_designation: string;
  staff_nature_of_work: string;
  status?: 'active' | 'inactive' | 'on-duty';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Duty interface
export interface Duty {
  id?: string;
  officerUid: string;
  type: 'naka' | 'patrol';
  location: {
    polygon: Array<{
      lat: number;
      lng: number;
    }>;
  };
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  status: 'incomplete' | 'complete' | 'assigned' | 'active' | 'completed' | 'missed';
  assignedAt: string; // ISO date string
  comments?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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

  // Delete officer
  async deleteOfficer(id: string): Promise<void> {
    const officerRef = doc(db, 'officers', id);
    await deleteDoc(officerRef);
  },

  // Listen to officers in real-time
  onOfficersSnapshot(callback: (officers: Officer[]) => void) {
    return onSnapshot(
      collection(db, 'officers'),
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

  // Delete duty
  async deleteDuty(id: string): Promise<void> {
    const dutyRef = doc(db, 'duties', id);
    await deleteDoc(dutyRef);
  },

  // Listen to duties in real-time
  onDutiesSnapshot(callback: (duties: Duty[]) => void) {
    return onSnapshot(
      collection(db, 'duties'),
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
      timestamp: log.timestamp instanceof Date ? Timestamp.fromDate(log.timestamp) : log.timestamp,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Delete compliance log
  async deleteComplianceLog(id: string): Promise<void> {
    const logRef = doc(db, 'compliance', id);
    await deleteDoc(logRef);
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