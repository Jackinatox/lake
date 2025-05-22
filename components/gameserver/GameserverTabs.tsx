"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, HardDrive, Network, Settings } from "lucide-react"
import { useState } from "react"

interface TabsComponentProps {
  consoleComponent: React.ReactNode
  fileManagerComponent: React.ReactNode
  networkControlComponent?: React.ReactNode
  backupManagerComponent?: React.ReactNode
  settingsComponent?: React.ReactNode
}

export function TabsComponent({
  consoleComponent,
  fileManagerComponent,
  networkControlComponent,
  backupManagerComponent,
  settingsComponent,
}: TabsComponentProps) {
  const [activeTab, setActiveTab] = useState("console")

  return (
    <Tabs defaultValue="console" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="console" className="flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <span className="hidden sm:inline">Console</span>
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Files</span>
        </TabsTrigger>
        <TabsTrigger value="network" className="flex items-center gap-2" disabled={!networkControlComponent}>
          <Network className="h-4 w-4" />
          <span className="hidden sm:inline">Network</span>
        </TabsTrigger>
        <TabsTrigger value="backups" className="flex items-center gap-2" disabled={!backupManagerComponent}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 3v18" />
            <path d="M3 7h18" />
            <path d="m15 14-3 3 3 3" />
            <path d="M18 14h-6v6" />
          </svg>
          <span className="hidden sm:inline">Backups</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2" disabled={!settingsComponent}>
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="console" className="mt-4">
        {consoleComponent}
      </TabsContent>
      <TabsContent value="files" className="mt-4">
        {fileManagerComponent}
      </TabsContent>
      <TabsContent value="network" className="mt-4">
        {networkControlComponent || <div className="text-center py-8">Network control coming soon</div>}
      </TabsContent>
      <TabsContent value="backups" className="mt-4">
        {backupManagerComponent || <div className="text-center py-8">Backup manager coming soon</div>}
      </TabsContent>
      <TabsContent value="settings" className="mt-4">
        {settingsComponent || <div className="text-center py-8">Settings coming soon</div>}
      </TabsContent>
    </Tabs>
  )
}
