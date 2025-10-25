// Vercel API endpoint to save chat conversations to Supabase
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) : 'missing'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'SUPABASE_URL or SUPABASE_KEY not set in Vercel environment variables'
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract data from request body
    const { userMessage, botResponse, website } = req.body;

    // Get user's IP address from request headers
    const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   req.socket?.remoteAddress ||
                   'unknown';

    console.log('Received data:', {
      hasUserMessage: !!userMessage,
      hasBotResponse: !!botResponse,
      website: website,
      userIp: userIp
    });

    // Validate required fields
    if (!userMessage || !botResponse) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userMessage and botResponse are required' 
      });
    }

    // Prepare data for insertion - without created_at (let database handle it)
    const chatData = {
      user_message: userMessage,
      bot_response: botResponse,
      website: website || 'unknown',
      user_ip: userIp
    };

    console.log('Attempting to insert data into chat_logs table...');

    // Insert into Supabase
    const { data, error } = await supabase
      .from('chat_logs')
      .insert([chatData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save chat to database',
        details: error.message,
        hint: error.hint || 'Check if chat_logs table exists with columns: user_message, bot_response, website, created_at'
      });
    }

    console.log('Successfully saved chat to database');

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
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
