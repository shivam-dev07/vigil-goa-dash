import { Timestamp } from 'firebase/firestore';
import { officersService, dutiesService, complianceService } from '@/services/firestore';

// Seed data for development/demo
export const seedOfficers = async () => {
  const officers = [
    {
      badgeId: 'P012345',
      name: 'Officer Sharma',
      email: 'sharma@goapolice.gov.in',
      phone: '+91-9876543210',
      rank: 'Constable',
      station: 'Panaji Police Station',
      status: 'active' as const,
    },
    {
      badgeId: 'P012346',
      name: 'Officer Patel',
      email: 'patel@goapolice.gov.in',
      phone: '+91-9876543211',
      rank: 'Head Constable',
      station: 'Margao Police Station',
      status: 'active' as const,
    },
    {
      badgeId: 'P012347',
      name: 'Officer Singh',
      email: 'singh@goapolice.gov.in',
      phone: '+91-9876543212',
      rank: 'Constable',
      station: 'Vasco Police Station',
      status: 'on-duty' as const,
    },
    {
      badgeId: 'P012348',
      name: 'Officer Das',
      email: 'das@goapolice.gov.in',
      phone: '+91-9876543213',
      rank: 'Inspector',
      station: 'Calangute Police Station',
      status: 'active' as const,
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
      timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)),
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
      timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
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
      timestamp: Timestamp.fromDate(new Date(Date.now() - 45 * 60 * 1000)),
      details: 'Minor traffic violation reported and resolved',
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