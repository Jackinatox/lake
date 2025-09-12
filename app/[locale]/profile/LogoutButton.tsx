"use client"

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import React from "react";

function LogoutButton() {
  return (
    <Button variant="destructive" size="sm" onClick={() => authClient.signOut()}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}

export default LogoutButton;
