require('dotenv').config({ path: './.env' });
console.log('SUPABASE_JWT_SECRET exists:', !!process.env.SUPABASE_JWT_SECRET);
console.log('SUPABASE_JWT_SECRET length:', process.env.SUPABASE_JWT_SECRET?.length);
console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS);