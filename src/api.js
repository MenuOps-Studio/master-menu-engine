import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://yolfsfforkibqvagahoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbGZzZmZvcmtpYnF2YWdhaG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDgxNTgsImV4cCI6MjA5NTEyNDE1OH0.vjjYyAag1TPK4trtUaESc8UAZXtefect-cDG9abSpqg';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getRestaurantData(restaurantId) {
    const [config, menu] = await Promise.all([
        supabase.from('site_configs').select('*').eq('restaurant_id', restaurantId).single(),
        supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).eq('status', 'AVAILABLE').order('sort_order')
    ]);

    return { config: config.data, menu: menu.data };
}