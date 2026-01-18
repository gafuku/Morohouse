"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chapterSchema, ChapterFormValues } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";

export default function AdminChaptersPage() {
  const { user } = useAuth(); // In real app, check if user.role === 'admin'
  const router = useRouter();
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: "",
      institution: "",
      presidentName: "",
      presidentEmail: "",
      email: "",
      location: "",
      status: "Active",
    },
  });

  useEffect(() => {
    // Basic role check (mock)
    // if (user && user.role !== 'admin') router.push('/dashboard');

    fetchChapters();
  }, [user]);

  async function fetchChapters() {
    try {
      const snap = await getDocs(collection(db, "chapters"));
      setChapters(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch chapters");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: ChapterFormValues) => {
    try {
      if (editingChapter) {
        await updateDoc(doc(db, "chapters", editingChapter.id), data);
        toast.success("Chapter updated");
      } else {
        await addDoc(collection(db, "chapters"), {
          ...data,
          createdAt: new Date().toISOString(),
        });
        toast.success("Chapter created");
      }
      setOpen(false);
      setEditingChapter(null);
      form.reset();
      fetchChapters();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save chapter");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "chapters", id));
      toast.success("Chapter deleted");
      fetchChapters();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  const handleEdit = (chapter: any) => {
    setEditingChapter(chapter);
    form.reset(chapter);
    setOpen(true);
  };

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Chapters</h1>
          <p className="text-muted-foreground">
            Create and manage network chapters.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
              setEditingChapter(null);
              form.reset({
                name: "",
                institution: "",
                presidentName: "",
                presidentEmail: "",
                email: "",
                location: "",
                status: "Active",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? "Edit Chapter" : "New Chapter"}
              </DialogTitle>
              <DialogDescription>
                Enter the official details for this chapter.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Alpha Chapter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution / School</FormLabel>
                      <FormControl>
                        <Input placeholder="University of X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="presidentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>President Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="presidentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>President Email</FormLabel>
                        <FormControl>
                          <Input placeholder="president@edu.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter Email</FormLabel>
                      <FormControl>
                        <Input placeholder="chapter@byen.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (City, State)</FormLabel>
                      <FormControl>
                        <Input placeholder="New York, NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Save Chapter
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapter Info</TableHead>
              <TableHead>Leadership</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapters.map((chapter) => (
              <TableRow key={chapter.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {chapter.name}
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {chapter.institution}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{chapter.presidentName}</div>
                  <div className="text-xs text-muted-foreground">
                    {chapter.email}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${
                      chapter.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100"
                    }`}
                  >
                    {chapter.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(chapter)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(chapter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {chapters.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No chapters found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
