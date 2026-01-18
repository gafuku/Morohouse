"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { opportunitySchema, OpportunityFormValues } from "@/lib/schemas";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewOpportunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "",
      organization: "",
      type: "Internship",
      location: "",
      deadline: "",
      description: "",
      link: "",
      tags: "",
      status: "pending", // Default status
      createdBy: "",
    },
  });

  async function onSubmit(data: OpportunityFormValues) {
    if (!user) {
        toast.error("You must be logged in.");
        return;
    }
    setSubmitting(true);
    try {
      // Parse tags
      const tagList = data.tags ? data.tags?.split?.(",").map(t => t.trim()).filter(Boolean) : [];
      
      await addDoc(collection(db, "opportunities"), {
        ...data,
        tags: tagList,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        status: "pending", // Default to pending for approval
      });
      
      toast.success("Opportunity submitted for review!");
      router.push("/opportunities");
    } catch (error) {
      console.error("Error submitting opportunity:", error);
      toast.error("Failed to submit opportunity. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container max-w-2xl py-10 mx-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle>Submit an Opportunity</CardTitle>
          <CardDescription>
            Share an internship, job, or fellowship with the network. All submissions require admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer Intern" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Internship">Internship</SelectItem>
                              <SelectItem value="Fellowship">Fellowship</SelectItem>
                              <SelectItem value="Job">Job</SelectItem>
                              <SelectItem value="Scholarship">Scholarship</SelectItem>
                              <SelectItem value="Conference">Conference</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Remote, NYC, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Details about requirements and role..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech, Paid, Summer 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
