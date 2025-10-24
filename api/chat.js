export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, useRAG = false, ragContext = '', sources = [] } = req.body;

  try {
    let enhancedMessages = [...messages];
    
    // Ak je povolený RAG, pridaj kontext ako samostatnú system správu pred poslednú user správu
    if (useRAG && ragContext) {
      const lastUserIndex = enhancedMessages.length - 1;
      if (enhancedMessages[lastUserIndex] && enhancedMessages[lastUserIndex].role === 'user') {
        // Vlož RAG kontext ako system správu pred poslednú user správu
        enhancedMessages.splice(lastUserIndex, 0, {
          role: 'system',
          content: `Relevantný kontext z databázy:\n${ragContext}\n\nPoužite tento kontext na zodpovedanie nadchádzajúcej otázky používateľa.`
        });
      }
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: enhancedMessages,
        temperature: 0.4,
        max_tokens: 1500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
