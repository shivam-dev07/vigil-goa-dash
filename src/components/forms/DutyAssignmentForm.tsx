import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { useRealTimeOfficers } from '@/hooks/useRealTimeData';
import { dutiesService, Duty } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { UserPlus, Clock, MapPin, Circle } from 'lucide-react';
import L from 'leaflet';

export function DutyAssignmentForm() {
  const { officers } = useRealTimeOfficers();
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState(200);
  const [currentGeofence, setCurrentGeofence] = useState<L.Circle | null>(null);
  
  const [formData, setFormData] = useState({
    officerId: '',
    dutyType: '' as 'naka' | 'patrol' | '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    locationName: '',
  });

  const [loading, setLoading] = useState(false);

  const availableOfficers = officers.filter(officer => officer.status === 'active');

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    
    // Add click handler for location selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedLocation([lat, lng]);
      
      // Remove previous marker/geofence
      if (currentGeofence) {
        map.removeLayer(currentGeofence);
      }
      
      // Add new location marker
      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup('Selected duty location')
        .openPopup();
      
      // Add geofence if Naka duty
      if (formData.dutyType === 'naka') {
        const circle = L.circle([lat, lng], {
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.2,
          radius: geofenceRadius
        }).addTo(map);
        setCurrentGeofence(circle);
      }
    });
  };

  const handleRadiusChange = (radius: number) => {
    setGeofenceRadius(radius);
    
    if (currentGeofence && selectedLocation && mapRef.current) {
      mapRef.current.removeLayer(currentGeofence);
      
      const newCircle = L.circle(selectedLocation, {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        radius: radius
      }).addTo(mapRef.current);
      
      setCurrentGeofence(newCircle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    if (!formData.officerId || !formData.dutyType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedOfficer = officers.find(o => o.id === formData.officerId);
      if (!selectedOfficer) throw new Error('Officer not found');

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const dutyData: Omit<Duty, 'id' | 'createdAt' | 'updatedAt'> = {
        officerId: formData.officerId,
        officerName: selectedOfficer.name,
        officerBadge: selectedOfficer.badgeId,
        type: formData.dutyType,
        location: {
          name: formData.locationName || 'Selected Location',
          coordinates: selectedLocation,
          geofence: formData.dutyType === 'naka' ? { radius: geofenceRadius } : undefined,
        },
        startTime: Timestamp.fromDate(startDateTime),
        endTime: Timestamp.fromDate(endDateTime),
        status: 'assigned',
      };

      await dutiesService.addDuty(dutyData);

      toast({
        title: "Duty assigned successfully",
        description: `${selectedOfficer.name} has been assigned ${formData.dutyType} duty`,
      });

      // Reset form
      setFormData({
        officerId: '',
        dutyType: '' as 'naka' | 'patrol' | '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        locationName: '',
      });
      setSelectedLocation(null);
      if (currentGeofence && mapRef.current) {
        mapRef.current.removeLayer(currentGeofence);
        setCurrentGeofence(null);
      }

    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create Duty Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="officer">Select Officer</Label>
              <Select 
                value={formData.officerId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, officerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an available officer" />
                </SelectTrigger>
                <SelectContent>
                  {availableOfficers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id!}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{officer.badgeId}</Badge>
                        <span>{officer.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dutyType">Duty Type</Label>
              <Select 
                value={formData.dutyType} 
                onValueChange={(value: 'naka' | 'patrol') => setFormData(prev => ({ ...prev, dutyType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="naka">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4" />
                      Naka (Checkpoint)
                    </div>
                  </SelectItem>
                  <SelectItem value="patrol">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Patrol
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                placeholder="e.g., Panaji Market Square"
                value={formData.locationName}
                onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
              />
            </div>

            {formData.dutyType === 'naka' && (
              <div className="space-y-2">
                <Label htmlFor="radius">Geofence Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="50"
                  max="1000"
                  value={geofenceRadius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                />
              </div>
            )}

            {selectedLocation && (
              <div className="p-3 bg-primary-light rounded-lg">
                <p className="text-sm font-medium text-primary">Selected Location:</p>
                <p className="text-xs text-muted-foreground">
                  Lat: {selectedLocation[0].toFixed(6)}, Lng: {selectedLocation[1].toFixed(6)}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !selectedLocation}
            >
              {loading ? 'Assigning...' : 'Assign Duty'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Assignment Map
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on the map to select duty location
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <InteractiveMap 
            height="500px"
            center={[15.2993, 74.1240]}
            zoom={11}
            onMapReady={handleMapReady}
          />
        </CardContent>
      </Card>
    </div>
  );
}