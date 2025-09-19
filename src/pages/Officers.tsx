import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealTimeDuties } from '@/hooks/useRealTimeData';
import { useRealTimeOfficers } from '@/hooks/useRealTimeData';
import { officersService, dutiesService } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Clock, 
  Search, 
  User,
  Trash2,
  Edit
} from 'lucide-react';

export default function Officers() {
  // Add error boundary for the entire component
  try {
    const { duties = [], loading: dutiesLoading, error: dutiesError } = useRealTimeDuties();
    const { officers = [], loading: officersLoading, error: officersError } = useRealTimeOfficers();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('History & Officers - Duties:', duties.length, duties);
      console.log('History & Officers - Officers:', officers.length, officers);
      console.log('History & Officers - Errors:', { dutiesError, officersError });
    }

  // Get officer name by UID
  const getOfficerName = (officerUid: string) => {
    if (!officerUid || !officers) return 'Unknown Officer';
    const officer = officers.find(o => o && o.id === officerUid);
    return officer ? (officer.staff_name || 'Unknown Officer') : 'Unknown Officer';
  };

  // Get officer details by UID
  const getOfficerDetails = (officerUid: string) => {
    if (!officerUid || !officers) {
      return {
        name: 'Unknown Officer',
        designation: 'Unknown',
        staffId: 'Unknown'
      };
    }
    
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

  // Test function to add a duty
  const testAddDuty = async () => {
    if (officers.length === 0) {
      toast({
        title: "No officers available",
        description: "Please add officers first",
        variant: "destructive",
      });
      return;
    }

    try {
      const testDuty = {
        officerUid: officers[0].id!,
        type: 'patrol' as const,
        location: {
          polygon: [
            { lat: 15.2993, lng: 74.1240 },
            { lat: 15.3003, lng: 74.1250 },
            { lat: 15.3013, lng: 74.1260 },
            { lat: 15.3023, lng: 74.1270 }
          ]
        },
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        status: 'incomplete' as const,
        assignedAt: new Date().toISOString(),
        comments: 'Test duty for debugging',
      };

      const dutyId = await dutiesService.addDuty(testDuty);
      console.log('Test duty created with ID:', dutyId);
      
      toast({
        title: "Test duty created",
        description: `Test duty created with ID: ${dutyId}`,
      });
    } catch (error: any) {
      console.error('Test duty creation failed:', error);
      toast({
        title: "Test duty creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle delete officer
  const handleDeleteOfficer = async (officerId: string, officerName: string) => {
    if (!confirm(`Are you sure you want to delete ${officerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await officersService.deleteOfficer(officerId);
      toast({
        title: "Officer deleted",
        description: `${officerName} has been removed from the database`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete officer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter duties based on search and filters
  const filteredDuties = duties.filter(duty => {
    if (!duty) return false;
    
    // Get officer name for search
    const officerName = getOfficerName(duty.officerUid || '');
    
    const matchesSearch = (duty.officerUid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (duty.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (duty.comments || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         officerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || duty.status === statusFilter;
    const matchesType = typeFilter === 'all' || duty.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No Date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'complete':
        return 'default';
      case 'incomplete':
        return 'destructive';
      case 'assigned':
        return 'secondary';
      case 'active':
        return 'default';
      default:
        return 'outline';
    }
  };

  // Show error state if there are critical errors
  if (dutiesError || officersError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">History & Officers</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-4">
                {dutiesError && `Duties Error: ${dutiesError}`}
                {officersError && `Officers Error: ${officersError}`}
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">History & Officers</h1>
      </div>

      <Tabs defaultValue="duties" className="space-y-6">
        <TabsList>
          <TabsTrigger value="duties">Duty History</TabsTrigger>
          <TabsTrigger value="officers">Officers</TabsTrigger>
        </TabsList>

        {/* Duty History Tab */}
        <TabsContent value="duties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Duty Assignment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button onClick={testAddDuty} variant="outline" size="sm" className="w-full sm:w-auto">
                  Test Add Duty
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by officer, type, or comments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="naka">Naka</SelectItem>
                    <SelectItem value="patrol">Patrol</SelectItem>
                  </SelectContent>
                </Select>
      </div>

              {/* Duty History Table */}
              {dutiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading duty history...</p>
                </div>
              ) : filteredDuties.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No duty assignments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Officer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Assigned At</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDuties.map((duty, index) => {
                        try {
                          if (!duty || !duty.id) return null;
                          
                          const officer = getOfficerDetails(duty.officerUid || '');
                          return (
                            <TableRow key={duty.id || `duty-${index}`}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{officer.name || 'Unknown Officer'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {officer.designation || 'Unknown'} • {officer.staffId || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {duty.type || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(duty.status || 'unknown')}>
                                  {duty.status || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(duty.startTime || '')}</TableCell>
                              <TableCell>{formatDate(duty.endTime || '')}</TableCell>
                              <TableCell>{formatDate(duty.assignedAt || '')}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {duty.comments || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        } catch (error) {
                          console.error('Error rendering duty row:', error, duty);
                          return null;
                        }
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Officers Tab */}
        <TabsContent value="officers" className="space-y-6">
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Officer Directory
              </CardTitle>
        </CardHeader>
        <CardContent>
              {officersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading officers...</p>
                </div>
              ) : officers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No officers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {officers.map((officer, index) => {
                    try {
                      if (!officer || !officer.id) return null;
                      
                      return (
                        <Card key={officer.id || `officer-${index}`} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <h3 className="font-semibold">{officer.staff_name || 'Unknown Officer'}</h3>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">ID:</span> {officer.staff_id || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Designation:</span> {officer.staff_designation || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Status:</span> {officer.staff_nature_of_work || 'Unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={(officer.staff_nature_of_work || '').toLowerCase().includes('duty') ? 'default' : 'secondary'}
                              >
                                {(officer.staff_nature_of_work || '').includes('S/L') ? 'On Leave' : 'Available'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOfficer(officer.id!, officer.staff_name || 'Unknown Officer')}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    } catch (error) {
                      console.error('Error rendering officer card:', error, officer);
                      return null;
                    }
                  })}
                </div>
              )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
  } catch (error) {
    console.error('History & Officers component error:', error);
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">History & Officers</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Component Error</h3>
              <p className="text-muted-foreground mb-4">
                An error occurred while loading the History & Officers page. Please check the console for details.
              </p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}