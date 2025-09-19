import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealTimeOfficers, useRealTimeCompliance } from '@/hooks/useRealTimeData';
import { officersService, complianceService } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  UserPlus, 
  Users, 
  Clock, 
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function ComplianceLogs() {
  const { officers, loading: officersLoading } = useRealTimeOfficers();
  const { logs, recentLogs, loading: logsLoading } = useRealTimeCompliance();
  const { toast } = useToast();

  // Add Officer Form State
  const [addOfficerForm, setAddOfficerForm] = useState({
    staff_id: '',
    staff_name: '',
    staff_designation: '',
    staff_nature_of_work: '',
  });

  const [isAddingOfficer, setIsAddingOfficer] = useState(false);

  // Add Compliance Log Form State
  const [addLogForm, setAddLogForm] = useState({
    officerId: '',
    action: '' as 'check-in' | 'check-out' | 'patrol-update' | 'geofence-violation' | 'incident-report',
    locationName: '',
    details: '',
  });

  const [isAddingLog, setIsAddingLog] = useState(false);

  // Handle Add Officer
  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addOfficerForm.staff_id || !addOfficerForm.staff_name || !addOfficerForm.staff_designation) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsAddingOfficer(true);
    try {
      await officersService.addOfficer(addOfficerForm);
      toast({
        title: "Officer added successfully",
        description: `${addOfficerForm.staff_name} has been added to the database`,
      });
      setAddOfficerForm({
        staff_id: '',
        staff_name: '',
        staff_designation: '',
        staff_nature_of_work: '',
      });
    } catch (error: any) {
      toast({
        title: "Failed to add officer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingOfficer(false);
    }
  };

  // Handle Add Compliance Log
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addLogForm.officerId || !addLogForm.action || !addLogForm.locationName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedOfficer = officers.find(o => o.id === addLogForm.officerId);
    if (!selectedOfficer) {
      toast({
        title: "Officer not found",
        description: "Please select a valid officer",
        variant: "destructive",
      });
      return;
    }

    setIsAddingLog(true);
    try {
      await complianceService.addComplianceLog({
        dutyId: 'manual-log', // For manual logs
        officerId: addLogForm.officerId,
        officerName: selectedOfficer.staff_name,
        action: addLogForm.action,
        location: {
          name: addLogForm.locationName,
          coordinates: [15.2993, 74.1240], // Default Goa coordinates
        },
        timestamp: new Date() as any, // Will be converted to Timestamp
        details: addLogForm.details,
      });
      
      toast({
        title: "Log added successfully",
        description: `Compliance log for ${selectedOfficer.staff_name} has been added`,
      });
      
      setAddLogForm({
        officerId: '',
        action: '' as any,
        locationName: '',
        details: '',
      });
    } catch (error: any) {
      toast({
        title: "Failed to add log",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingLog(false);
    }
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'check-in': return '✅';
      case 'check-out': return '🚪';
      case 'patrol-update': return '🚶‍♂️';
      case 'geofence-violation': return '⚠️';
      case 'incident-report': return '🚨';
      default: return '📝';
    }
  };

  // Get action variant
  const getActionVariant = (action: string) => {
    switch (action) {
      case 'geofence-violation':
      case 'incident-report':
        return 'destructive' as const;
      case 'check-in':
      case 'check-out':
        return 'default' as const;
      case 'patrol-update':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = typeof timestamp === 'object' && 'toDate' in timestamp
      ? timestamp.toDate()
      : new Date(timestamp);
    return date.toLocaleString('en-IN');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">User Management & Logs</h1>
      </div>

      <Tabs defaultValue="add-officer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add-officer">Add Officer</TabsTrigger>
          <TabsTrigger value="add-log">Add Log</TabsTrigger>
          <TabsTrigger value="view-logs">View Logs</TabsTrigger>
        </TabsList>

        {/* Add Officer Tab */}
        <TabsContent value="add-officer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Officer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddOfficer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff_id">Staff ID *</Label>
                    <Input
                      id="staff_id"
                      placeholder="e.g., P012349"
                      value={addOfficerForm.staff_id}
                      onChange={(e) => setAddOfficerForm(prev => ({ ...prev, staff_id: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff_name">Full Name *</Label>
                    <Input
                      id="staff_name"
                      placeholder="e.g., Officer John Doe"
                      value={addOfficerForm.staff_name}
                      onChange={(e) => setAddOfficerForm(prev => ({ ...prev, staff_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff_designation">Designation *</Label>
                    <Select
                      value={addOfficerForm.staff_designation}
                      onValueChange={(value) => setAddOfficerForm(prev => ({ ...prev, staff_designation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Constable">Constable</SelectItem>
                        <SelectItem value="Head Constable">Head Constable</SelectItem>
                        <SelectItem value="LPSI">LPSI</SelectItem>
                        <SelectItem value="Inspector">Inspector</SelectItem>
                        <SelectItem value="Sub Inspector">Sub Inspector</SelectItem>
                        <SelectItem value="Assistant Sub Inspector">Assistant Sub Inspector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff_nature_of_work">Work Status</Label>
                    <Select
                      value={addOfficerForm.staff_nature_of_work}
                      onValueChange={(value) => setAddOfficerForm(prev => ({ ...prev, staff_nature_of_work: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select work status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Presently on duty">Presently on duty</SelectItem>
                        <SelectItem value="Presently on S/L">Presently on S/L</SelectItem>
                        <SelectItem value="Presently absent">Presently absent</SelectItem>
                        <SelectItem value="Available for duty">Available for duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isAddingOfficer}
                >
                  {isAddingOfficer ? 'Adding Officer...' : 'Add Officer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Log Tab */}
        <TabsContent value="add-log" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Add Compliance Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="officer">Select Officer *</Label>
                    <Select
                      value={addLogForm.officerId}
                      onValueChange={(value) => setAddLogForm(prev => ({ ...prev, officerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an officer" />
                      </SelectTrigger>
                      <SelectContent>
                        {officers.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id!}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{officer.staff_id}</Badge>
                              <span>{officer.staff_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">Action Type *</Label>
                    <Select
                      value={addLogForm.action}
                      onValueChange={(value: any) => setAddLogForm(prev => ({ ...prev, action: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check-in">Check In</SelectItem>
                        <SelectItem value="check-out">Check Out</SelectItem>
                        <SelectItem value="patrol-update">Patrol Update</SelectItem>
                        <SelectItem value="geofence-violation">Geofence Violation</SelectItem>
                        <SelectItem value="incident-report">Incident Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationName">Location *</Label>
                  <Input
                    id="locationName"
                    placeholder="e.g., Panaji Market Square"
                    value={addLogForm.locationName}
                    onChange={(e) => setAddLogForm(prev => ({ ...prev, locationName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Details (Optional)</Label>
                  <Textarea
                    id="details"
                    placeholder="Additional information about this log entry..."
                    value={addLogForm.details}
                    onChange={(e) => setAddLogForm(prev => ({ ...prev, details: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isAddingLog}
                >
                  {isAddingLog ? 'Adding Log...' : 'Add Log Entry'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Logs Tab */}
        <TabsContent value="view-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                All Compliance Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No compliance logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Officer</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="font-medium">{log.officerName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getActionIcon(log.action)}</span>
                              <Badge variant={getActionVariant(log.action)}>
                                {log.action.replace('-', ' ')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {log.location.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.details || '-'}
                          </TableCell>
                          <TableCell>
                            {formatTime(log.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}