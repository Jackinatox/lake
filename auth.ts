import { JWT } from "next-auth/jwt"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Discord from "next-auth/providers/discord"
import { prisma } from "./prisma"
import NextAuth, { type DefaultSession } from "next-auth"
import { use } from "react"
import createUserApiKey from "./lib/Pterodactyl/userApiKey"
import { Builder } from "@avionrx/pterodactyl-js"
 
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

 
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id?: string
    ptUser: number
    ptKey: string
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
      const pt = new Builder().setURL(process.env.NEXT_PUBLIC_PTERODACTYL_URL).setAPIKey(process.env.PTERODACTYL_API_KEY).asAdmin();

      const newPTUser = await pt.createUser({
        firstName: "Jakob",
        lastName: "Schulze",
        username: user.name,
        email: user.email,
        password: Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join(''),
      })

      const newKey = await createUserApiKey(newPTUser.id);
      // const randomKey = Math.random().toString(36).slice(2, 12);
      await prisma.user.update({  // TODO: PT Key logic
        where: { id: user.id },
        data: { ptKey: newKey, ptUser: newPTUser.id }
      });
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.ptKey = dbUser.ptKey;
        token.ptUser = dbUser.ptUser;
        token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      // const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      session.user.ptKey = token.ptKey;
      session.user.ptUser = token.ptUser;
      return session
    },
  }
})