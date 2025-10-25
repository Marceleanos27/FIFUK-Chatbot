# Chat Logger Setup Instructions

## Overview
Your chatbot now automatically saves all conversations to a Supabase database via the `/api/saveChat` endpoint.

## What Was Modified

### 1. **index.html** - Added Chat Logging Function
A new `saveChatToAPI()` function was added that:
- Sends user messages and bot responses to your Vercel API
- Includes the website hostname automatically
- Handles errors gracefully (logs to console without disrupting UX)
- Is called after every bot response in:
  - `sendMessage()` - main user input
  - `handleQuickReplyWithRAG()` - quick reply buttons
  - `handleTopicClick()` - topic selection buttons
  - `searchInDatabase()` - database searches
  - `showCategoryButtons()` - category buttons (Online formulár)

### 2. **api/saveChat.js** - New Vercel API Endpoint
Created a new serverless function that:
- Accepts POST requests with `userMessage`, `botResponse`, and `website`
- Connects to Supabase using environment variables
- Inserts chat data into the `chat_logs` table
- Returns success/error responses

### 3. **package.json** - Added Supabase Dependency
Added `@supabase/supabase-js` package for database connectivity.

## Setup Instructions

### Step 1: Install Dependencies
Run this command in your project directory:
```bash
npm install
```

### Step 2: Create Supabase Table
Go to your Supabase dashboard and create a new table called `chat_logs` with this SQL:

```sql
-- Create chat_logs table
CREATE TABLE chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by website and date
CREATE INDEX idx_chat_logs_website ON chat_logs(website);
CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (adjust as needed for your security requirements)
CREATE POLICY "Allow public inserts" ON chat_logs
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow reads (adjust as needed)
CREATE POLICY "Allow public reads" ON chat_logs
  FOR SELECT
  USING (true);
```

### Step 3: Configure Vercel Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   - `SUPABASE_URL` = Your Supabase project URL (e.g., https://xxxxx.supabase.co)
   - `SUPABASE_KEY` = Your Supabase anon/public key

### Step 4: Deploy to Vercel
```bash
vercel --prod
```

## Testing

### Test the Chat Logger
1. Open your chatbot widget on any allowed domain
2. Send a message and wait for the bot's response
3. Check your browser console - you should see: `Chat conversation saved successfully`
4. Go to your Supabase dashboard → Table Editor → `chat_logs` to verify the data

### View Saved Chats in Supabase
You can query your chat logs with SQL:
```sql
-- Get all chats from today
SELECT * FROM chat_logs 
WHERE created_at >= CURRENT_DATE 
ORDER BY created_at DESC;

-- Get chats by website
SELECT * FROM chat_logs 
WHERE website = 'fphil.uniba.sk' 
ORDER BY created_at DESC;

-- Count chats per website
SELECT website, COUNT(*) as chat_count 
FROM chat_logs 
GROUP BY website 
ORDER BY chat_count DESC;
```

## How It Works

1. **User sends a message** → Chatbot processes it
2. **Bot generates response** → Response is displayed to user
3. **After response is shown** → `saveChatToAPI()` is automatically called
4. **API saves to Supabase** → Data is stored with timestamp and website info
5. **Errors are logged** → Any failures are logged to console but don't interrupt the user

## Error Handling

The chat logger is designed to fail gracefully:
- If Supabase is down, the chatbot continues to work normally
- All errors are logged to the browser console for debugging
- Users never see error messages from the logging system

## Security Notes

1. **Environment Variables**: Your Supabase credentials are stored securely in Vercel
2. **Row Level Security**: The SQL above enables RLS - adjust policies for your needs
3. **CORS**: The API endpoint is accessible from your allowed domains only
4. **Data Privacy**: Consider GDPR/privacy laws when storing user conversations

## Troubleshooting

### Chat not saving?
1. Check browser console for errors
2. Verify Vercel environment variables are set correctly
3. Ensure Supabase table exists with correct column names
4. Check Supabase logs for connection errors

### API returns 500 error?
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set in Vercel
- Check that table name is exactly `chat_logs`
- Review Vercel function logs

### How to view logs?
- **Browser**: Open DevTools → Console
- **Vercel**: Dashboard → Your Project → Functions → Logs
- **Supabase**: Dashboard → Logs

## Data Schema

The `chat_logs` table stores:
- `id`: Auto-incrementing primary key
- `user_message`: The user's question/message
- `bot_response`: The chatbot's reply
- `website`: Hostname where the chat occurred
- `created_at`: Timestamp of the conversation

## Future Enhancements

Consider adding:
- User session tracking (add `session_id` column)
- User feedback (add `feedback` column for thumbs up/down)
- Analytics dashboard to visualize chat metrics
- Export functionality for chat data
- Conversation threading (link related messages)

---

**Need help?** Check the console logs or review the Vercel function logs for detailed error messages.
