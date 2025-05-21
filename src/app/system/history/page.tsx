import { redirect } from 'next/navigation';

export default function HistoryIndexPage() {
  // Redirect to system management page if accessed directly
  redirect('/system/manage');
}
