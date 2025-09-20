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
  selectedDutyId?: string;
  onDutyFocus?: (duty: any) => void;
  defaultRadius?: number;
}

export function InteractiveMap({ 
  height = '400px', 
  center = [15.2993, 74.1240], // Goa coordinates
  zoom = 11,
  onMapReady,
  selectedDutyId,
  onDutyFocus,
  defaultRadius = 200
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
    
    // Disable popup close on map click globally
    map.options.closePopupOnClick = false;
    
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

    // Get officer details helper with backward compatibility
    const getOfficerDetails = (duty: any) => {
      // Support multiple shapes: officerUids[], officerIds[], legacy officerUid
      const raw = duty.officerUids || duty.officerIds || (duty.officerUid ? [duty.officerUid] : []);
      const ids = (raw || []).map((v: any) => {
        if (v && typeof v === 'object') return String(v.id ?? v.uid ?? v.value ?? '').trim();
        return String(v ?? '').trim();
      }).filter((v: string) => v.length > 0);

      let dutyOfficers = officers.filter(o => o && ids.includes(String(o.id || '').trim()));
      if (dutyOfficers.length === 0) {
        dutyOfficers = officers.filter(o => o && ids.includes(String(o.staff_id || '').trim()));
      }

      if (dutyOfficers.length === 0) {
        return {
          name: ids.length ? `${ids.length} Officer${ids.length > 1 ? 's' : ''}` : 'Unassigned',
          designation: ids.length ? 'Assigned' : '—',
          staffId: ids.length ? ids.join(', ') : '—'
        };
      }

      if (dutyOfficers.length === 1) {
        const officer = dutyOfficers[0];
        return {
          name: officer.staff_name || 'Unknown Officer',
          designation: officer.staff_designation || 'Unknown',
          staffId: officer.staff_id || 'Unknown'
        };
      }

      // Multiple officers
      return {
        name: `${dutyOfficers.length} Officers`,
        designation: dutyOfficers.map(o => o.staff_designation).filter(Boolean).join(', '),
        staffId: dutyOfficers.map(o => o.staff_id).filter(Boolean).join(', ')
      };
    };

    // Filter duties: show any with a valid polygon that are not completed (ignore endTime to avoid hiding fresh assignments)
    const activeDuties = duties.filter(duty => {
      if (!duty || !duty.location || !Array.isArray(duty.location.polygon) || duty.location.polygon.length === 0) return false;
      if (duty.status === 'complete' || duty.status === 'completed') return false;
      return true;
    });

    // Collect all points to compute bounds later (include centers and polygon vertices)
    const allPoints: [number, number][] = [];

    if (process.env.NODE_ENV === 'development') {
      console.log('[InteractiveMap] duties total:', duties.length, 'active after filter:', activeDuties.length);
    }

    // Add markers for each active duty
    activeDuties.forEach(duty => {
      try {

      // Get center point from polygon (coerce to numbers and skip invalid)
      const validPoints = duty.location.polygon
        .map((p: any) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
        .filter((p: any) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      if (validPoints.length === 0) return; // skip invalid geometry
      const centerLat = validPoints.reduce((sum: number, p: any) => sum + p.lat, 0) / validPoints.length;
      const centerLng = validPoints.reduce((sum: number, p: any) => sum + p.lng, 0) / validPoints.length;
      const centerPoint: [number, number] = [centerLat, centerLng];

      const officer = getOfficerDetails(duty);
      allPoints.push(centerPoint);
      // Also include polygon vertices for better bounds
      if (Array.isArray(duty.location?.polygon)) {
        duty.location.polygon.forEach((pt: any) => {
          const lat = Number(pt?.lat);
          const lng = Number(pt?.lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            allPoints.push([lat, lng]);
          }
        });
      }

      // Create duty icon based on type
      const dutyIcon = L.divIcon({
        html: duty.type === 'naka' ? 'N' : 'P',
        iconSize: [30, 30],
        className: 'duty-marker'
      });

      // Check if this duty is selected to apply highlighting
      const isSelected = selectedDutyId === duty.id;
      const markerSize = isSelected ? [40, 40] : [30, 30];
      const markerClass = isSelected ? 'duty-marker selected-marker' : 'duty-marker';
      
      // Create marker with appropriate size based on selection
      const marker = L.marker(centerPoint, { 
        icon: L.divIcon({
          html: duty.type === 'naka' ? 'N' : 'P',
          iconSize: markerSize as [number, number],
          className: markerClass
        }),
        zIndexOffset: 1000
      })
        .bindPopup(`
          <div style="min-width: 250px; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" onclick="event.stopPropagation();">
            <div style="position: relative; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 16px;" onclick="event.stopPropagation();">
              <button onclick="event.stopPropagation(); this.closest('.leaflet-popup').remove();" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 16px; cursor: pointer; color: #666; padding: 4px; line-height: 1;">×</button>
              <div style="margin-bottom: 12px;" onclick="event.stopPropagation();">
                <div style="font-weight: 600; font-size: 16px; color: #1f2937; margin-bottom: 4px;">${officer.name}</div>
                <div style="font-size: 13px; color: #6b7280;">${officer.designation} • ${officer.staffId}</div>
              </div>
              <hr style="margin: 12px 0; border: none; border-top: 1px solid #e5e7eb;" onclick="event.stopPropagation();">
              <div style="font-size: 14px; line-height: 1.5;" onclick="event.stopPropagation();">
                <div style="margin-bottom: 6px;"><span style="font-weight: 600;">Type:</span> ${duty.type?.toUpperCase() || 'Unknown'}</div>
                <div style="margin-bottom: 6px;"><span style="font-weight: 600;">Status:</span> <span style="color: ${duty.status === 'complete' ? '#22c55e' : duty.status === 'incomplete' ? '#ef4444' : '#f59e0b'}; font-weight: 600;">${duty.status || 'Unknown'}</span></div>
                <div style="font-size: 12px; color: #6b7280;"><span style="font-weight: 600;">Assigned:</span> ${duty.assignedAt ? new Date(duty.assignedAt).toLocaleString('en-IN') : 'Unknown'}</div>
                ${duty.comments ? `<div style="margin-top: 8px; font-size: 12px;"><span style="font-weight: 600;">Comments:</span> ${duty.comments}</div>` : ''}
              </div>
            </div>
          </div>
        `, {
          closeOnClick: false,
          autoClose: false,
          closeOnEscapeKey: false,
          className: 'custom-popup',
          maxWidth: 300,
          minWidth: 250
        });

      // Store duty ID on marker for easy reference
      (marker as any).dutyId = duty.id;

      // Add event listener to prevent popup from closing when clicked
      marker.on('popupopen', () => {
        const popup = marker.getPopup();
        const popupElement = popup.getElement();
        if (popupElement) {
          // Simple approach: prevent clicks inside popup from closing it
          popupElement.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      });

      markersRef.current?.addLayer(marker);
      
      // If this marker is selected, open its popup immediately
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 50);
      }

      // Add geofence/polygon based on duty type
      if (duty.type === 'naka') {
        // Use default radius or calculate from polygon if no default provided
        let radius = defaultRadius;
        
        // If no default radius provided, calculate from polygon points
        if (!defaultRadius || defaultRadius <= 0) {
          let maxDistance = 0;
          duty.location.polygon.forEach(point => {
            const distance = Math.sqrt(
              Math.pow((point.lat - centerLat) * 111000, 2) + 
              Math.pow((point.lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
            );
            maxDistance = Math.max(maxDistance, distance);
          });
          radius = Math.max(maxDistance, 50); // Minimum 50 meters
        }
        
        // Debug logging (uncomment for debugging)
        // console.log(`NAKA Duty ${duty.id} - Using radius: ${radius}m (defaultRadius: ${defaultRadius})`);
        
        const isSelected = selectedDutyId === duty.id;
        const circle = L.circle(centerPoint, {
          color: isSelected ? '#16a34a' : '#22c55e',
          fillColor: isSelected ? '#16a34a' : '#22c55e',
          fillOpacity: isSelected ? 0.2 : 0.1,
          weight: isSelected ? 3 : 1,
          radius: radius
        });
        
        // Store duty ID on circle for easy reference
        (circle as any).dutyId = duty.id;
        
        markersRef.current?.addLayer(circle);
        // Push circle behind markers
        circle.bringToBack();
      } else if (duty.type === 'patrol') {
        // Use default radius or calculate from polygon if no default provided
        let radius = defaultRadius;
        
        // If no default radius provided, calculate from polygon points
        if (!defaultRadius || defaultRadius <= 0) {
          let maxDistance = 0;
          duty.location.polygon.forEach(point => {
            const distance = Math.sqrt(
              Math.pow((point.lat - centerLat) * 111000, 2) + 
              Math.pow((point.lng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
            );
            maxDistance = Math.max(maxDistance, distance);
          });
          radius = Math.max(maxDistance, 50); // Minimum 50 meters
        }
        
        // Debug logging (uncomment for debugging)
        // console.log(`PATROL Duty ${duty.id} - Using radius: ${radius}m (defaultRadius: ${defaultRadius})`);
        
        const isSelected = selectedDutyId === duty.id;
        const circle = L.circle(centerPoint, {
          color: isSelected ? '#2563eb' : '#3b82f6',
          fillColor: isSelected ? '#2563eb' : '#3b82f6',
          fillOpacity: isSelected ? 0.2 : 0.1,
          weight: isSelected ? 3 : 1,
          radius: radius
        });
        
        // Store duty ID on circle for easy reference
        (circle as any).dutyId = duty.id;
        
        markersRef.current?.addLayer(circle);
        // Push circle behind markers
        circle.bringToBack();
      }
      } catch (error) {
        console.error('Error processing duty:', duty.id, error);
      }
    });

    // Auto-fit map to show all duties if any are present
    try {
      if (mapInstanceRef.current && allPoints.length > 0 && !selectedDutyId) {
        const bounds = L.latLngBounds(allPoints as any);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } catch (e) {
      // no-op
    }

    // Ensure map recalculates layout after dynamic updates
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 50);
  }, [duties, officers, selectedDutyId]);

  // Focus on selected duty
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedDutyId) return;

    const selectedDuty = duties.find(duty => duty.id === selectedDutyId);
    if (!selectedDuty || !selectedDuty.location || !selectedDuty.location.polygon) return;

    // Calculate center point
    const centerLat = selectedDuty.location.polygon.reduce((sum, point) => sum + point.lat, 0) / selectedDuty.location.polygon.length;
    const centerLng = selectedDuty.location.polygon.reduce((sum, point) => sum + point.lng, 0) / selectedDuty.location.polygon.length;
    
    // Focus on the duty location with appropriate zoom level
    mapInstanceRef.current.setView([centerLat, centerLng], 16);
    
    // Find and open the popup for the selected duty after a short delay
    setTimeout(() => {
      if (markersRef.current) {
        markersRef.current.eachLayer((layer: any) => {
          if (layer.dutyId === selectedDutyId && layer.getPopup) {
            layer.openPopup();
          }
        });
      }
    }, 100);
    
    // Call the focus callback
    onDutyFocus?.(selectedDuty);
  }, [selectedDutyId, duties, onDutyFocus]);

  return (
    <>
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          border-radius: 0;
          padding: 0;
          pointer-events: auto;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
          width: auto !important;
          pointer-events: auto;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          pointer-events: auto;
        }
        .custom-popup .leaflet-popup-close-button {
          display: none;
        }
        .custom-popup {
          pointer-events: auto !important;
        }
        .custom-popup * {
          pointer-events: auto !important;
        }
        .leaflet-popup-pane {
          pointer-events: none;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          pointer-events: auto !important;
        }
        .custom-popup .leaflet-popup-content {
          pointer-events: auto !important;
        }
        .custom-popup .leaflet-popup-tip {
          pointer-events: auto !important;
        }
        .duty-marker {
          background: white;
          border: 2px solid #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .selected-marker {
          z-index: 1000 !important;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
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