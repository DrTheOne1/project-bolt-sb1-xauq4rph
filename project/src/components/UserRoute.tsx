import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export default function UserRoute() {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['check-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      return data?.role === 'admin';
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return !isAdmin ? <Outlet /> : <Navigate to="/admin" />;
}