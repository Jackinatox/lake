"use server"

import React from 'react'
import newUserAction from './newUserAction'
import { Button, FormControl, FormHelperText, FormLabel, Input } from '@mui/joy'
import { MailIcon } from 'lucide-react'

function createUser() {
  return (
    <>
      <form action={newUserAction}>
        <FormControl>
          <FormLabel>Label</FormLabel>
          <Input placeholder="Placeholder"/>
          <FormHelperText>This is a helper text.</FormHelperText>
        </FormControl>
        <Button type="submit">Submit</Button>
      </form>
    </>
  )
}

export default createUser