"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface CPU {
  id: string,
  Name: string,
  Cores: number,
  Threads: number,
  SingleScore: number,
  MultiScore: number,
}

export interface WingSettingsFormValues {
  id: string
  name: string
  processorId: string
}

interface WingSettingsProps {
  initialValues: WingSettingsFormValues
  onSubmit?: (values: WingSettingsFormValues) => void
  processors?: CPU[]
}

export default function WingSettings({
  initialValues,
  onSubmit = (values) => console.log(values),
  processors
}: WingSettingsProps) {
  const [id, setId] = useState<string>(initialValues?.id || "");
  const [name, setName] = useState<string>(initialValues?.name || "");
  const [processorId, setProcessorId] = useState<string>(String(initialValues?.processorId) || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id, name, processorId });
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Device Configuration</CardTitle>
        <CardDescription>Enter the details for your device setup</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <Input
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter device ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter device name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processor">Processor</Label>
            <Select value={processorId} onValueChange={(value) => {
              console.log("New Value:", value);
              setProcessorId(value);
            }} disabled={processors.length === 0}>
              <SelectTrigger id="processor">
                <SelectValue placeholder="Select processor" />
              </SelectTrigger>
              <SelectContent>
                {processors.map((processor) => (
                  <SelectItem key={processor.id} value={String(processor.id)}>
                    {processor.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => {
            setId(initialValues.id);
            setName(initialValues.name);
            setProcessorId(initialValues.processorId);
          }}>
            Reset
          </Button>
          <Button type="submit">Save Configuration</Button>
        </CardFooter>
      </form>
    </Card>
  )
}