// app/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import PlaceFinderLanding from '@/components/landing/PlaceFinderLanding';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return <PlaceFinderLanding isLoggedIn={!!session} />;
}
