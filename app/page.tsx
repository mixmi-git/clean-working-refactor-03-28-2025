export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/integrated');
}