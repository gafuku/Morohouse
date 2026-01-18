"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List, Building2, MapPin } from "lucide-react";

export default function ChaptersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid"); // Default to grid for chapters

  useEffect(() => {
    // Optional: Protect this route or leave public. Assuming public but maybe requires login?
    // User requested "navbar to have the chapert too", assuming likely for logged in users.
    if (!authLoading && !user) {
      // router.push("/login"); // Uncomment to enforce login
      // return;
    }

    async function fetchData() {
      try {
        const chaptersSnap = await getDocs(collection(db, "chapters"));
        setChapters(
          chaptersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error fetching chapters:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, router]);

  const filteredChapters = chapters.filter((c: any) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    return (
      c.name?.toLowerCase().includes(term) ||
      c.institution?.toLowerCase().includes(term) ||
      c.location?.toLowerCase().includes(term)
    );
  });

  if (authLoading) return null;

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Access Network Chapters
          </h1>
          <p className="text-muted-foreground">
            Find and connect with chapters in your region.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chapters by name, school, or location..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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
            <CardTitle>Chapters</CardTitle>
            <CardDescription>
              Showing {filteredChapters.length} results
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading chapters...</div>
          ) : filteredChapters.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No chapters found matching your search.
            </div>
          ) : viewMode === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chapter Name</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>President</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChapters.map((chapter: any) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {chapter.name}
                      </div>
                    </TableCell>
                    <TableCell>{chapter.institution}</TableCell>
                    <TableCell>{chapter.location || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{chapter.presidentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {chapter.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/chapters/${chapter.id}`)}
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
              {filteredChapters.map((chapter: any) => (
                <div
                  key={chapter.id}
                  className="border rounded-lg p-5 flex flex-col bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/chapters/${chapter.id}`)}
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4 mx-auto text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <h3 className="font-semibold text-center mb-1">
                    {chapter.name}
                  </h3>
                  <p className="text-xs text-center text-muted-foreground mb-4">
                    {chapter.institution}
                  </p>

                  <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 justify-center">
                      <MapPin className="h-3 w-3" />
                      {chapter.location || "N/A"}
                    </div>
                  </div>

                  <Button variant="secondary" className="w-full mt-4 h-8">
                    View Chapter
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
