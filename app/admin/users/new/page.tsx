"use client"

import React from 'react'
import newUserAction from './newUserAction'
import { Button, FormControl, FormHelperText, FormLabel, Input } from '@mui/joy'

function createUser() {
  return (
    <>
      <form action={newUserAction}>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input name='name' placeholder="Name" />
        </FormControl>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input name='email' placeholder="Email" />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input name='password' placeholder="Passwort" />
        </FormControl>


        <Button type="submit" sx={{ marginTop: '1rem'}}>Submit</Button>
      </form>
    </>
  )
}

export default createUser