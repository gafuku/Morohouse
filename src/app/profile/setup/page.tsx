"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  profileSchema,
  profileSetupSchema,
  ProfileFormValues,
} from "@/lib/schemas";
import { TagInput } from "@/components/ui/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  CardDescription,
} from "@/components/ui/card";

export default function ProfileSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableAffiliations, setAvailableAffiliations] = useState<string[]>(
    []
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch chapters
  useEffect(() => {
    const fetchChapters = async () => {
      const snapshot = await getDocs(collection(db, "chapters"));
      setChapters(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));

      const tagsSnap = await getDoc(doc(db, "metadata", "tags"));
      if (tagsSnap.exists()) setAvailableTags(tagsSnap.data().values || []);
    };
    fetchChapters();
  }, []);
  // Check if profile already exists to prevent re-setup
  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists() && snap.data().profileCompleted) {
          router.push("/dashboard");
        }
      });
    }
  }, [user, router]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      email: user?.email || "",
      phoneNumber: "",
      school: "",
      major: "",
      interests: "",
      membershipType: "Individual Member" as const,
      membershipStatus: "Pending" as const,
      joinDate: new Date().toISOString().split("T")[0],
      intakeCohort: "",
      role: "member" as const,
      skills: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      chapterId: "",
    },
  });

  const membershipType = form.watch("membershipType");

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setSubmitting(true);
    try {
      // Remove undefined values - Firestore doesn't allow them
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      const profileData = {
        ...cleanData,
        uid: user.uid,
        updatedAt: new Date().toISOString(),
        profileCompleted: true,
        chapterApprovalStatus:
          data.membershipType === "Chapter Member" ? "pending" : null,
      };

      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error writing profile:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container max-w-2xl py-10 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide your details to join the Morehouse Business Association database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 555-5555" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="membershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Type</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Reset chapter fields if changing type
                        if (val !== "Chapter Member") {
                          form.setValue("chapterId", "");
                          form.setValue("school", "");
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select membership type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual Member">
                          Individual Member
                        </SelectItem>
                        <SelectItem value="Chapter Member">
                          Chapter Member
                        </SelectItem>
                        <SelectItem value="Fellow">Fellow</SelectItem>
                        <SelectItem value="Alumni">Alumni</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="chapterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a chapter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chapters.map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School / Institution (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="University of X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major / Field of Study</FormLabel>
                    <FormControl>
                      <Input placeholder="Political Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests & Leadership Path</FormLabel>
                      <FormControl>
                        <TagInput
                          placeholder="Civic engagement, Policy..."
                          value={
                            field.value
                              ? field.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : []
                          }
                          onChange={(val) => field.onChange(val.join(","))}
                          suggestions={availableTags}
                          allowNew={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="affiliations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliations (Optional)</FormLabel>
                      <FormControl>
                        <TagInput
                          placeholder="Select affiliations..."
                          value={
                            field.value
                              ? field.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : []
                          }
                          onChange={(val) => field.onChange(val.join(","))}
                          suggestions={availableAffiliations}
                          allowNew={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Join Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Public Speaking, Design..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                  Emergency Contact (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact Phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Saving Profile..." : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
