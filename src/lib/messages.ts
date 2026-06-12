import { supabase } from './supabase';
import type { Message } from '../types';

export async function getMessages(myName: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`from_name.eq.${myName},to_name.eq.${myName}`)
    .order('created_at', { ascending: true });
  if (error) { console.error('Error fetching messages:', error); return []; }
  return (data as Message[]) ?? [];
}

export async function getAllMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('Error fetching all messages:', error); return []; }
  return (data as Message[]) ?? [];
}

export async function sendMessage(fromRole: string, fromName: string, toRole: string | null, toName: string | null, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ from_role: fromRole, from_name: fromName, to_role: toRole, to_name: toName, content })
    .select()
    .single();
  if (error) { console.error('Error sending message:', error); return null; }
  return data as Message;
}

export async function markMessagesRead(myName: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('to_name', myName)
    .eq('read', false);
}

export async function getUnreadCount(myName: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_name', myName)
    .eq('read', false);
  if (error) return 0;
  return count ?? 0;
}
