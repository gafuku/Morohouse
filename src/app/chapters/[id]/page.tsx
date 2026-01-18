"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Building2, MapPin, Mail, User, Calendar } from "lucide-react";

export default function ChapterProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChapter() {
      if (!params.id) return;
      try {
        const docRef = doc(db, "chapters", params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setChapter({ id: docSnap.id, ...docSnap.data() });
        } else {
          setChapter(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [params.id]);

  if (loading)
    return <div className="text-center py-10">Loading chapter...</div>;
  if (!chapter)
    return (
      <div className="container py-10 text-center">
        <h2 className="text-2xl font-bold">Chapter Not Found</h2>
        <Button onClick={() => router.push("/members")} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );

  return (
    <div className="container max-w-4xl py-10 px-6 mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/chapters")}>
          &larr; Back to Directory
        </Button>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="h-32 bg-primary/10 w-full relative">
          {/* Cover image placeholder */}
        </div>
        <CardHeader className="relative">
          <div className="absolute -top-16 left-6">
            <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-primary">
              {chapter.logoUrl ? (
                <img
                  src={chapter.logoUrl}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10" />
              )}
            </div>
          </div>
          <div className="ml-32 pt-2">
            <CardTitle className="text-3xl">{chapter.name}</CardTitle>
            <CardDescription className="text-lg flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" /> {chapter.institution}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Details</h3>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div>{chapter.location || "N/A"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Founded</div>
                <div>{chapter.foundedDate || "N/A"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-2 py-1 rounded-full text-xs border ${
                  chapter.status === "Active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-100"
                }`}
              >
                {chapter.status}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Leadership</h3>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">President</div>
                <div>{chapter.presidentName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Contact</div>
                <a
                  href={`mailto:${chapter.email}`}
                  className="text-primary hover:underline"
                >
                  {chapter.email}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
