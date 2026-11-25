'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else router.push(`/${user.role.toLowerCase()}`);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Loading School Management System...
    </div>
  );
}