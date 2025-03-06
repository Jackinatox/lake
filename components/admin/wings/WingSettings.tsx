"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import React, { useActionState } from 'react'
import saveWingAction from './saveWingSetting'

export interface PXNode {
    id: number,
    CPUId: number,
    RAMId: number,
    Name: string
}

interface WingSettingsProps{
    wingId: string,
    nodes: PXNode[],
    selectedNode: number,
    name: string
}

function WingSettings({ wingId, nodes, selectedNode, name }: WingSettingsProps) {

  const [error, action, isPending] =  useActionState(saveWingAction, null);

  return (
    <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Wing Configuration</CardTitle>
      <CardDescription>Select a Name and the Proxmox Node</CardDescription>
    </CardHeader>
    { error && <p className='text-red-600'>{JSON.stringify(error)}</p> }
    <form action={action}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input name="wingId" id="id" readOnly className="bg-muted cursor-not-allowed" aria-readonly="true" defaultValue={wingId}/>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            defaultValue={name}
            name='name'
            // onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter device name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Proxmox Node">Proxmox Node</Label>
          <Select defaultValue={String(selectedNode)} name='pxnode'>
            <SelectTrigger id="node">
              <SelectValue placeholder="Select Proxmox Node" />
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

      <CardFooter className="flex justify-between gap-2">
        {/* <Button type="button" variant="outline" onClick={() => setValues(initialValues)}> */}
        <Button type="button" variant="outline">
          Reset
        </Button>
        <Button>Save Configuration</Button>
      </CardFooter>
    </form>
  </Card>
  )
}

export default WingSettings