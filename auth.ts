import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins"



const prisma = new PrismaClient();


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      ptUserId: {
        type: "number",
        optional: true,
        required: false,
      },
      ptKey: {
        type: "string",
        optional: true,
        required: false,
      },
      stripeUserId: {
        type: "string",
        optional: true,
        required: false,
      },
    },
  },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }
  },
  emailAndPassword: {
    enabled: true
  },
  plugins: [admin()],
});