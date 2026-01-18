"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Edit,
  Linkedin,
  Twitter,
  Instagram,
  MapPin,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) {
      getDoc(doc(db, "users", user.uid)).then(async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.chapterId) {
            const chapterSnap = await getDoc(
              doc(db, "chapters", data.chapterId)
            );
            if (chapterSnap.exists()) {
              data.chapterName = chapterSnap.data().name;
            }
          }
          setProfile(data);
        }
      });
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  if (!profile)
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-semibold">Profile not found.</h2>
        <Button onClick={() => router.push("/profile/edit")} className="mt-4">
          Complete Setup
        </Button>
      </div>
    );

  return (
    <div className="container py-10 px-4 max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {profile.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground">
                    {profile.membershipType || "Member"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/profile/edit")}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {profile.email}
                  </div>
                )}
                {profile.phoneNumber && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {profile.phoneNumber}
                  </div>
                )}
                {profile.school && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {profile.school}
                  </div>
                )}
                {profile.chapterName && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {profile.chapterName}
                  </div>
                )}
              </div>

              {profile.socialLinks && (
                <div className="flex gap-2 pt-2">
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-muted rounded-full hover:bg-muted/80 text-blue-600 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-muted rounded-full hover:bg-muted/80 text-sky-500 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-muted rounded-full hover:bg-muted/80 text-pink-600 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Academic & Chapter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Major</div>
                <div className="font-medium">{profile.major || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Intake Cohort
                </div>
                <div className="font-medium">
                  {profile.intakeCohort || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Joined</div>
                <div className="font-medium">
                  {profile.joinDate
                    ? new Date(profile.joinDate).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Chapter Status
                </div>
                <div className="font-medium">
                  <Badge
                    variant={
                      profile.chapterApprovalStatus === "approved"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {profile.chapterApprovalStatus || "Pending"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About & Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills & Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Interests
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests
                  ? profile.interests
                      .split(",")
                      .map((i: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {i.trim()}
                        </Badge>
                      ))
                  : "None listed"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">
                {profile.skills
                  ? profile.skills.split(",").map((s: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {s.trim()}
                      </Badge>
                    ))
                  : "None listed"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Affiliations
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.affiliations
                  ? profile.affiliations
                      .split(",")
                      .map((s: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {s.trim()}
                        </Badge>
                      ))
                  : "None listed"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {profile.emergencyContactName || "Not set"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">
                  {profile.emergencyContactPhone || "Not set"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
