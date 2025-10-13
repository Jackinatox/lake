import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins"
import createUserApiKey from "./lib/Pterodactyl/userApiKey";
import { createPtClient } from "./lib/Pterodactyl/ptAdminClient";
import { lastLoginMethod } from "better-auth/plugins"
import generateUniqueUserName from "./lib/auth/generateUniqueUserName";




const prisma = new PrismaClient();

function generateRandomPassword(length: number = 32): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}


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
      ptUsername: {
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
  plugins: [
    lastLoginMethod({
      storeInDatabase: true
    }),
    admin()],
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          try {
            const ptAdmin = createPtClient();
            const ptUsername = await generateUniqueUserName(user.email);

            const newPTUser = await ptAdmin.createUser({
              firstName: user.name,
              lastName: "Schulze",
              username: ptUsername,
              email: user.email,
              password: generateRandomPassword(),
              externalId: user.id
            })

            const newKey = await createUserApiKey(newPTUser.id);
            return {
              data: {
                ...user,
                ptUserId: newPTUser.id,
                ptKey: newKey,
                ptUsername: ptUsername
              },
            }

          } catch (error) {
            console.error("Error creating user:", error);
            throw new Error("Failed to create user");
          }
        },
      }
    }
  }
});