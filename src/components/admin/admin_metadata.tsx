"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminMetadata() {
  const [tags, setTags] = useState<string[]>([]);
  const [affiliations, setAffiliations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const tagsDoc = await getDoc(doc(db, "metadata", "tags"));
        if (tagsDoc.exists()) {
          setTags(tagsDoc.data().values || []);
        }

        const affDoc = await getDoc(doc(db, "metadata", "affiliations"));
        if (affDoc.exists()) {
          setAffiliations(affDoc.data().values || []);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        toast.error("Failed to load metadata");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "metadata", "tags"),
        { values: tags },
        { merge: true }
      );
      await setDoc(
        doc(db, "metadata", "affiliations"),
        { values: affiliations },
        { merge: true }
      );
      toast.success("Metadata updated successfully");
    } catch (error) {
      console.error("Error saving metadata:", error);
      toast.error("Failed to save metadata");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Metadata Management
        </h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interest Tags</CardTitle>
            <CardDescription>
              Manage the list of interests available for users to select. Users
              can also create new tags if allowed, but this list defines the
              suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagInput
              placeholder="Add interest tag..."
              value={tags}
              onChange={setTags}
              allowNew={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affiliations</CardTitle>
            <CardDescription>
              Manage the list of allowed affiliations. Users can ONLY select
              from this list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagInput
              placeholder="Add affiliation..."
              value={affiliations}
              onChange={setAffiliations}
              allowNew={true} // Admin can create new ones here
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
