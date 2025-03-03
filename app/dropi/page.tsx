import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import React from 'react'

function page() {
  return (
    <>
        <Select>
        <SelectTrigger id="processor">
                <SelectValue placeholder="Select processor" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem key="1" value="1">
                    1. Item
                  </SelectItem>
                  <SelectItem key="2" value="2">
                    2. Item
                  </SelectItem>
                  <SelectItem key="3" value="3">
                    3. Item
                  </SelectItem>
                
              </SelectContent>
        </Select>
    </>
  )
}

export default page