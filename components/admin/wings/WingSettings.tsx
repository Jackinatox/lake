"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import React from 'react'

export interface PXNode {
    id: number,
    CPUId: number,
    RAMId: number,
    Name: string
}

interface WingSettingsProps{
    wingId: string,
    nodes: PXNode[],
    selectedNode: number
}

function WingSettings({ nodes, selectedNode }: WingSettingsProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Wing Configuration</CardTitle>
      <CardDescription>Select a Name and the Proxmox Node</CardDescription>
    </CardHeader>
    <form>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input id="id" disabled className="bg-muted cursor-not-allowed" aria-readonly="true" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            // value={values.name}
            // onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter device name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="processor">Processor</Label>
          {/* <Select value={values.processor} onValueChange={(value) => handleChange("processor", value)}> */}
          <Select value={String(selectedNode)}>
            <SelectTrigger id="processor">
              <SelectValue placeholder="Select processor" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  {node.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        {/* <Button type="button" variant="outline" onClick={() => setValues(initialValues)}> */}
        <Button type="button" variant="outline">
          Reset
        </Button>
        <Button type="submit">Save Configuration</Button>
      </CardFooter>
    </form>
  </Card>
  )
}

export default WingSettings