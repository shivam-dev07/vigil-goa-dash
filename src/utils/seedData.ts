import { Timestamp } from 'firebase/firestore';
import { officersService, dutiesService, complianceService } from '@/services/firestore';

// Seed data for development/demo
export const seedOfficers = async () => {
  const officers = [
    {
      staff_id: 'P012345',
      staff_name: 'Officer Sharma',
      staff_designation: 'Constable',
      staff_nature_of_work: 'Presently on duty',
    },
    {
      staff_id: 'P012346',
      staff_name: 'Officer Patel',
      staff_designation: 'Head Constable',
      staff_nature_of_work: 'Presently on duty',
    },
    {
      staff_id: 'P012347',
      staff_name: 'Officer Singh',
      staff_designation: 'Constable',
      staff_nature_of_work: 'Presently on S/L',
    },
    {
      staff_id: 'P012348',
      staff_name: 'Officer Das',
      staff_designation: 'Inspector',
      staff_nature_of_work: 'Presently on duty',
    },
  ];

  try {
    for (const officer of officers) {
      await officersService.addOfficer(officer);
    }
    console.log('Officers seeded successfully');
  } catch (error) {
    console.error('Error seeding officers:', error);
  }
};

export const seedDuties = async () => {
  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

  const duties = [
    {
      officerId: 'demo-1',
      officerName: 'Officer Sharma',
      officerBadge: 'P012345',
      type: 'naka' as const,
      location: {
        name: 'Panaji Market Square',
        coordinates: [15.4909, 73.8278] as [number, number],
        geofence: { radius: 200 },
      },
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      status: 'active' as const,
      checkInTime: Timestamp.fromDate(new Date(startTime.getTime() + 15 * 60 * 1000)),
    },
    {
      officerId: 'demo-2',
      officerName: 'Officer Patel',
      officerBadge: 'P012346',
      type: 'patrol' as const,
      location: {
        name: 'Beach Road Patrol',
        coordinates: [15.2700, 73.9500] as [number, number],
      },
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      status: 'active' as const,
      checkInTime: Timestamp.fromDate(new Date(startTime.getTime() + 10 * 60 * 1000)),
    },
  ];

  try {
    for (const duty of duties) {
      await dutiesService.addDuty(duty);
    }
    console.log('Duties seeded successfully');
  } catch (error) {
    console.error('Error seeding duties:', error);
  }
};

export const seedComplianceLogs = async () => {
  const logs = [
    {
      dutyId: 'demo-duty-1',
      officerId: 'demo-1',
      officerName: 'Officer Sharma',
      action: 'check-in' as const,
      location: {
        name: 'Panaji Market Square',
        coordinates: [15.4909, 73.8278] as [number, number],
      },
      timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
      details: 'On-time check-in for night shift',
    },
    {
      dutyId: 'demo-duty-2',
      officerId: 'demo-2',
      officerName: 'Officer Patel',
      action: 'patrol-update' as const,
      location: {
        name: 'Beach Road',
        coordinates: [15.2700, 73.9500] as [number, number],
      },
      timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), // 15 minutes ago
      details: 'Patrol route completed successfully',
    },
    {
      dutyId: 'demo-duty-1',
      officerId: 'demo-1',
      officerName: 'Officer Sharma',
      action: 'incident-report' as const,
      location: {
        name: 'Market Area',
        coordinates: [15.4859, 73.8228] as [number, number],
      },
      timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
      details: 'Minor traffic violation reported and resolved',
    },
    {
      dutyId: 'demo-duty-3',
      officerId: 'demo-3',
      officerName: 'Officer Singh',
      action: 'check-out' as const,
      location: {
        name: 'Vasco Police Station',
        coordinates: [15.3960, 73.8157] as [number, number],
      },
      timestamp: Timestamp.fromDate(new Date(Date.now() - 45 * 60 * 1000)), // 45 minutes ago
      details: 'End of shift check-out',
    },
    {
      dutyId: 'demo-duty-4',
      officerId: 'demo-4',
      officerName: 'Officer Das',
      action: 'geofence-violation' as const,
      location: {
        name: 'Calangute Beach',
        coordinates: [15.5400, 73.7500] as [number, number],
      },
      timestamp: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)), // 1 hour ago
      details: 'Officer left assigned patrol area',
    },
    {
      dutyId: 'demo-duty-2',
      officerId: 'demo-2',
      officerName: 'Officer Patel',
      action: 'patrol-update' as const,
      location: {
        name: 'Margao City Center',
        coordinates: [15.2700, 73.9500] as [number, number],
      },
      timestamp: Timestamp.fromDate(new Date(Date.now() - 90 * 60 * 1000)), // 1.5 hours ago
      details: 'Routine patrol check completed',
    },
  ];

  try {
    for (const log of logs) {
      await complianceService.addComplianceLog(log);
    }
    console.log('Compliance logs seeded successfully');
  } catch (error) {
    console.error('Error seeding compliance logs:', error);
  }
};

export const initializeDemoData = async () => {
  console.log('Initializing demo data...');
  await seedOfficers();
  await seedDuties();
  await seedComplianceLogs();
  console.log('Demo data initialization complete');
};