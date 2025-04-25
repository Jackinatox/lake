"use server"

import logger from "@/utils/pino";

async function testLogg(){
    logger.error('pino incrementing step');
} 

export default testLogg;