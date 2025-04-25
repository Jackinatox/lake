"use client"

import { Button } from '@/components/ui/button'
import React from 'react'
import testLogg from './action'

function page() {
    return (
        <>
            <Button  onClick={testLogg}> Test Log </Button>
        </>
    )
}

export default page