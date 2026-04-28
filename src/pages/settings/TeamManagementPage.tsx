import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/api/team';
 import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, UserPlus, Trash2, Shield, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

export default function TeamManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamApi.list().then(res => res.data),
  });

  const inviteMutation = useMutation({
    mutationFn: () => teamApi.add({ email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setIsInviteOpen(false);
      setInviteEmail('');
      toast.success('Member added successfully');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error('Invitation failed', {
        description: err.response?.data?.message || 'The user must already have a Veridex account to be added.'
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => teamApi.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Role updated');
    }
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => teamApi.remove(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member removed');
    }
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">Manage your organization's members and their access levels.</p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite an existing Veridex user to your organization by their email address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="teammate@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-muted/20 shadow-md shadow-primary/5 bg-card/60 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-lg">Active Members</CardTitle>
                    <CardDescription>A total of {membersResponse?.data?.length || 0} users have access.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-muted/50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersResponse?.data?.map((member, index) => (
                  <TableRow key={member.id} className="border-muted/30 group transition-colors hover:bg-muted/30">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/20">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm leading-none">{member.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <Mail className="w-2 h-2" /> {member.email}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            {member.role === 'owner' ? (
                                <Badge variant="default" className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">
                                    <Shield className="w-3 h-3 mr-1" /> Owner
                                </Badge>
                            ) : (
                                <Select 
                                    defaultValue={member.role} 
                                    onValueChange={(val) => updateRoleMutation.mutate({ userId: member.id, role: val })}
                                    disabled={currentUser?.id === member.id}
                                >
                                    <SelectTrigger className="w-32 h-8 text-xs border-transparent bg-transparent hover:bg-background/80 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                            {format(new Date(member.joined_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                           {member.id !== currentUser?.id && member.role !== 'owner' && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        if (confirm(`Remove ${member.name} from the organization?`)) {
                                            removeMutation.mutate(member.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           )}
                        </TableCell>
                    </TableRow>
                ))}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
