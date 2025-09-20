import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealTimeDuties } from '@/hooks/useRealTimeData';
import { useRealTimeOfficers } from '@/hooks/useRealTimeData';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
}

export function InteractiveMap({ 
  height = '400px', 
  center = [15.2993, 74.1240], // Goa coordinates
  zoom = 11,
  onMapReady 
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  
  const { duties } = useRealTimeDuties();
  const { officers } = useRealTimeOfficers();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Mock police stations
    const policeStations = [
      { name: 'Panaji Police Station', coords: [15.4909, 73.8278] as [number, number] },
      { name: 'Margao Police Station', coords: [15.2700, 73.9500] as [number, number] },
      { name: 'Vasco Police Station', coords: [15.3960, 73.8157] as [number, number] },
    ];

    // Add police station markers
    policeStations.forEach(station => {
      const policeIcon = L.divIcon({
        html: '🚔',
        iconSize: [30, 30],
        className: 'police-station-marker'
      });

      L.marker(station.coords, { icon: policeIcon })
        .addTo(map)
        .bindPopup(`<b>${station.name}</b><br/>Police Station`);
    });

    // Create markers layer group
    markersRef.current = L.layerGroup().addTo(map);

    // Mock patrol routes
    const patrolRoutes = [
      [
        [15.4909, 73.8278],
        [15.4859, 73.8228],
        [15.4809, 73.8178],
        [15.4759, 73.8128]
      ],
    ];

    patrolRoutes.forEach(route => {
      L.polyline(route as [number, number][], {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.7
      }).addTo(map);
    });

    mapInstanceRef.current = map;
    
    if (onMapReady) {
      onMapReady(map);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, onMapReady]);

  // Update markers when duties change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    // Clear existing duty markers
    markersRef.current.clearLayers();

    // Get officer details helper
    const getOfficerDetails = (officerUid: string) => {
      const officer = officers.find(o => o && o.id === officerUid);
      return officer ? {
        name: officer.staff_name || 'Unknown Officer',
        designation: officer.staff_designation || 'Unknown',
        staffId: officer.staff_id || 'Unknown'
      } : {
        name: 'Unknown Officer',
        designation: 'Unknown',
        staffId: 'Unknown'
      };
    };

    // Filter duties to show only active/incomplete duties that haven't expired
    const activeDuties = duties.filter(duty => {
      if (!duty || !duty.location || !duty.location.polygon || duty.location.polygon.length === 0) return false;
      
      // Don't show completed duties
      if (duty.status === 'complete' || duty.status === 'completed') return false;
      
      // Check if duty has expired
      if (duty.endTime) {
        const endTime = new Date(duty.endTime);
        const now = new Date();
        if (endTime < now) return false; // Duty has expired
      }
      
      return true;
    });

    // Add markers for each active duty
    activeDuties.forEach(duty => {

      // Get center point from polygon
      const centerLat = duty.location.polygon.reduce((sum, point) => sum + point.lat, 0) / duty.location.polygon.length;
      const centerLng = duty.location.polygon.reduce((sum, point) => sum + point.lng, 0) / duty.location.polygon.length;
      const centerPoint: [number, number] = [centerLat, centerLng];

      const officer = getOfficerDetails(duty.officerUid);

      // Create duty icon based on type
      const dutyIcon = L.divIcon({
        html: duty.type === 'naka' ? '🛑' : '🚶‍♂️',
        iconSize: [30, 30],
        className: 'duty-marker'
      });

      // Add marker
      const marker = L.marker(centerPoint, { icon: dutyIcon })
        .bindPopup(`
          <div style="min-width: 200px;">
            <b>${officer.name}</b><br/>
            <small>${officer.designation} • ${officer.staffId}</small><br/>
            <hr style="margin: 8px 0;">
            <b>Type:</b> ${duty.type?.toUpperCase() || 'Unknown'}<br/>
            <b>Status:</b> <span style="color: ${duty.status === 'complete' ? '#22c55e' : duty.status === 'incomplete' ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${duty.status || 'Unknown'}</span><br/>
            ${duty.comments ? `<b>Comments:</b> ${duty.comments}<br/>` : ''}
            <small><b>Assigned:</b> ${duty.assignedAt ? new Date(duty.assignedAt).toLocaleString('en-IN') : 'Unknown'}</small>
          </div>
        `);

      markersRef.current?.addLayer(marker);

      // Add geofence/polygon based on duty type
      if (duty.type === 'naka') {
        // For naka, create a circle from the polygon points
        const radius = Math.max(
          Math.abs(duty.location.polygon[0].lat - centerLat) * 111000, // Convert to meters
          Math.abs(duty.location.polygon[0].lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180)
        );
        
        const circle = L.circle(centerPoint, {
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.1,
          radius: radius
        });
        markersRef.current?.addLayer(circle);
      } else if (duty.type === 'patrol') {
        // For patrol, create a circle from the polygon points
        const radius = Math.max(
          Math.abs(duty.location.polygon[0].lat - centerLat) * 111000, // Convert to meters
          Math.abs(duty.location.polygon[0].lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180)
        );
        
        const circle = L.circle(centerPoint, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          radius: radius
        });
        markersRef.current?.addLayer(circle);
      }
    });
  }, [duties, officers]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg overflow-hidden border border-border"
    />
  );
}