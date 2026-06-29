import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/finder/:path*', // ← added: protects /finder and all sub-routes
    '/dashboard/:path*',
    '/editor/:path*',
    '/users/:path*',
    '/api/papers/:path*',
    '/api/users/:path*',
  ],
};
