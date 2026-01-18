"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AdminMetadata } from "@/components/admin/admin_metadata";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [chapters, setChapters] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Access Control State
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "moderator" | null>(null);
  const [userChapterId, setUserChapterId] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // RBAC Check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const checkRole = async () => {
          try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
              const userData = docSnap.data();
              if (userData.role === "admin" || userData.role === "moderator") {
                setHasAccess(true);
                setUserRole(userData.role);
                setUserChapterId(userData.chapterId);
              } else {
                router.push("/");
              }
            } else {
              router.push("/");
            }
          } catch (error) {
            console.error("Error checking role:", error);
            router.push("/");
          } finally {
            setCheckingRole(false);
          }
        };
        checkRole();
      }
    }
  }, [user, authLoading, router]);

  // Fetch Data (based on role)
  useEffect(() => {
    if (!hasAccess || !userRole) return;

    async function fetchData() {
      try {
        const [usersSnap, oppsSnap, chaptersSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "opportunities")),
          getDocs(collection(db, "chapters")),
        ]);

        let allUsers = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        let allChapters = chaptersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        let allOpps = oppsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (userRole === "moderator") {
          // Filter users for this chapter only
          allUsers = allUsers.filter((u: any) => u.chapterId === userChapterId);
          // Moderators might need to see their own chapter info
          // allChapters can stay or filter, keeping all for reference might be ok, or filter.
          // Let's filter chapters to only their own to avoid confusion in dropdowns
          allChapters = allChapters.filter((c: any) => c.id === userChapterId);
        }

        setUsers(allUsers);
        setOpportunities(allOpps); // Moderators won't see the tab, but fetching is fine
        setChapters(allChapters);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [hasAccess, userRole, userChapterId]);

  const handleStatusChange = async (
    oppId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      await updateDoc(doc(db, "opportunities", oppId), { status: newStatus });
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        chapterId: editingUser.chapterId || null,
        membershipStatus: editingUser.membershipStatus || "Pending",
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? editingUser : u))
      );
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (u: any) =>
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.school?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOpportunities = opportunities.filter(
    (o) => o.status === "pending"
  );
  // Include both new member signups (Membership Status = Pending) AND existing members requesting chapter transfer
  const pendingMembers = users.filter(
    (u) =>
      u.membershipStatus === "Pending" || u.chapterApprovalStatus === "pending"
  );

  const handleMemberApproval = async (
    userId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const updates: any = {};

      if (action === "approve") {
        // Approve everything pending
        if (user.membershipStatus === "Pending")
          updates.membershipStatus = "Active";
        if (user.chapterApprovalStatus === "pending")
          updates.chapterApprovalStatus = "approved";
      } else {
        // Reject
        if (user.membershipStatus === "Pending")
          updates.membershipStatus = "Rejected";
        if (user.chapterApprovalStatus === "pending")
          updates.chapterApprovalStatus = "rejected";
      }

      await updateDoc(doc(db, "users", userId), updates);

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
      toast.success(`Member request ${action}d`);
    } catch (e) {
      console.error("Failed to update status", e);
      toast.error("Failed to update status");
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) return null; // Should have redirected

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userRole === "admin" ? "Admin Portal" : "Chapter Management"}
          </h1>
          <p className="text-muted-foreground">
            {userRole === "admin"
              ? "Manage members, content, and approvals."
              : "Manage members within your chapter."}
          </p>
        </div>
        {userRole === "admin" && (
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin/chapters")}
              variant="outline"
            >
              Manage Chapters
            </Button>
            <Button
              onClick={() => router.push("/opportunities/new")}
              variant="outline"
            >
              New Opportunity
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="member-approvals">
            Member Approvals
            {pendingMembers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 rounded-full">
                {pendingMembers.length}
              </span>
            )}
          </TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="approvals">
              Opportunity Approvals
              {pendingOpportunities.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 rounded-full">
                  {pendingOpportunities.length}
                </span>
              )}
            </TabsTrigger>
          )}
          {userRole === "admin" && (
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Member Database</CardTitle>
                  <CardDescription>
                    Total Members: {users.length}
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading members...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>School / Chapter</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback>
                                {user.fullName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.fullName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {chapters.find((c) => c.id === user.chapterId)
                            ?.name || user.school}
                        </TableCell>
                        <TableCell className="capitalize">
                          {user.role}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.membershipStatus === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.membershipStatus || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.joinDate
                            ? new Date(user.joinDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="member-approvals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Member & Chapter Requests</CardTitle>
              <CardDescription>
                Review new members and chapter join requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMembers.map((req) => {
                      const isNewMember = req.membershipStatus === "Pending";
                      const isChapterRequest =
                        req.chapterApprovalStatus === "pending";
                      const requestedChapter = chapters.find(
                        (c) => c.id === req.chapterId
                      );

                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={req.photoURL} />
                                <AvatarFallback>
                                  {req.fullName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {req.fullName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isNewMember && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-700 border-yellow-200 mr-2"
                              >
                                New Membership
                              </Badge>
                            )}
                            {isChapterRequest && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Chapter Access
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {requestedChapter
                              ? requestedChapter.name
                              : req.school || "N/A"}
                          </TableCell>
                          <TableCell>
                            {req.joinDate
                              ? new Date(req.joinDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50 border-green-200"
                                onClick={() =>
                                  handleMemberApproval(req.id, "approve")
                                }
                              >
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() =>
                                  handleMemberApproval(req.id, "reject")
                                }
                              >
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Opportunities</CardTitle>
              <CardDescription>
                Review submissions from members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOpportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending items.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOpportunities.map((opp) => (
                      <TableRow key={opp.id}>
                        <TableCell className="font-medium">
                          {opp.title}
                        </TableCell>
                        <TableCell>{opp.organization}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {opp.createdBy}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50 border-green-200"
                              onClick={() =>
                                handleStatusChange(opp.id, "approved")
                              }
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() =>
                                handleStatusChange(opp.id, "rejected")
                              }
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="mt-6">
          <AdminMetadata />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update chapter assignment and membership status for{" "}
              {editingUser?.fullName}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Select
                value={editingUser?.chapterId || "unassigned"}
                onValueChange={(val) =>
                  setEditingUser({
                    ...editingUser,
                    chapterId: val === "unassigned" ? "" : val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Membership Status</Label>
              <Select
                value={editingUser?.membershipStatus || "Pending"}
                onValueChange={(val) =>
                  setEditingUser({ ...editingUser, membershipStatus: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
