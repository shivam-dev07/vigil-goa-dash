import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealTimeDuties, useRealTimeOfficers } from '@/hooks/useRealTimeData';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AssignmentMapProps {
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  showExistingDuties?: boolean;
  selectedDutyType?: 'naka' | 'patrol' | '';
  geofenceRadius?: number;
  selectedLocation?: [number, number] | null;
}

export function AssignmentMap({ 
  height = '500px', 
  center = [15.2993, 74.1240],
  zoom = 11,
  onMapReady,
  onLocationSelect,
  showExistingDuties = true,
  selectedDutyType,
  geofenceRadius = 200,
  selectedLocation
}: AssignmentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const assignmentCircleRef = useRef<L.Circle | null>(null);
  
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

    // Create markers layer group
    markersRef.current = L.layerGroup().addTo(map);

    // Add click handler for location selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationSelect?.(lat, lng);
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
  }, [center, zoom, onMapReady, onLocationSelect]);

  // Update existing duties markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current || !showExistingDuties) {
      if (markersRef.current) {
        markersRef.current.clearLayers();
      }
      return;
    }

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

    // Filter duties to show only active/incomplete duties
    const activeDuties = duties.filter(duty => {
      if (!duty || !duty.location || !duty.location.polygon || duty.location.polygon.length === 0) return false;
      if (duty.status === 'complete' || duty.status === 'completed') return false;
      if (duty.endTime) {
        const endTime = new Date(duty.endTime);
        const now = new Date();
        if (endTime < now) return false;
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

      // Create duty icon
      const dutyIcon = L.divIcon({
        html: duty.type === 'naka' ? '🛑' : '🚶',
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
            <small><b>Assigned:</b> ${duty.assignedAt ? new Date(duty.assignedAt).toLocaleString('en-IN') : 'Unknown'}</small>
          </div>
        `);

      markersRef.current?.addLayer(marker);

      // Add geofence/polygon
      if (duty.type === 'naka') {
        let maxDistance = 0;
        duty.location.polygon.forEach(point => {
          const distance = Math.sqrt(
            Math.pow((point.lat - centerLat) * 111000, 2) + 
            Math.pow((point.lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
          );
          maxDistance = Math.max(maxDistance, distance);
        });
        
        const radius = Math.max(maxDistance, 50);
        
        const circle = L.circle(centerPoint, {
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.1,
          weight: 1,
          radius: radius
        });
        markersRef.current?.addLayer(circle);
      } else if (duty.type === 'patrol') {
        let maxDistance = 0;
        duty.location.polygon.forEach(point => {
          const distance = Math.sqrt(
            Math.pow((point.lat - centerLat) * 111000, 2) + 
            Math.pow((point.lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
          );
          maxDistance = Math.max(maxDistance, distance);
        });
        
        const radius = Math.max(maxDistance, 50);
        
        const circle = L.circle(centerPoint, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1,
          radius: radius
        });
        markersRef.current?.addLayer(circle);
      }
    });
  }, [duties, officers, showExistingDuties]);

  // Update assignment circle
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation || !selectedDutyType) return;

    // Remove previous assignment circle
    if (assignmentCircleRef.current) {
      mapInstanceRef.current.removeLayer(assignmentCircleRef.current);
    }

    // Create new assignment circle
    const circle = L.circle(selectedLocation, {
      color: selectedDutyType === 'naka' ? '#16a34a' : '#2563eb',
      fillColor: selectedDutyType === 'naka' ? '#16a34a' : '#2563eb',
      fillOpacity: 0.3,
      weight: 3,
      radius: geofenceRadius
    }).addTo(mapInstanceRef.current);

    assignmentCircleRef.current = circle;
  }, [selectedLocation, selectedDutyType, geofenceRadius]);

  return (
    <>
      <style>{`
        .duty-marker {
          background: white;
          border: 2px solid #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-border"
      />
    </>
  );
}
