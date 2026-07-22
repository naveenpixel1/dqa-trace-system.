const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Crucial environment variables are missing in your .env file!');
}

// Opens the active communication line to your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };