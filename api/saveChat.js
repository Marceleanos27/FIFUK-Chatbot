// Vercel API endpoint to save chat conversations to Supabase
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract data from request body
    const { userMessage, botResponse, website } = req.body;

    // Validate required fields
    if (!userMessage || !botResponse) {
      return res.status(400).json({ error: 'Missing required fields: userMessage and botResponse are required' });
    }

    // Prepare data for insertion
    const chatData = {
      user_message: userMessage,
      bot_response: botResponse,
      website: website || 'unknown',
      created_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('chat_logs') // Make sure this table exists in your Supabase database
      .insert([chatData]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save chat', details: error.message });
    }

    // Success response
    return res.status(200).json({ 
      success: true, 
      message: 'Chat saved successfully',
      data: data 
    });

  } catch (error) {
    console.error('Error in saveChat endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
