import { supabase } from './client';

export async function getConversation(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error getting conversation:', error);
    return null;
  }

  return data;
}
