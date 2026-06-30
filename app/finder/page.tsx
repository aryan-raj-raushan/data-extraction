import PlaceFinder from '@/components/places/PlaceFinder';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

const FinderPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <PlaceFinder />;
};

export default FinderPage;
