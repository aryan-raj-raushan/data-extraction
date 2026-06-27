import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     */
    '/((?!login|_next/static|_next/image|favicon.ico).*)',
  ],
};
