import React from 'react'
import newUserAction from './newUserAction'
import { Button, FormControl, FormLabel, Input } from '@mui/joy'
import { FormMessage, Message } from '@/components/form-message';

async function createUser(props: {
  searchParams: Promise<Message>;
}) {
  const message = await props.searchParams;
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
          <FormLabel>Nachname</FormLabel>
          <Input name='lastname' placeholder="Nachname" />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input name='password' placeholder="Passwort" />
        </FormControl>

        <FormMessage message={message} />

        <Button type="submit" sx={{ marginTop: '1rem'}}>Submit</Button>
      </form>
    </>
  )
}

export default createUser