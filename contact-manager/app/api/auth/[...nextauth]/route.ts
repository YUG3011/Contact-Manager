import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

// Using provider-only (no Prisma adapter) so NextAuth runs without DB models.
// Remove the PrismaAdapter unless you've added the required NextAuth models to your Prisma schema.
const handler = NextAuth({
  providers: [
    GithubProvider({ clientId: process.env.GITHUB_ID || '', clientSecret: process.env.GITHUB_SECRET || '' }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
})

export { handler as GET, handler as POST }
