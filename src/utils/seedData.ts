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

  // First, get the officer IDs from the database
  const officers = await officersService.getOfficers();
  if (officers.length === 0) {
    console.error('No officers found. Please seed officers first.');
    return;
  }

  const duties = [
    {
      officerUid: officers[0].id!, // Use the actual officer ID from database
      type: 'naka' as const,
      location: {
        polygon: [
          { lat: 15.4909, lng: 73.8278 },
          { lat: 15.4919, lng: 73.8288 },
          { lat: 15.4899, lng: 73.8268 },
          { lat: 15.4909, lng: 73.8278 }
        ]
      },
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'incomplete' as const,
      assignedAt: startTime.toISOString(),
      comments: 'Night shift naka duty at Panaji Market Square'
    },
    {
      officerUid: officers[1].id!, // Use the actual officer ID from database
      type: 'patrol' as const,
      location: {
        polygon: [
          { lat: 15.2700, lng: 73.9500 },
          { lat: 15.2750, lng: 73.9550 },
          { lat: 15.2650, lng: 73.9450 },
          { lat: 15.2700, lng: 73.9500 }
        ]
      },
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'incomplete' as const,
      assignedAt: startTime.toISOString(),
      comments: 'Beach road patrol duty'
    },
    {
      officerUid: officers[2]?.id || officers[0].id!, // Use third officer or fallback
      type: 'naka' as const,
      location: {
        polygon: [
          { lat: 15.3960, lng: 73.8157 },
          { lat: 15.4010, lng: 73.8207 },
          { lat: 15.3910, lng: 73.8107 },
          { lat: 15.3960, lng: 73.8157 }
        ]
      },
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'incomplete' as const,
      assignedAt: startTime.toISOString(),
      comments: 'Vasco area naka duty'
    }
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
  // Get actual duties and officers from database
  const duties = await dutiesService.getDuties();
  const officers = await officersService.getOfficers();
  
  if (duties.length === 0 || officers.length === 0) {
    console.error('No duties or officers found. Please seed them first.');
    return;
  }

  const logs = [
    {
      dutyId: duties[0].id!,
      officerId: duties[0].officerUid,
      officerName: officers.find(o => o.id === duties[0].officerUid)?.staff_name || 'Unknown Officer',
      action: 'check-in' as const,
      location: {
        name: 'Panaji Market Square',
        coordinates: [15.4909, 73.8278] as [number, number],
      },
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      details: 'On-time check-in for night shift',
    },
    {
      dutyId: duties[1]?.id || duties[0].id!,
      officerId: duties[1]?.officerUid || duties[0].officerUid,
      officerName: officers.find(o => o.id === (duties[1]?.officerUid || duties[0].officerUid))?.staff_name || 'Unknown Officer',
      action: 'patrol-update' as const,
      location: {
        name: 'Beach Road',
        coordinates: [15.2700, 73.9500] as [number, number],
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      details: 'Patrol route completed successfully',
    },
    {
      dutyId: duties[0].id!,
      officerId: duties[0].officerUid,
      officerName: officers.find(o => o.id === duties[0].officerUid)?.staff_name || 'Unknown Officer',
      action: 'incident-report' as const,
      location: {
        name: 'Market Area',
        coordinates: [15.4859, 73.8228] as [number, number],
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      details: 'Minor traffic violation reported and resolved',
    },
    {
      dutyId: duties[2]?.id || duties[0].id!,
      officerId: duties[2]?.officerUid || duties[0].officerUid,
      officerName: officers.find(o => o.id === (duties[2]?.officerUid || duties[0].officerUid))?.staff_name || 'Unknown Officer',
      action: 'check-out' as const,
      location: {
        name: 'Vasco Police Station',
        coordinates: [15.3960, 73.8157] as [number, number],
      },
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      details: 'End of shift check-out',
    },
    {
      dutyId: duties[1]?.id || duties[0].id!,
      officerId: duties[1]?.officerUid || duties[0].officerUid,
      officerName: officers.find(o => o.id === (duties[1]?.officerUid || duties[0].officerUid))?.staff_name || 'Unknown Officer',
      action: 'geofence-violation' as const,
      location: {
        name: 'Calangute Beach',
        coordinates: [15.5400, 73.7500] as [number, number],
      },
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      details: 'Officer left assigned patrol area',
    },
    {
      dutyId: duties[1]?.id || duties[0].id!,
      officerId: duties[1]?.officerUid || duties[0].officerUid,
      officerName: officers.find(o => o.id === (duties[1]?.officerUid || duties[0].officerUid))?.staff_name || 'Unknown Officer',
      action: 'patrol-update' as const,
      location: {
        name: 'Margao City Center',
        coordinates: [15.2700, 73.9500] as [number, number],
      },
      timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
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