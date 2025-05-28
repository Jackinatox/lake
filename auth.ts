import { PrismaAdapter } from "@auth/prisma-adapter"
import Discord from "next-auth/providers/discord"
import { prisma } from "./prisma"
import NextAuth, { type DefaultSession } from "next-auth"
 
declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      ptKey: string
      ptUser: number
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"]
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Discord],
  session:{
    strategy: 'jwt'
  },
  trustHost: true,
  events: {
    async createUser({ user }) {
      const randomKey = Math.random().toString(36).slice(2, 12);
      await prisma.user.update({  // TODO: PT Key logic
        where: { id: user.id },
        data: { ptKey: randomKey }
      });
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        // token.ptKey = dbUser.ptKey;
        // token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      // const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      session.user.ptKey = 'bbbbbbbb'
      session.user.ptUser = 1
      return session
    },
  }
})