"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // Assuming toast is available or add import if needed, though this file uses it? No, wait, checking imports... using console.error now. Let's stick to existing pattern or add toast if better.

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");

  const [interestFilter, setInterestFilter] = useState("all");
  const [affiliationFilter, setAffiliationFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        // Fetch only Active members to comply with Security Rules for non-admins
        // Admins can see all, but for the public directory, 'Active' is the correct filter anyway.
        const usersQuery = query(
          collection(db, "users"),
          where("membershipStatus", "==", "Active")
        );
        const usersSnap = await getDocs(usersQuery);
        const chaptersSnap = await getDocs(collection(db, "chapters"));
        console.log(usersSnap);

        setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setChapters(
          chaptersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error?.code === "permission-denied") {
          // Fallback or alert if rules are still strict
        }
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  // Extract unique values for filters
  const uniqueInterests = Array.from(
    new Set(
      users.flatMap((u) =>
        u.interests ? u.interests.split(",").map((s: string) => s.trim()) : []
      )
    )
  ).sort();

  const uniqueAffiliations = Array.from(
    new Set(
      users.flatMap((u) =>
        u.affiliations
          ? u.affiliations.split(",").map((s: string) => s.trim())
          : []
      )
    )
  ).sort();

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.interests?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.affiliations?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMembership =
      membershipFilter === "all" || u.membershipType === membershipFilter;
    const matchesChapter =
      chapterFilter === "all" || u.chapterId === chapterFilter;

    // Tag Filters
    const matchesInterest =
      interestFilter === "all" ||
      (u.interests &&
        u.interests.toLowerCase().includes(interestFilter.toLowerCase()));

    const matchesAffiliation =
      affiliationFilter === "all" ||
      (u.affiliations &&
        u.affiliations.toLowerCase().includes(affiliationFilter.toLowerCase()));

    // Only show Active members in public directory
    const isActive = u.membershipStatus === "Active";

    return (
      matchesSearch &&
      matchesMembership &&
      matchesChapter &&
      matchesInterest &&
      matchesAffiliation &&
      isActive
    );
  });

  if (authLoading) return null;

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Member Directory
          </h1>
          <p className="text-muted-foreground">
            Connect with other members of the network.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or info..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Select value={membershipFilter} onValueChange={setMembershipFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Membership Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Individual Member">Individual</SelectItem>
            <SelectItem value="Chapter Member">Chapter Member</SelectItem>
            <SelectItem value="Fellow">Fellow</SelectItem>
            <SelectItem value="Alumni">Alumni</SelectItem>
          </SelectContent>
        </Select>

        <Select value={chapterFilter} onValueChange={setChapterFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Chapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {chapters.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {chapter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={interestFilter} onValueChange={setInterestFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Interest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Interests</SelectItem>
            {uniqueInterests.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={affiliationFilter} onValueChange={setAffiliationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Affiliation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Affiliations</SelectItem>
            {uniqueAffiliations.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-md min-w-[75px]">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-l-md"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none rounded-r-md"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} filtered results
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading members...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No members found matching your filters.
            </div>
          ) : viewMode === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role / Type</TableHead>
                  <TableHead>School / Chapter</TableHead>
                  <TableHead>Interests</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-3 font-medium">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.fullName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {user.fullName}
                        <div className="text-xs text-muted-foreground md:hidden">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.membershipType}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.role || "Member"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {chapters.find((c) => c.id === user.chapterId)?.name}
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate"
                      title={user.interests}
                    >
                      AS
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/profile/${user.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 flex flex-col items-center text-center bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarFallback className="text-lg">
                      {user.fullName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold truncate w-full">
                    {user.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate w-full mb-2">
                    {user.email}
                  </p>

                  <div className="w-full space-y-1 mb-3">
                    <div className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded inline-block">
                      {chapters.find((c) => c.id === user.chapterId)?.name}
                    </div>
                  </div>

                  <div className="mt-auto w-full pt-2 border-t flex flex-col gap-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {user.membershipType}
                    </span>
                    <span className="italic truncate" title={user.interests}>
                      {user.interests || "No interests listed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
