import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const cwd = process.cwd();

const candidateFiles = [
  '.env.test.local',
  '.env.local',
  '.env.test',
  '.env',
].map((p) => path.resolve(cwd, p));

for (const file of candidateFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: false });
  }
}

// Ensure compatibility between Vite-style and generic env names
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}


