"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Link from "next/link";


export function Menu() {
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">Admin <ChevronDown className="ml-1 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem><Link href="/admin">Admin</Link></DropdownMenuItem>
                    {/* <DropdownMenuItem onClick={() => alert("Settings clicked")}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert("Logout clicked")}>Logout</DropdownMenuItem> */}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">Pakete <ChevronDown className="ml-1 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem><Link href="/products/gameserver">Games</Link></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button  variant="ghost"><Link href="/gameserver">Gameserver</Link></Button>
        </>
    );
}
