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


interface FormValues {
  id: string
  name: string
  processor: string
}

interface WingSettingsProps {
  initialValues?: FormValues
  onSubmit?: (values: FormValues) => void
  processors?: CPU[]
}

export default function WingSettings({
  initialValues,
  onSubmit = (values) => console.log(values),
  processors
}: WingSettingsProps) {
  const [values, setValues] = useState<FormValues>(initialValues || { id: "", name: "", processor: "" });


  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
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
              value={values.id}
              onChange={(e) => handleChange("id", e.target.value)}
              placeholder="Enter device ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter device name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processor">Processor</Label>
            <Select value={values.processor} onValueChange={(value) => handleChange("processor", value)}>
              <SelectTrigger id="processor">
                <SelectValue placeholder="Select processor" />
              </SelectTrigger>
              <SelectContent>
                {processors.map((processor) => (
                  <SelectItem key={processor.id} value={processor.Name}>
                    {processor.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setValues(initialValues)}>
            Reset
          </Button>
          <Button type="submit">Save Configuration</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

