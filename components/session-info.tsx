'use client';

import { useSession } from "next-auth/react";

export default function SessionInfo() {
  const { data: session } = useSession();

  if (!session) {
    return <p>Not signed in</p>;
  }

  return (
    <div className="text-xs text-muted-foreground text-left">
      Signed in as:
      <pre className="text-left">{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
