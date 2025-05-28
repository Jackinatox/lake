import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { prisma } from "./prisma"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Discord],
  trustHost: true,
      events: {
        async createUser({ user }) {
            const randomKey = Math.random().toString(36).slice(2, 12);
            await prisma.user.update({  // TODO: PT Key logic
                where: { id: user.id },
                data: { ptKey: randomKey }
            });
        }
    }
})