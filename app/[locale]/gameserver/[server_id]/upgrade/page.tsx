import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import UpgradeGameServerServer from '@/components/gameserver/Upgrade/UpgradeGameServerServer';
import React from 'react'
import Loading from './loading';


async function UpgradePage({ params }: { params: Promise<{ locale: string; server_id: string }> }) {
  const awaitedParams = await params;
  const { server_id } = awaitedParams;
  const session = await auth();

  if (!session?.user) {
    return <NotLoggedIn />
  }

  return (
    <div className='flex justify-center w-full'>
      <React.Suspense fallback={<Loading />}>
        <UpgradeGameServerServer serverId={server_id} apiKey={session.user.ptKey} />
      </React.Suspense>
    </div>
  )
}

export default UpgradePage