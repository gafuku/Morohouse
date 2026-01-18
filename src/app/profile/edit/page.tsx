"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // Make sure auth is imported
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormValues } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableAffiliations, setAvailableAffiliations] = useState<string[]>(
    []
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema.omit({ chapterApprovalStatus: true })),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      school: "",
      chapterId: "",
      major: "",
      interests: "",
      affiliations: "",
      membershipType: "Individual Member" as const,
      membershipStatus: "Pending" as const,
      joinDate: "",
      chapterJoinDate: "",
      intakeCohort: "",
      role: "member" as const,
      skills: "",
      socialLinks: {
        linkedin: "",
        twitter: "",
        instagram: "",
      },
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch Profile
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            ...data,
            school: data.school || data.schoolOrChapter || "",
            chapterId: data.chapterId || "",
            major: data.major || "",
            interests: data.interests || "",
            affiliations: data.affiliations || "",
            skills: data.skills || "",
            // Ensure nested objects are handled if they don't exist in DB yet
            socialLinks: data.socialLinks || {
              linkedin: "",
              twitter: "",
              instagram: "",
            },
          } as any);
        }

        // Fetch Chapters for dropdown
        const chaptersSnap = await getDocs(collection(db, "chapters"));
        setChapters(chaptersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // Fetch Metadata
        getDoc(doc(db, "metadata", "tags")).then((snap) => {
          if (snap.exists()) setAvailableTags(snap.data().values || []);
        });
        getDoc(doc(db, "metadata", "affiliations")).then((snap) => {
          if (snap.exists()) setAvailableAffiliations(snap.data().values || []);
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    console.log("Submiting wwith user", user);
    if (!user) return;
    setSubmitting(true);
    try {
      // Remove undefined values - Firestore doesn't allow them
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      await updateDoc(doc(db, "users", user.uid), cleanData);
      toast.success("Profile updated successfully!");
      router.push("/profile");
    } catch (e) {
      console.log(e);
      toast.error("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    if (!confirm(`Send a password reset email to ${user.email}?`)) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send reset email.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );

  return (
    <div className="container mx-auto py-10 px-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your personal information and preferences.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Your main profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-2">
                    Personal Information
                  </h3>
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            disabled
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="school"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School / Institution</FormLabel>
                          <FormControl>
                            {/* Make this a slightly smarter input or keep simple text for now */}
                            <Input placeholder="University of X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-2">
                    Academic & Professional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="major"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Major / Field of Study</FormLabel>
                          <FormControl>
                            <Input placeholder="Computer Science" {...field} />
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
                          <FormLabel>Organizational Affiliations</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Interests</FormLabel>
                          <FormControl>
                            <TagInput
                              placeholder="Add interests..."
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
                  </div>
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="React, Python, Leadership"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-2">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="socialLinks.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://linkedin.com/in/..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://twitter.com/..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://instagram.com/..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-2">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
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
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    onClick={() => {
                      console.log(form.formState.errors);
                      form.handleSubmit(onSubmit);
                    }}
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security / Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your password and account security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="font-medium">Password</div>
                <div className="text-sm text-muted-foreground">
                  Update your password via email verification.
                </div>
              </div>
              <Button variant="outline" onClick={handlePasswordReset}>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
