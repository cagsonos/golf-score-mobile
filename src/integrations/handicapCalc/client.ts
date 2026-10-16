// SOLO LECTURA. Cliente del proyecto "Handicap Calulator" (Supabase "CRS", esquema `handicap`).
// Esa app no es nuestra para escribir: aquí no se usa insert/update/delete/upsert ni RPC que escriban.
// Sin sesión a propósito: allá la lectura es pública para anon y un usuario logueado no ve nada.
import { createClient } from '@supabase/supabase-js';

const HANDICAP_CALC_URL = 'https://jhollumqkdrdmzftmcry.supabase.co';
const HANDICAP_CALC_PUBLISHABLE_KEY = 'sb_publishable_Cok_j8endG8fv7vW2fc6bQ_L__0cH0a';

export const handicapCalc = createClient(HANDICAP_CALC_URL, HANDICAP_CALC_PUBLISHABLE_KEY, {
  db: { schema: 'handicap' },
  auth: { persistSession: false, autoRefreshToken: false, storageKey: 'handicap-calc' },
});
