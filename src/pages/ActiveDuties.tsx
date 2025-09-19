import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealTimeDuties, useRealTimeOfficers } from '@/hooks/useRealTimeData';
import { dutiesService } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Search, 
  MapPin, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function ActiveDuties() {
  const { duties, loading: dutiesLoading } = useRealTimeDuties();
  const { officers } = useRealTimeOfficers();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter duties based on search and filters
  const filteredDuties = duties.filter(duty => {
    if (!duty) return false;
    
    const matchesSearch = (duty.officerUid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (duty.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (duty.comments || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || duty.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        minute: '2-digit'
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

  // Handle status update
  const handleStatusUpdate = async (dutyId: string, newStatus: string) => {
    try {
      await dutiesService.updateDuty(dutyId, { status: newStatus as any });
      toast({
        title: "Status updated",
        description: `Duty status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle delete duty
  const handleDeleteDuty = async (dutyId: string) => {
    if (!confirm('Are you sure you want to delete this duty assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await dutiesService.deleteDuty(dutyId);
      toast({
        title: "Duty deleted",
        description: "Duty assignment has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete duty",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Active Duties</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Duty Assignments Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duties Table */}
          {dutiesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading duties...</p>
            </div>
          ) : filteredDuties.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDuties.map((duty) => {
                    if (!duty || !duty.id) return null;
                    
                    const officer = getOfficerDetails(duty.officerUid);
                    return (
                      <TableRow key={duty.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{officer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {officer.designation} • {officer.staffId}
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={duty.status || 'incomplete'}
                              onValueChange={(value) => handleStatusUpdate(duty.id!, value)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="incomplete">Incomplete</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDuty(duty.id!)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}