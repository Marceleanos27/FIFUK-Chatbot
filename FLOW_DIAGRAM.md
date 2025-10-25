# Chat Logger - Visual Flow Diagram

## 🔄 Complete Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                                │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    User sends message: "Aké sú kritériá?"
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CHATBOT PROCESSING                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Message added to chatHistory                                        │
│  2. RAG system searches for relevant content                            │
│  3. API call to /api/chat (DeepSeek)                                    │
│  4. Bot generates response                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                   Bot displays: "Habilitačné kritériá zahŕňajú..."
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🆕 NEW: AUTOMATIC LOGGING                            │
├─────────────────────────────────────────────────────────────────────────┤
│  saveChatToAPI(userMessage, botResponse) is called                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ Function Parameters:                                   │             │
│  │ • userMessage: "Aké sú kritériá?"                      │             │
│  │ • botResponse: "Habilitačné kritériá zahŕňajú..."     │             │
│  │ • website: window.location.hostname                    │             │
│  └────────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                       POST to /api/saveChat
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      VERCEL API ENDPOINT                                │
├─────────────────────────────────────────────────────────────────────────┤
│  File: api/saveChat.js                                                  │
│                                                                          │
│  1. Receives POST request                                               │
│  2. Extracts: userMessage, botResponse, website                         │
│  3. Gets SUPABASE_URL and SUPABASE_KEY from env vars                    │
│  4. Creates Supabase client                                             │
│  5. Prepares data object                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    INSERT INTO chat_logs TABLE
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE DATABASE                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Table: chat_logs                                                       │
│                                                                          │
│  ┌──────┬──────────────────────┬──────────────────────┬─────────────┐  │
│  │  id  │   user_message       │   bot_response       │   website   │  │
│  ├──────┼──────────────────────┼──────────────────────┼─────────────┤  │
│  │  1   │ Aké sú kritériá?     │ Habilitačné...       │ uniba.sk    │  │
│  │  2   │ Kontakt?             │ Gabriela Baková...   │ uniba.sk    │  │
│  └──────┴──────────────────────┴──────────────────────┴─────────────┘  │
│                                                                          │
│  ✅ Data successfully stored with timestamp                             │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        Response sent back to widget
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BROWSER CONSOLE OUTPUT                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ "Chat conversation saved successfully"                              │
│                                                                          │
│  (If error occurs):                                                     │
│  ❌ "Error saving chat to API: [error details]"                         │
│                                                                          │
│  Note: Chatbot continues working even if logging fails!                │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Integration Points

### Where `saveChatToAPI()` is Called:

```
1. sendMessage()
   └─ When user types and submits a message
   
2. handleQuickReplyWithRAG()
   └─ When user clicks quick reply buttons
      (Habilitačné kritériá, Inauguračné kritériá, Kontakt)
   
3. handleTopicClick()
   └─ When user selects a specific topic from categories
   
4. searchInDatabase()
   └─ When direct category searches are performed
   
5. showCategoryButtons()
   └─ When "Online formulár" button generates instant response
```

## 🔐 Security & Error Handling

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

saveChatToAPI() called
        │
        ▼
    Try to send data
        │
        ├─────────────────┬─────────────────┐
        ▼                 ▼                 ▼
    Network Error    API Error 500     Success (200)
        │                 │                 │
        ▼                 ▼                 ▼
    catch block      catch block      Success logged
        │                 │                 │
        ▼                 ▼                 ▼
  Log to console   Log to console   Return to user
        │                 │
        └─────────┬───────┘
                  ▼
        Chatbot continues normally
        (User never sees error!)
```

## 📊 Data Structure

### Request Payload:
```json
{
  "userMessage": "Aké sú habilitačné kritériá pre docenta?",
  "botResponse": "Habilitačné kritériá pre docenta zahŕňajú...",
  "website": "fphil.uniba.sk"
}
```

### Database Record:
```json
{
  "id": 1,
  "user_message": "Aké sú habilitačné kritériá pre docenta?",
  "bot_response": "Habilitačné kritériá pre docenta zahŕňajú...",
  "website": "fphil.uniba.sk",
  "created_at": "2025-10-25T14:30:22.123Z"
}
```

### API Success Response:
```json
{
  "success": true,
  "message": "Chat saved successfully",
  "data": { ... }
}
```

## 🎨 Code Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FILE STRUCTURE                                │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (index.html)
├─ saveChatToAPI(userMsg, botMsg)
│  ├─ Gets website hostname
│  ├─ Sends POST to /api/saveChat
│  └─ Handles errors gracefully
│
├─ sendMessage()
│  ├─ ... existing chat logic ...
│  └─ await saveChatToAPI(message, reply) ◄── NEW
│
├─ handleQuickReplyWithRAG(query)
│  ├─ ... existing RAG logic ...
│  └─ await saveChatToAPI(query, reply) ◄── NEW
│
└─ (Similar for other functions)

BACKEND (api/saveChat.js)
├─ Validates request method
├─ Gets env variables
│  ├─ SUPABASE_URL
│  └─ SUPABASE_KEY
├─ Validates payload
├─ Connects to Supabase
├─ Inserts data
└─ Returns response

DATABASE (Supabase)
└─ chat_logs table
   ├─ id (primary key)
   ├─ user_message
   ├─ bot_response
   ├─ website
   └─ created_at
```

## ⚡ Performance Considerations

- **Async/Await**: Logging doesn't block UI
- **Fire-and-Forget**: User doesn't wait for DB write
- **Error Isolation**: Logging errors don't crash chatbot
- **Lightweight Payload**: Only essential data is sent

## 🔮 Future Enhancements

```
Potential Additions:
├─ Session Tracking
│  └─ Group related messages in conversations
├─ User Feedback
│  └─ Add thumbs up/down ratings
├─ Analytics Dashboard
│  └─ Visualize chat metrics and trends
├─ Real-time Monitoring
│  └─ Alert on specific keywords or patterns
└─ Export Functionality
   └─ Download chat logs as CSV/JSON
```

---

**Note:** This diagram shows the complete flow from user interaction to database storage. Every step is automatic and requires no manual intervention once deployed.
