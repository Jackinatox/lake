"use server"

import React from 'react'

export default async function newUserAction(formData: FormData) {
    const name = formData.get('name');

    console.log('logged from form: ', name);
}
