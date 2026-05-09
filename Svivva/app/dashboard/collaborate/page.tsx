"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth, authFetch } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserPlus,
  MessageSquare,
  Send,
  Circle,
  Clock,
  FolderOpen,
  Trash2,
  AtSign,
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  online?: boolean;
  lastActive?: string;
}

interface TeamWithMembers {
  members?: TeamMember[];
}

interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  projectName?: string;
}

const COLLAB_COMMENTS_KEY = "svivva_collab_comments";
const COLLAB_INVITES_KEY = "svivva_collab_invites";

function loadComments(): Comment[] {
  try { return JSON.parse(localStorage.getItem(COLLAB_COMMENTS_KEY) || "[]"); } catch { return []; }
}

function saveComments(comments: Comment[]) {
  localStorage.setItem(COLLAB_COMMENTS_KEY, JSON.stringify(comments.slice(0, 100)));
}

function loadInvites(): string[] {
  try { return JSON.parse(localStorage.getItem(COLLAB_INVITES_KEY) || "[]"); } catch { return []; }
}

function saveInvites(invites: string[]) {
  localStorage.setItem(COLLAB_INVITES_KEY, JSON.stringify(invites.slice(0, 50)));
}

export default function CollaboratePage() {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<"team" | "activity" | "comments">("team");

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const r = await authFetch("/api/teams");
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : data?.teams || [];
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const r = await authFetch("/api/projects");
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : data?.projects || [];
    },
  });

  useEffect(() => {
    setComments(loadComments());
    setPendingInvites(loadInvites());
  }, []);

  const teams = useMemo(() => teamsData ?? [], [teamsData]);
  const projects = useMemo(() => projectsData ?? [], [projectsData]);

  const uniqueMembers: TeamMember[] = useMemo(() => {
    const all: TeamMember[] = teams.flatMap((t: TeamWithMembers) =>
      (t.members || []).map((m: TeamMember) => ({ ...m }))
    );
    if (user) {
      all.unshift({
        id: "self",
        email: user.email || "",
        name: user.firstName || user.email || "You",
        avatarUrl: user.profileImageUrl || undefined,
        role: "owner",
        online: true,
        lastActive: new Date().toISOString(),
      });
    }
    return all.filter((m, i, arr) => arr.findIndex(x => x.email === m.email) === i);
  }, [teams, user]);

  const handleInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (pendingInvites.includes(email)) return;
    const updated = [email, ...pendingInvites];
    setPendingInvites(updated);
    saveInvites(updated);
    setInviteEmail("");
  };

  const handleRemoveInvite = (email: string) => {
    const updated = pendingInvites.filter(e => e !== email);
    setPendingInvites(updated);
    saveInvites(updated);
  };

  const handlePostComment = () => {
    const text = commentText.trim();
    if (!text) return;
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author: user?.firstName || user?.email || "You",
      authorAvatar: user?.profileImageUrl || undefined,
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    saveComments(updated);
    setCommentText("");
  };

  const handleDeleteComment = (id: string) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    saveComments(updated);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-collab-title">Real-Time Collaboration</h1>
          <p className="text-sm text-muted-foreground mt-1">Work together with your team in one place</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border/30 pb-0">
        {(["team", "activity", "comments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? "border-[#5BA8A0] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab}`}
          >
            {tab === "team" && <Users className="w-4 h-4 inline mr-1.5" />}
            {tab === "activity" && <Clock className="w-4 h-4 inline mr-1.5" />}
            {tab === "comments" && <MessageSquare className="w-4 h-4 inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "team" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#5BA8A0]" />
                Invite Team Members
              </CardTitle>
              <CardDescription>Add people by email to collaborate on your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                  className="flex-1"
                  data-testid="input-invite-email"
                />
                <Button onClick={handleInvite} className="gap-2 shrink-0" style={{ background: "#5BA8A0" }} data-testid="button-send-invite">
                  <Send className="w-4 h-4" /> Invite
                </Button>
              </div>
              {pendingInvites.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending Invites</p>
                  {pendingInvites.map((email) => (
                    <div key={email} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-sm">
                      <span className="flex items-center gap-2"><AtSign className="w-3 h-3 text-muted-foreground" />{email}</span>
                      <button onClick={() => handleRemoveInvite(email)} className="text-muted-foreground hover:text-red-400" data-testid={`button-remove-invite-${email}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest mb-3">Team Members</h3>
            {teamsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : uniqueMembers.length === 0 ? (
              <Card className="border-dashed border-border/30">
                <CardContent className="py-8 text-center">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No team members yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Invite someone to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {uniqueMembers.map((member) => (
                  <Card key={member.id} className="border-border/30">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>{member.name?.[0] || member.email?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <Circle className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 ${member.online ? "fill-green-500 text-green-500" : "fill-muted-foreground/30 text-muted-foreground/30"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name || member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.online ? "Online now" : member.lastActive ? `Active ${timeAgo(member.lastActive)}` : "Offline"}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">{member.role}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5BA8A0]" />
                Shared Projects
              </CardTitle>
              <CardDescription>Projects your team is working on</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No shared projects yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 10).map((p: { id: string; name: string; status?: string; description?: string }) => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-[#5BA8A0]/10 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-4 h-4 text-[#5BA8A0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.description || "No description"}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">{p.status || "active"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uniqueMembers.length > 0 ? uniqueMembers.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <Avatar className="h-6 w-6 mt-0.5">
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback className="text-[10px]">{m.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p><span className="font-medium">{m.name || m.email}</span> {["updated a project", "added a comment", "created a new API", "ran an experiment", "generated a blueprint"][i % 5]}</p>
                      <p className="text-muted-foreground">{m.lastActive ? timeAgo(m.lastActive) : "recently"}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity. Invite team members to see activity here.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Share an update, ask a question, or leave feedback..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    data-testid="textarea-comment"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handlePostComment} disabled={!commentText.trim()} className="gap-1.5 text-xs" style={{ background: "#5BA8A0" }} data-testid="button-post-comment">
                      <Send className="w-3.5 h-3.5" /> Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {comments.length === 0 ? (
              <Card className="border-dashed border-border/30">
                <CardContent className="py-8 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start a conversation with your team</p>
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="border-border/30">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                        <AvatarImage src={comment.authorAvatar} />
                        <AvatarFallback className="text-[10px]">{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{comment.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                            <button onClick={() => handleDeleteComment(comment.id)} className="text-muted-foreground/30 hover:text-red-400 transition-colors" data-testid={`button-delete-comment-${comment.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
