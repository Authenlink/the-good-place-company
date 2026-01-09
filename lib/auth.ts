import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";
import type { Session } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, companies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const foundUser = user[0];

        // Vérifier si l'utilisateur a un mot de passe (pas OAuth)
        if (!foundUser.password) {
          return null;
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          foundUser.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Si c'est un compte business, récupérer l'ID de l'entreprise
        let companyId: number | null = null;
        if (foundUser.accountType === "business") {
          const company = await db
            .select()
            .from(companies)
            .where(eq(companies.userId, foundUser.id))
            .limit(1);

          if (company.length > 0) {
            companyId = company[0].id;
          }
        }

        return {
          id: foundUser.id.toString(),
          email: foundUser.email,
          name: foundUser.name || undefined,
          image: foundUser.image || undefined,
          accountType: foundUser.accountType as "user" | "business",
          companyId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | undefined }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.accountType = user.accountType;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
        session.user.accountType = token.accountType;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
