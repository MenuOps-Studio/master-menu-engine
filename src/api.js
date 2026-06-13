// ==========================================
// API ENGINE: Επικοινωνία με Supabase
// ==========================================

const SUPABASE_URL = 'https://yolfsfforkibqvagahoq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbGZzZmZvcmtpYnF2YWdhaG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDgxNTgsImV4cCI6MjA5NTEyNDE1OH0.vjjYyAag1TPK4trtUaESc8UAZXtefect-cDG9abSpqg';

export async function fetchRestaurantData() {
    try {
        // Τραβάμε ταυτόχρονα το Μενού, τα Υλικά ΚΑΙ το Config του εστιατορίου (ID=1)
        const [menuResponse, ingResponse, configResponse] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/menu_items?restaurant_id=eq.1&order=sort_order.asc`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/ingredients?restaurant_id=eq.1`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            }),
            // Υποθέτουμε ότι έχεις έναν πίνακα 'restaurants' ή 'config' με id=1
            fetch(`${SUPABASE_URL}/rest/v1/site_configs?id=eq.1`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            })
        ]);

        const menuData = await menuResponse.json();
        const ingredientsData = await ingResponse.json();
        const configData = await configResponse.json();
        
        // Το config είναι το πρώτο αντικείμενο που επιστρέφει ο πίνακας restaurants
        const config = configData.length > 0 ? configData[0] : null;

        return { menuData, ingredientsData, config };

    } catch (error) { 
        console.error('Σφάλμα API:', error); 
        return { menuData: [], ingredientsData: [], config: null };
    }
}