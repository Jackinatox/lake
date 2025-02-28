"use client"

import { ButtonGroup, Input, Textarea } from "@mui/joy"

interface serverProps {
  logs: string;
}



function Console({ logs }: serverProps) {

  return (
    <>
      <ButtonGroup orientation="vertical">

        <Textarea
          minRows={20}
          maxRows={20}
          placeholder="Server Console"
          value={logs}
          readOnly
          sx={{
            scrollBehavior: 'auto',
            width: '100%',
            outline: "none",
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            '&::before': {top: 'unset'},
          }}
        />
        <Input sx={{
          borderTopLeftRadius: 0, borderTopRightRadius: 0,
          position: 'relative', bottom: '1px', '&::before': {
            border: '1.5px solid var(--Input-focusedHighlight)',
            transform: 'scaleX(0)',
            left: '2.5px',
            right: '2.5px',
            bottom: 0,
            top: 'unset',
            //transition: 'transform .15s cubic-bezier(0.1,0.9,0.2,1)',
            borderRadius: 0,
            borderBottomLeftRadius: '64px 20px',
            borderBottomRightRadius: '64px 20px',
          },
          '&:focus-within::before': {
            transform: 'scaleX(1)',
          },
        }} />
      </ButtonGroup>
    </>
  )
}

export default Console