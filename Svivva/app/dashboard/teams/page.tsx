"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Crown, Shield, Eye, User, UserPlus, Trash2, Settings } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
  role: string;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  username: string;
  email: string;
  profileImage: string | null;
}

interface TeamDetails extends Team {
  owner: {
    id: string;
    username: string;
    email: string;
    profileImage: string | null;
  };
  members: TeamMember[];
  userRole: string;
}

function getRoleIcon(role: string) {
  switch (role) {
    case "owner":
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case "admin":
      return <Shield className="h-4 w-4 text-blue-500" />;
    case "viewer":
      return <Eye className="h-4 w-4 text-gray-500" />;
    default:
      return <User className="h-4 w-4 text-green-500" />;
  }
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "owner":
      return "default";
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
}

export default function TeamsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const { data: teamDetails, isLoading: detailsLoading } = useQuery<TeamDetails>({
    queryKey: ["/api/teams", selectedTeam],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team details");
      return res.json();
    },
    enabled: !!selectedTeam,
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newTeamName, description: newTeamDescription }),
      });
      if (!res.ok) throw new Error("Failed to create team");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateOpen(false);
      setNewTeamName("");
      setNewTeamDescription("");
      toast({ title: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create team", variant: "destructive" });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeam}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to invite member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam] });
      setInviteEmail("");
      setInviteRole("member");
      toast({ title: "Member invited successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/teams/${selectedTeam}/members?memberId=${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam] });
      toast({ title: "Member removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove member", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-teams-title">
            Teams
          </h1>
          <p className="text-muted-foreground">Collaborate with your team members</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-team">
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new team</DialogTitle>
              <DialogDescription>
                Teams let you collaborate on projects with other users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team name</Label>
                <Input
                  id="name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="My Awesome Team"
                  data-testid="input-team-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="What is this team for?"
                  data-testid="input-team-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createTeamMutation.mutate()}
                disabled={!newTeamName || createTeamMutation.isPending}
                data-testid="button-submit-create-team"
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Your Teams</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !teams?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No teams yet</p>
                <p className="text-sm text-muted-foreground">Create a team to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-colors hover-elevate ${
                    selectedTeam === team.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedTeam(team.id)}
                  data-testid={`card-team-${team.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={team.avatarUrl || undefined} />
                          <AvatarFallback>{team.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{team.name}</h3>
                          <p className="text-xs text-muted-foreground">/{team.slug}</p>
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(team.role)}>
                        {getRoleIcon(team.role)}
                        <span className="ml-1 capitalize">{team.role}</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selectedTeam ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a team</h3>
                <p className="text-muted-foreground">
                  Choose a team from the list to view details and manage members
                </p>
              </CardContent>
            </Card>
          ) : detailsLoading ? (
            <Card>
              <CardContent className="py-12">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-8" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : teamDetails ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={teamDetails.avatarUrl || undefined} />
                      <AvatarFallback>{teamDetails.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{teamDetails.name}</CardTitle>
                      <CardDescription>
                        {teamDetails.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                  {teamDetails.userRole === "owner" && (
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Owner</h3>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={teamDetails.owner.profileImage || undefined} />
                      <AvatarFallback>
                        {teamDetails.owner.username?.charAt(0).toUpperCase() || "O"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {teamDetails.owner.username || teamDetails.owner.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{teamDetails.owner.email}</p>
                    </div>
                    <Badge>
                      <Crown className="h-3 w-3 mr-1" />
                      Owner
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Members ({teamDetails.members.length})</h3>
                  </div>

                  {(teamDetails.userRole === "owner" || teamDetails.userRole === "admin") && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        data-testid="input-invite-email"
                      />
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-32" data-testid="select-invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => inviteMemberMutation.mutate()}
                        disabled={!inviteEmail || inviteMemberMutation.isPending}
                        data-testid="button-invite-member"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </div>
                  )}

                  {teamDetails.members.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No members yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamDetails.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                          data-testid={`row-member-${member.id}`}
                        >
                          <Avatar>
                            <AvatarImage src={member.profileImage || undefined} />
                            <AvatarFallback>
                              {member.username?.charAt(0).toUpperCase() || "M"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{member.username || member.email}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                          {teamDetails.userRole === "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
