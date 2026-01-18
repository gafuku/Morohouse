import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl mb-4">
          Black Youth Empowerment Network
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Empowering the next generation through education, mentorship, and community building.
          Access the Member Database to connect with opportunities and resources.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg" className="px-8">
            <Link href="/login">Member Login</Link>
          </Button>
          <Button variant="outline" size="lg">
            <Link href="https://members.wearebyen.org" target="_blank"> Learn More</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
