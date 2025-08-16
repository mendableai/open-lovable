import { supabase } from './client';

export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error getting subscription:', error);
    return null;
  }

  return data;
}
