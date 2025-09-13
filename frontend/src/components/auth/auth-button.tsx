"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { UserProfile } from "./user-profile";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button variant="ghost" size="sm" disabled>Loading...</Button>;
  }

  if (session?.user) {
    return <UserProfile user={session.user} />;
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => signIn()}
    >
      Sign In
    </Button>
  );
}
