# ✅ Chatbot Widget - Chat Logger Integration Complete

## 📋 Summary of Changes

Your chatbot widget has been successfully modified to automatically save all conversations to your Vercel API endpoint and Supabase database.

### Files Modified:
1. **index.html** - Added `saveChatToAPI()` function and integrated it into all response functions
2. **package.json** - Added `@supabase/supabase-js` dependency

### Files Created:
1. **api/saveChat.js** - New Vercel serverless function endpoint
2. **CHAT_LOGGER_README.md** - Complete setup and usage documentation
3. **MODIFIED_CODE_REFERENCE.js** - Code snippet reference with explanations
4. **test-chat-logger.html** - Testing tool for the API endpoint

---

## 🚀 Quick Start Guide

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Create Supabase Table
Run this SQL in your Supabase dashboard:

```sql
CREATE TABLE chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_logs_website ON chat_logs(website);
CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at DESC);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON chat_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public reads" ON chat_logs
  FOR SELECT USING (true);
```

### 3️⃣ Set Environment Variables in Vercel
Add these to your Vercel project settings:
- `SUPABASE_URL` = https://xxxxx.supabase.co
- `SUPABASE_KEY` = your_supabase_anon_key

### 4️⃣ Deploy to Vercel
```bash
vercel --prod
```

### 5️⃣ Test the Integration
1. Open `test-chat-logger.html` in your browser
2. Or use your live chatbot and check the browser console
3. Verify data appears in Supabase → Table Editor → chat_logs

---

## 🎯 How It Works

```
User sends message
    ↓
Bot processes & responds
    ↓
saveChatToAPI() called automatically
    ↓
POST to /api/saveChat
    ↓
Saved to Supabase
    ↓
Success logged to console
```

### Functions that Save Chats:
- ✅ `sendMessage()` - User types and sends message
- ✅ `handleQuickReplyWithRAG()` - Quick reply buttons clicked
- ✅ `handleTopicClick()` - Topic selection buttons clicked
- ✅ `searchInDatabase()` - Database searches
- ✅ `showCategoryButtons()` - Category buttons (e.g., "Online formulár")

---

## 📊 Viewing Your Chat Data

### In Supabase Dashboard:
1. Go to Table Editor
2. Select `chat_logs` table
3. View all conversations with timestamps

### SQL Queries:
```sql
-- Today's chats
SELECT * FROM chat_logs 
WHERE created_at >= CURRENT_DATE 
ORDER BY created_at DESC;

-- Chats by website
SELECT website, COUNT(*) as total 
FROM chat_logs 
GROUP BY website;

-- Search messages
SELECT * FROM chat_logs 
WHERE user_message ILIKE '%habilitačné%';
```

---

## 🔧 API Endpoint Details

**URL:** `https://fifuk-chatbot.vercel.app/api/saveChat`

**Method:** POST

**Request Body:**
```json
{
  "userMessage": "Aké sú habilitačné kritériá?",
  "botResponse": "Habilitačné kritériá zahŕňajú...",
  "website": "fphil.uniba.sk"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Chat saved successfully",
  "data": {...}
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message",
  "details": "Detailed error info"
}
```

---

## ✅ Testing Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Supabase table created (`chat_logs`)
- [ ] Environment variables set in Vercel
- [ ] Project deployed to Vercel
- [ ] Test page works (`test-chat-logger.html`)
- [ ] Live chatbot saves conversations
- [ ] Console shows "Chat conversation saved successfully"
- [ ] Data visible in Supabase table

---

## 🛠️ Troubleshooting

### ❌ "Chat conversation saved successfully" not showing
**Check:**
- Browser console for errors
- Vercel environment variables are set
- API endpoint is accessible

### ❌ 500 Error from API
**Check:**
- SUPABASE_URL and SUPABASE_KEY are correct
- Table name is exactly `chat_logs`
- Columns match the schema

### ❌ Data not appearing in Supabase
**Check:**
- RLS policies are created
- Supabase API key has correct permissions
- Check Supabase logs for errors

---

## 📁 File Structure

```
FIFUK-Chatbot-2/
├── index.html ........................ Modified (added saveChatToAPI)
├── package.json ...................... Modified (added @supabase/supabase-js)
├── api/
│   ├── chat.js ....................... Existing chat API
│   └── saveChat.js ................... NEW - Chat logger endpoint
├── CHAT_LOGGER_README.md ............. NEW - Full documentation
├── MODIFIED_CODE_REFERENCE.js ........ NEW - Code reference
└── test-chat-logger.html ............. NEW - API testing tool
```

---

## 🎉 What's Next?

### Enhance Your Chat Logger:
1. **Add Analytics Dashboard** - Visualize chat metrics
2. **User Feedback** - Add thumbs up/down ratings
3. **Session Tracking** - Group related messages
4. **Export Data** - Download chat logs as CSV
5. **Real-time Monitoring** - Alert for specific keywords

### Example Analytics Queries:
```sql
-- Most common questions
SELECT user_message, COUNT(*) as frequency
FROM chat_logs
GROUP BY user_message
ORDER BY frequency DESC
LIMIT 10;

-- Busiest hours
SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as chats
FROM chat_logs
GROUP BY hour
ORDER BY hour;
```

---

## 📞 Support

Need help? Check:
1. Browser console (F12 → Console)
2. Vercel function logs (Vercel Dashboard → Functions)
3. Supabase logs (Supabase Dashboard → Logs)

All errors are logged for easy debugging!

---

**🎊 Congratulations!** Your chatbot now automatically logs all conversations. Every interaction is saved to your database for analysis and improvement.
