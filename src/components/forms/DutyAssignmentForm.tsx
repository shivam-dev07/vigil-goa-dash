import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AssignmentMap } from '@/components/maps/AssignmentMap';
import { useRealTimeOfficers, useRealTimeDuties, useRealTimeVehicles } from '@/hooks/useRealTimeData';
import { dutiesService, Duty } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { UserPlus, Clock, MapPin, Circle } from 'lucide-react';
import L from 'leaflet';

export function DutyAssignmentForm() {
  const { officers } = useRealTimeOfficers();
  const { duties } = useRealTimeDuties();
  const { vehicles } = useRealTimeVehicles();
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<Array<{lat: number, lng: number}>>([]);
  const [geofenceRadius, setGeofenceRadius] = useState(200);
  const [currentGeofence, setCurrentGeofence] = useState<L.Circle | null>(null);
  const [showMapCircle, setShowMapCircle] = useState(false);
  const [showExistingDuties, setShowExistingDuties] = useState(true);
  
  const [formData, setFormData] = useState({
    officerIds: [] as string[], // Changed to array
    vehicleIds: [] as string[], // Added for vehicles
    dutyType: '' as 'naka' | 'patrol' | '',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0], // Today's date
    endTime: '17:00',
    locationName: '',
    comments: '',
  });

  const [officerSearchTerm, setOfficerSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);

  const availableOfficers = officers.filter(officer => 
    !officer.staff_nature_of_work?.toLowerCase().includes('absent') && 
    !officer.staff_nature_of_work?.toLowerCase().includes('leave')
  );

  // Filter officers based on search term
  const filteredOfficers = availableOfficers.filter(officer =>
    officer.staff_name?.toLowerCase().includes(officerSearchTerm.toLowerCase()) ||
    officer.staff_id?.toLowerCase().includes(officerSearchTerm.toLowerCase()) ||
    officer.staff_designation?.toLowerCase().includes(officerSearchTerm.toLowerCase())
  );

  const availableVehicles = vehicles.filter(vehicle => 
    vehicle.status === 'available' || !vehicle.status
  );

  // Helper function to create circle polygon from center and radius
  const createCirclePolygon = (center: [number, number], radius: number): Array<{lat: number, lng: number}> => {
    const points = [];
    const [lat, lng] = center;
    const earthRadius = 6371000; // Earth's radius in meters
    const angularRadius = radius / earthRadius;
    
    for (let i = 0; i < 16; i++) {
      const angle = (i * 360) / 16;
      const pointLat = lat + (angularRadius * Math.cos(angle * Math.PI / 180));
      const pointLng = lng + (angularRadius * Math.sin(angle * Math.PI / 180) / Math.cos(lat * Math.PI / 180));
      points.push({ lat: pointLat, lng: pointLng });
    }
    return points;
  };

  // Helper function to create patrol polygon (circular around point)
  const createPatrolPolygon = (center: [number, number]): Array<{lat: number, lng: number}> => {
    return createCirclePolygon(center, geofenceRadius);
  };

  // Function to show circle on map when ready
  const showCircleOnMap = (center: [number, number]) => {
    if (!mapRef.current || !formData.dutyType) return;
    
    // Remove previous circle
    if (currentGeofence) {
      mapRef.current.removeLayer(currentGeofence);
    }
    
    // Create new circle
    const circle = L.circle(center, {
      color: formData.dutyType === 'naka' ? '#22c55e' : '#3b82f6',
      fillColor: formData.dutyType === 'naka' ? '#22c55e' : '#3b82f6',
      fillOpacity: 0.2,
      radius: geofenceRadius
    }).addTo(mapRef.current);
    
    setCurrentGeofence(circle);
    setShowMapCircle(true);
  };

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };

  const handleRadiusChange = (radius: number) => {
    setGeofenceRadius(radius);
    
    // Update circle if it's already shown
    if (showMapCircle && mapRef.current) {
      if (selectedLocation) {
        showCircleOnMap(selectedLocation);
      } else {
        const mapCenter = mapRef.current.getCenter();
        showCircleOnMap([mapCenter.lat, mapCenter.lng]);
      }
    }
  };

  // Show circle when duty type and radius are ready
  React.useEffect(() => {
    if (formData.dutyType && mapRef.current) {
      // Show circle at map center initially
      const mapCenter = mapRef.current.getCenter();
      showCircleOnMap([mapCenter.lat, mapCenter.lng]);
    }
  }, [formData.dutyType, geofenceRadius]);

  // Update circle when radius changes
  React.useEffect(() => {
    if (showMapCircle && mapRef.current) {
      if (selectedLocation) {
        showCircleOnMap(selectedLocation);
      } else {
        const mapCenter = mapRef.current.getCenter();
        showCircleOnMap([mapCenter.lat, mapCenter.lng]);
      }
    }
  }, [geofenceRadius, selectedLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation || selectedPolygon.length === 0) {
      toast({
        title: "Location required",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    if (formData.officerIds.length === 0 || !formData.dutyType) {
      toast({
        title: "Missing information",
        description: "Please select at least one officer and duty type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedOfficers = officers.filter(o => formData.officerIds.includes(o.id!));
      if (selectedOfficers.length === 0) throw new Error('No valid officers selected');

      const selectedVehicles = vehicles.filter(v => formData.vehicleIds.includes(v.id!));

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date format');
      }

      if (startDateTime >= endDateTime) {
        throw new Error('End time must be after start time. Please ensure the end date/time is later than the start date/time.');
      }

      const dutyData: Omit<Duty, 'id' | 'createdAt' | 'updatedAt'> = {
        officerUids: formData.officerIds,
        vehicleIds: formData.vehicleIds.length > 0 ? formData.vehicleIds : undefined,
        type: formData.dutyType,
        location: {
          polygon: selectedPolygon,
        },
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: 'incomplete',
        assignedAt: new Date().toISOString(),
        comments: formData.comments || '',
      };

      const dutyId = await dutiesService.addDuty(dutyData);
      if (process.env.NODE_ENV === 'development') {
        console.log('Duty created successfully with ID:', dutyId, dutyData);
      }

      const officerNames = selectedOfficers.map(o => o.staff_name).join(', ');
      const vehicleNames = selectedVehicles.length > 0 ? selectedVehicles.map(v => v.vehicle_name).join(', ') : 'No vehicles';
      
      toast({
        title: "Duty assigned successfully",
        description: `${officerNames} has been assigned ${formData.dutyType} duty${selectedVehicles.length > 0 ? ` with vehicles: ${vehicleNames}` : ''}. You can see it on the map above or go to Dashboard to view all duties.`,
      });

      // Reset form
      setFormData({
        officerIds: [],
        vehicleIds: [],
        dutyType: '' as 'naka' | 'patrol' | '',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '17:00',
        locationName: '',
        comments: '',
      });
      setSelectedLocation(null);
      setSelectedPolygon([]);
      setShowMapCircle(false);
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
              <div className="flex items-center justify-between">
                <Label htmlFor="officers">Select Officers</Label>
                <Badge variant="outline" className="text-xs">
                  {availableOfficers.length} available
                </Badge>
              </div>

              {/* Selected Officers Display */}
              {formData.officerIds.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Selected Officers ({formData.officerIds.length})</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          officerIds: []
                        }));
                      }}
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                    {formData.officerIds.map((officerId) => {
                      const officer = availableOfficers.find(o => o.id === officerId);
                      if (!officer) return null;
                      
                      return (
                        <div key={officerId} className="flex items-center justify-between p-2 bg-primary/5 rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{officer.staff_id}</Badge>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{officer.staff_name}</span>
                              <span className="text-xs text-muted-foreground">{officer.staff_designation}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                officerIds: prev.officerIds.filter(id => id !== officerId) 
                              }));
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Officer Selection with Search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Available Officers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allOfficerIds = availableOfficers.map(o => o.id!);
                      setFormData(prev => ({ 
                        ...prev, 
                        officerIds: allOfficerIds
                      }));
                    }}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                </div>
                
                {/* Search Input */}
                <Input
                  placeholder="Search officers by name, ID, or designation..."
                  value={officerSearchTerm}
                  onChange={(e) => setOfficerSearchTerm(e.target.value)}
                  className="text-sm"
                />
                
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {filteredOfficers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {officerSearchTerm ? 'No officers found matching your search' : 'No officers available'}
                    </p>
                  ) : (
                    filteredOfficers.map((officer) => (
                      <div key={officer.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`officer-${officer.id}`}
                          checked={formData.officerIds.includes(officer.id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ 
                                ...prev, 
                                officerIds: [...prev.officerIds, officer.id!] 
                              }));
                            } else {
                              setFormData(prev => ({ 
                                ...prev, 
                                officerIds: prev.officerIds.filter(id => id !== officer.id) 
                              }));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`officer-${officer.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <Badge variant="outline" className="text-xs">{officer.staff_id}</Badge>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{officer.staff_name}</span>
                            <span className="text-xs text-muted-foreground">{officer.staff_designation}</span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {formData.officerIds.length === 0 && (
                <p className="text-sm text-muted-foreground">Please select at least one officer</p>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="vehicles">Select Vehicles (Optional)</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`vehicle-${vehicle.id}`}
                      checked={formData.vehicleIds.includes(vehicle.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            vehicleIds: [...prev.vehicleIds, vehicle.id!] 
                          }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            vehicleIds: prev.vehicleIds.filter(id => id !== vehicle.id) 
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`vehicle-${vehicle.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Badge variant="outline">{vehicle.vehicle_number}</Badge>
                      <span className="font-medium">{vehicle.vehicle_name}</span>
                    </label>
                  </div>
                ))}
              </div>
              {availableVehicles.length === 0 && (
                <p className="text-sm text-muted-foreground">No vehicles available</p>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Input
                id="comments"
                placeholder="Additional notes or instructions"
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              />
            </div>

            {(formData.dutyType === 'naka' || formData.dutyType === 'patrol') && (
              <div className="space-y-2">
                <Label htmlFor="radius">Area Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="50"
                  max="1000"
                  value={geofenceRadius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the radius to set the size of the duty area
                </p>
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
              disabled={loading || !selectedLocation || selectedPolygon.length === 0}
            >
              {loading ? 'Assigning...' : 'Assign Duty'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Assignment Map
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExistingDuties(!showExistingDuties)}
            >
              {showExistingDuties ? 'Hide' : 'Show'} Existing Duties
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {showMapCircle 
              ? "Click on the map to position the duty area, then click 'Assign Duty'"
              : "Select duty type and radius to see the area on the map"
            }
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <AssignmentMap 
            height="500px"
            center={[15.2993, 74.1240]}
            zoom={11}
            onMapReady={handleMapReady}
            onLocationSelect={(lat, lng) => {
              setSelectedLocation([lat, lng]);
              // Create polygon for database storage
              if (formData.dutyType === 'naka') {
                const polygon = createCirclePolygon([lat, lng], geofenceRadius);
                setSelectedPolygon(polygon);
              } else if (formData.dutyType === 'patrol') {
                const polygon = createPatrolPolygon([lat, lng]);
                setSelectedPolygon(polygon);
              }
            }}
            showExistingDuties={showExistingDuties}
            selectedDutyType={formData.dutyType}
            geofenceRadius={geofenceRadius}
            selectedLocation={selectedLocation}
          />
        </CardContent>
      </Card>
    </div>
  );
}