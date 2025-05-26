import { NextResponse } from "next/server";


export async function POST (request: Request){

    
    
    return new Response('', {status: 401, statusText: 'invalid auth'});
}