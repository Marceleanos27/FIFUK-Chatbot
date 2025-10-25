// ============================================
// CHATBOT WIDGET WITH AUTOMATIC CHAT LOGGING
// ============================================
// This is the complete modified sendMessage() function with the new chat logging feature.
// Place this in your index.html file.

// ============================================
// NEW FUNCTION: Save Chat to API
// ============================================
// This function sends every conversation to your Vercel API endpoint
// It runs automatically after each bot response
async function saveChatToAPI(userMessage, botResponse) {
  try {
    // Get the current website hostname (e.g., "fphil.uniba.sk")
    const website = window.location.hostname;
    
    // Send POST request to your Vercel API endpoint
    // IMPORTANT: Replace with your actual Vercel app URL
    const response = await fetch('https://fifuk-chatbot.vercel.app/api/saveChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: userMessage,    // The user's question
        botResponse: botResponse,    // The bot's answer
        website: website             // Where the chat happened
      })
    });

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    // Log success message (visible in browser console)
    console.log('Chat conversation saved successfully');
  } catch (error) {
    // Handle errors gracefully - log to console but don't interrupt user experience
    // The chatbot continues working even if logging fails
    console.error('Error saving chat to API:', error);
  }
}

// ============================================
// MODIFIED: Main sendMessage Function
// ============================================
// This function now includes automatic chat logging
async function sendMessage() {
  const message = inputField.value.trim();
  if (!message) return;

  appendMessage("Ty", message, "user");
  inputField.value = "";

  chatHistory.push({ role: "user", content: message });

  // Normalizácia textu - odstránenie diakritiky a lowercase
  const normalizedMessage = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // odstráni diakritiku

  // Vždy používaj RAG systém pre odpovede
  appendMessage("FiF UK", '<div class="typing-indicator"><span></span><span></span><span></span></div>', "bot", true);

  try {
    await delay(800);

    // RAG vyhľadávanie relevantného obsahu
    let relevantContent = [];
    let ragContext = '';
    let sources = [];
    let useRAG = false;

    if (ragSystem) {
      relevantContent = ragSystem.searchRelevantContent(message, 5);
      if (relevantContent.length > 0) {
        ragContext = ragSystem.buildContext(relevantContent);
        sources = relevantContent.map(item => item.title);
        useRAG = true;
        console.log('Používam RAG s kontextom:', sources);
      }
    }

    // API volanie s RAG kontextom
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        messages: chatHistory,
        useRAG: useRAG,
        ragContext: ragContext,
        sources: sources
      })
    });

    if (!response.ok) {
     throw new Error(`Chyba ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || "Prepáčte, neviem na to odpovedať.";

    // Kontrola či odpoveď obsahuje nedostatočné informácie
    const isInsufficientAnswer = reply.includes("nemám presné informácie") || 
                                reply.includes("kontaktujte") ||
                                reply.includes("neviem na to odpovedať") ||
                                reply.includes("nemám dostatok informácií");

    // Kontrola či odpoveď obsahuje kontaktné informácie
    const isContactRelated = reply.includes("kontakt") || 
                            reply.includes("telefón") || 
                            reply.includes("email") ||
                            reply.includes("gabriela.bakova@uniba.sk") ||
                            reply.includes("Gabriela Baková") ||
                            sources.some(source => source.toLowerCase().includes("kontakt"));

    removeLastBotMessage();
    appendMessage("FiF UK", reply, "bot", false, false, isInsufficientAnswer || isContactRelated);
    chatHistory.push({ role: "assistant", content: reply });

    // ============================================
    // NEW: Save the conversation to your Vercel API endpoint
    // ============================================
    // This runs after every successful bot response
    // It sends the user's message and bot's reply to be saved in Supabase
    await saveChatToAPI(message, reply);

  } catch (error) {
    console.error("Chyba:", error);
    removeLastBotMessage();
    
    // Fallback pre lokálne testovanie
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      appendMessage("FiF UK", "Na túto otázku neviem dostatočne odpovedať. Pre viac informácií kontaktujte prosím Kanceláriu dekana.", "bot", false, false, true);
    } else {
      appendMessage("FiF UK", `Ups, nastala chyba: ${error.message}`, "bot");
    }
  }
}

// ============================================
// ALSO MODIFIED: Other Functions
// ============================================
// These functions also call saveChatToAPI():
// - handleQuickReplyWithRAG(query)
// - handleTopicClick(item)
// - searchInDatabase(query)
// - showCategoryButtons() [for the Online formulár button]
//
// All follow the same pattern:
// 1. Generate bot response
// 2. Display response to user
// 3. Call: await saveChatToAPI(userQuestion, botAnswer);
