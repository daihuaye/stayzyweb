import Link from "next/link";
import { Button } from "@/components/ui/button";
export function AccessError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-3xl font-semibold">Unable to verify access</h1>
      <p role="alert" className="my-6 text-muted-foreground">
        {message}
      </p>
      <Button asChild>
        <Link href="/admin/login">Return to sign in</Link>
      </Button>
    </main>
  );
}
