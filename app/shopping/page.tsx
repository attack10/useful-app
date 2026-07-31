import { getCurrentUser } from '@/app/actions/auth';
import { getShoppingItems } from '@/app/actions/shopping';
import { redirect } from 'next/navigation';
import ShoppingClient from './ShoppingClient';

export default async function ShoppingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const initialItems = await getShoppingItems();

  return <ShoppingClient user={user} initialItems={initialItems} />;
}
