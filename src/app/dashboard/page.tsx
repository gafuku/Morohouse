"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
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
import Link from "next/link";
import { UserCircle, Briefcase, BookOpen, Users, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      // Fetch User Profile
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (!data.profileCompleted) {
              router.push("/profile/setup");
            } else {
              setProfile(data);
            }
          } else {
            // No profile doc found -> New user or deleted doc
            router.push("/profile/setup");
          }
        })
        .catch((err) => {
          console.error("Dashboard profile fetch error:", err);
          if (err.code === "permission-denied") {
            alert(
              "Database permission denied. Please check your Firestore Security Rules."
            );
          }
        });

      // Fetch Events
      getDocs(collection(db, "events"))
        .then((snap) =>
          setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        )
        .catch(console.error);

      // Fetch Opportunities Count
      getDocs(collection(db, "opportunities"))
        .then((snap) => setOpportunitiesCount(snap.size))
        .catch(console.error);
    }
  }, [user, loading, router]);

  if (loading || !profile)
    return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {profile.fullName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            {profile.membershipType} • {profile.school}
          </p>
        </div>
        <Button asChild>
          <Link href="/profile">Edit Profile</Link>
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-primary h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Chapter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                View roster & events
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/opportunities">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Opportunities
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {opportunitiesCount} Available
              </div>
              <p className="text-xs text-muted-foreground">
                Internships & Fellowships
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resources">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-green-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Library</div>
              <p className="text-xs text-muted-foreground">
                Guides, Bylaws & Templates
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-orange-500 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Updated</div>
              <p className="text-xs text-muted-foreground">
                Manage your details
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>
                Don't miss out on what's happening.
              </CardDescription>
            </div>
            {/* Link to dedicated event creation page - Admin Only */}
            {profile?.role === "admin" && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/events/new">+ Add</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events
                .filter((event) => {
                  // Admins see all
                  if (profile?.role === "admin") return true;
                  // Global events (no chapterId) visible to all
                  if (!event.chapterId) return true;
                  // Local events visible only to chapter members
                  return event.chapterId === profile?.chapterId;
                })
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {new Date(event.date).getDate()}
                        <br />
                        {new Date(event.date)
                          .toLocaleString("default", { month: "short" })
                          .toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {event.location} • {event.time}
                          {event.chapterName && (
                            <span className="ml-2 text-xs bg-muted px-1 rounded">
                              {event.chapterName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {user &&
                      (user.uid === event.createdBy ||
                        profile?.role === "admin") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            if (!confirm("Delete this event?")) return;
                            try {
                              const { doc, deleteDoc } = await import(
                                "firebase/firestore"
                              );
                              await deleteDoc(doc(db, "events", event.id));
                              setEvents((prev) =>
                                prev.filter((e) => e.id !== event.id)
                              );
                              // Optional: toast.success("Event deleted"); if we import toast
                            } catch (e) {
                              console.error("Error deleting event", e);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                ))}
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No upcoming events scheduled.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>
              Latest updates from National Leadership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Welcome to the new Morehouse Business Association Membership Database!</li>
              <li>2025 Fellowship applications are now open.</li>
              <li>Update your profile to be eligible for chapter grants.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
