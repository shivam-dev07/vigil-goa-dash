import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

    // Mock active duties
    const activeDuties = [
      { 
        officer: 'P012345 - Officer Sharma', 
        location: [15.4809, 73.8278] as [number, number],
        type: 'Naka',
        status: 'active'
      },
      { 
        officer: 'P012346 - Officer Patel', 
        location: [15.2800, 73.9400] as [number, number],
        type: 'Patrol',
        status: 'active'
      },
      { 
        officer: 'P012347 - Officer Singh', 
        location: [15.3860, 73.8057] as [number, number],
        type: 'Naka',
        status: 'active'
      },
    ];

    // Add duty markers
    activeDuties.forEach(duty => {
      const dutyIcon = L.divIcon({
        html: duty.type === 'Naka' ? '🛑' : '🚶‍♂️',
        iconSize: [25, 25],
        className: 'duty-marker'
      });

      L.marker(duty.location, { icon: dutyIcon })
        .addTo(map)
        .bindPopup(`
          <b>${duty.officer}</b><br/>
          Type: ${duty.type}<br/>
          Status: <span style="color: #22c55e; font-weight: bold;">${duty.status}</span>
        `);

      // Add geofence for Naka duties
      if (duty.type === 'Naka') {
        L.circle(duty.location, {
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.1,
          radius: 200
        }).addTo(map);
      }
    });

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

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg overflow-hidden border border-border"
    />
  );
}