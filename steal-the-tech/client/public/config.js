// STEAL THE TECH — runtime configuration (edit this file after deploying; no rebuild needed).
//
// Leave supabaseUrl / supabaseAnonKey empty to run the game in OFFLINE PRACTICE mode
// (the whole game server runs inside the browser; other bases are NPCs).
// Fill them in with your Supabase project's URL and anon (public) key to turn on
// real online multiplayer. The anon key is designed to be public.
window.STT_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  // Where the in-browser Postgres engine is loaded from in offline mode.
  // pgliteUrl: 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js',
};
