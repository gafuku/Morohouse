"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { FileText, Download, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ResourcesPage() {
  const { user, userData } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [newResource, setNewResource] = useState({
    title: "",
    type: "PDF",
    url: "",
    size: "1 MB",
    tags: "",
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      try {
        const snapshot = await getDocs(collection(db, "resources"));
        setResources(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, []);

  // Categories
  const CATEGORIES = [
    "Governance & Organizational",
    "Chapter Development",
    "Membership Experience",
    "Career Readiness",
    "Other",
  ];

  // Extract all unique tags
  // const allTags = ... // Removed tag-based navigation for Category-based navigation as per request

  const handleAddResource = async () => {
    try {
      await addDoc(collection(db, "resources"), {
        ...newResource,
        uploadedBy: user?.uid,
        date: new Date().toLocaleDateString(),
      });
      toast.success("Resource added!");
      setOpen(false);
      window.location.reload();
    } catch (e) {
      toast.error("Failed to add resource");
    }
  };

  const filteredResources = resources.filter((r) => {
    // 1. Filter by Category (Active Tab)
    if (activeTab !== "All" && r.category !== activeTab) return false;

    // 2. Access Control: Chapter Development is restricted
    if (r.category === "Chapter Development") {
      const role = userData?.role;
      if (role !== "admin" && role !== "moderator") return false;
    }

    return true;
  });

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Resource Library
          </h1>
          <p className="text-muted-foreground">
            Official documents, guides, and templates for BYEN members and
            leaders.
          </p>
        </div>

        {/* Admin check for add button */}
        {userData?.role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Add a link or file reference to the library.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={newResource.title}
                    onChange={(e) =>
                      setNewResource({ ...newResource, title: e.target.value })
                    }
                    placeholder="e.g. Chapter Bylaws 2025"
                  />
                </div>
                {/* Category Selection */}
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    onValueChange={(v) =>
                      setNewResource({ ...newResource, category: v } as any)
                    }
                    defaultValue="Other"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Link / URL</Label>
                  <Input
                    value={newResource.url}
                    onChange={(e) =>
                      setNewResource({ ...newResource, url: e.target.value })
                    }
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>File Type</Label>
                  <Select
                    onValueChange={(v) =>
                      setNewResource({ ...newResource, type: v })
                    }
                    defaultValue="PDF"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="DOCX">Word Doc</SelectItem>
                      <SelectItem value="XLSX">Excel</SelectItem>
                      <SelectItem value="ZIP">Zip Archive</SelectItem>
                      <SelectItem value="LINK">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={newResource.tags || ""}
                    onChange={(e) =>
                      setNewResource({ ...newResource, tags: e.target.value })
                    }
                    placeholder="e.g. Finance, Bylaws, 2025"
                  />
                </div>
              </div>
              <Button onClick={handleAddResource}>Save Resource</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "All" ? "default" : "outline"}
            onClick={() => setActiveTab("All")}
            className="rounded-full"
          >
            All Resources
          </Button>
          {CATEGORIES.map((cat) => {
            // Hide restricted category tab if user doesn't have access?
            // Or show it but show empty? Better to hide or disable.
            if (cat === "Chapter Development") {
              const role = userData?.role;
              if (role !== "admin" && role !== "moderator") return null;
            }
            return (
              <Button
                key={cat}
                variant={activeTab === cat ? "default" : "outline"}
                onClick={() => setActiveTab(cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <FileText className="h-8 w-8 text-primary/80" />
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {item.type}
                  </div>
                </div>
                <CardTitle className="mt-3 text-lg">{item.title}</CardTitle>
                <CardDescription>
                  {item.size} • Updated {item.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags &&
                    item.tags?.split?.(",").map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 gap-2">
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" /> Download / View
                  </a>
                </Button>
                {user &&
                  (user.uid === item.uploadedBy ||
                    userData?.role === "admin") && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={async () => {
                        if (
                          !confirm(
                            "Are you sure you want to delete this resource?"
                          )
                        )
                          return;
                        try {
                          const { doc, deleteDoc } = await import(
                            "firebase/firestore"
                          );
                          await deleteDoc(doc(db, "resources", item.id));
                          setResources((prev) =>
                            prev.filter((r) => r.id !== item.id)
                          );
                          toast.success("Resource deleted");
                        } catch (e) {
                          console.error("Error deleting", e);
                          toast.error("Failed to delete");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </CardFooter>
            </Card>
          ))}
          {filteredResources.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
              No resources found for this tag.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
