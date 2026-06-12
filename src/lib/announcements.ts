import { supabase } from './supabase';
import type { Announcement } from '../types';

export async function getAnnouncements(activeOnly = false): Promise<Announcement[]> {
  let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) { console.error('Error fetching announcements:', error); return []; }
  return (data as Announcement[]) ?? [];
}

export async function createAnnouncement(title: string, content: string, createdBy: string | null, createdByName: string | null): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, content, created_by: createdBy, created_by_name: createdByName })
    .select()
    .single();
  if (error) { console.error('Error creating announcement:', error); return null; }
  return data as Announcement;
}

export async function deactivateAnnouncement(id: string): Promise<boolean> {
  const { error } = await supabase.from('announcements').update({ active: false }).eq('id', id);
  if (error) { console.error('Error deactivating announcement:', error); return false; }
  return true;
}
