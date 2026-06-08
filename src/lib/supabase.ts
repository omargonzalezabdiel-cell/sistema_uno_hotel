/**
 * Cliente Supabase - Singleton
 *
 * Crea y exporta una única instancia del cliente Supabase para
 * toda la aplicación. Lee las credenciales desde las variables
 * de entorno de Vite (.env).
 *
 * IMPORTANTE: Usar siempre esta instancia compartida, nunca crear
 * nuevas instancias con createClient() en otros archivos.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas.'
  );
}

/** Instancia singleton del cliente Supabase */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
