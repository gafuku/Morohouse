"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Search,
  Calendar,
  MapPin,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function OpportunitiesPage() {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOpps, setPendingOpps] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        // Fetch Approved
        const q = query(
          collection(db, "opportunities"),
          where("status", "==", "approved")
        );
        // For MVP without index, just fetch all and filter client side if list is small, or use simple query
        // The previous code fetched eveything. Let's stick to that for simplicity of "All" tab seeing everything for now?
        // User request: "pending opportunities approval move the to the opportunities page"

        const snapshot = await getDocs(collection(db, "opportunities"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        setOpportunities(
          items.filter((i) => i.status === "approved" || !i.status)
        ); // Default to approved or undefined (legacy)
        setPendingOpps(items.filter((i) => i.status === "pending"));
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  const handleApprove = async (id: string, status: "approved" | "rejected") => {
    try {
      // Dynamic import to avoid circular dep issues if any, or just direct use
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "opportunities", id), { status });

      // Update local state
      setPendingOpps((prev) => prev.filter((p) => p.id !== id));
      if (status === "approved") {
        const approvedItem = pendingOpps.find((p) => p.id === id);
        if (approvedItem) {
          setOpportunities((prev) => [
            ...prev,
            { ...approvedItem, status: "approved" },
          ]);
        }
      }
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || opp.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">
            Curated internships, fellowships, and jobs for our members.
          </p>
        </div>
        <div className="flex gap-2">
          {userData?.role === "admin" && (
            <Button asChild>
              <Link href="/opportunities/new">
                <Plus className="mr-2 h-4 w-4" /> Submit Opportunity
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="browse">Browse Opportunities</TabsTrigger>
          {/* Ideally only show if admin */}
          {userData?.role === "admin" && (
            <TabsTrigger value="approvals">
              Pending Approvals
              {pendingOpps.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 rounded-full">
                  {pendingOpps.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or organization..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Fellowship">Fellowship</SelectItem>
                  <SelectItem value="Job">Job</SelectItem>
                  <SelectItem value="Scholarship">Scholarship</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading opportunities...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOpportunities.map((opp) => (
                <Card key={opp.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="mb-2">
                        {opp.type}
                      </Badge>
                    </div>
                    <CardTitle className="leading-snug">{opp.title}</CardTitle>
                    <CardDescription className="font-semibold text-primary">
                      {opp.organization}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <MapPin className="h-3 w-3" />
                      {opp.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Calendar className="h-3 w-3" />
                      Deadline:{" "}
                      {opp.deadline
                        ? new Date(opp.deadline).toLocaleDateString()
                        : "Open"}
                    </div>
                    <p className="text-sm line-clamp-3">{opp.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {typeof opp.tags === "string" &&
                        opp.tags.split(",").map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button asChild className="flex-1" variant="outline">
                      <a href={opp.link} target="_blank" rel="noreferrer">
                        View Details <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    {user &&
                      (user.uid === opp.createdBy ||
                        userData?.role === "admin") && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Are you sure you want to delete this opportunity?"
                              )
                            )
                              return;
                            try {
                              const { doc, deleteDoc } = await import(
                                "firebase/firestore"
                              );
                              await deleteDoc(doc(db, "opportunities", opp.id));
                              setOpportunities((prev) =>
                                prev.filter((o) => o.id !== opp.id)
                              );
                              // Also remove from pending if it was there (though browse tab mainly acts on 'opportunities' state which acts as approved list usually, but let's be safe)
                              setPendingOpps((prev) =>
                                prev.filter((p) => p.id !== opp.id)
                              );
                            } catch (e) {
                              console.error("Error deleting", e);
                              alert("Failed to delete");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </CardFooter>
                </Card>
              ))}
              {filteredOpportunities.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No opportunities found matching your criteria.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review member submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOpps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending items.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{opp.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {opp.organization} • {opp.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted by: {opp.createdBy}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200"
                          onClick={() => handleApprove(opp.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200"
                          onClick={() => handleApprove(opp.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
