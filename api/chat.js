const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildGeminiRequest(messages, generationConfig) {
  const systemMessages = [];
  const contents = [];

  for (const message of messages) {
    if (!message || typeof message.content !== 'string') {
      continue;
    }

    const text = message.content.trim();
    if (!text) {
      continue;
    }

    if (message.role === 'system') {
      systemMessages.push(text);
      continue;
    }

    const role = message.role === 'assistant'
      ? 'model'
      : message.role === 'user'
        ? 'user'
        : null;

    if (!role) {
      continue;
    }

    const lastContent = contents[contents.length - 1];
    if (lastContent?.role === role) {
      lastContent.parts[0].text += `\n\n${text}`;
      continue;
    }

    contents.push({
      role,
      parts: [{ text }],
    });
  }

  while (contents[0]?.role === 'model') {
    contents.shift();
  }

  const requestBody = {
    contents,
    generationConfig,
  };

  const systemInstruction = systemMessages.join('\n\n').trim();
  if (systemInstruction) {
    requestBody.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  return requestBody;
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map(part => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

function normalizeFinishReason(finishReason) {
  return typeof finishReason === 'string' ? finishReason.toLowerCase() : 'stop';
}

function mapUsageMetadata(usageMetadata) {
  if (!usageMetadata) {
    return undefined;
  }

  return {
    prompt_tokens: usageMetadata.promptTokenCount ?? 0,
    completion_tokens: usageMetadata.candidatesTokenCount ?? 0,
    total_tokens: usageMetadata.totalTokenCount ?? 0,
  };
}

function buildLegacyChatResponse(reply, usageMetadata, finishReason) {
  const responseBody = {
    id: `gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: GEMINI_MODEL,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: reply,
      },
      finish_reason: normalizeFinishReason(finishReason),
    }],
  };

  const usage = mapUsageMetadata(usageMetadata);
  if (usage) {
    responseBody.usage = usage;
  }

  return responseBody;
}

export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing environment variable: API_KEY',
    });
  }

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

    const geminiRequest = buildGeminiRequest(enhancedMessages, {
      temperature: 0.4,
      maxOutputTokens: 1000,
    });

    if (geminiRequest.contents.length === 0) {
      throw new Error('Nie je čo poslať do Gemini API');
    }

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        'x-goog-api-key': API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = extractGeminiText(data);

    if (!reply) {
      const blockReason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      throw new Error(`Gemini API returned no text response${blockReason ? ` (${blockReason})` : ''}`);
    }

    const legacyResponse = buildLegacyChatResponse(
      reply,
      data?.usageMetadata,
      data?.candidates?.[0]?.finishReason,
    );

    legacyResponse._sources = sources;

    res.status(200).json(legacyResponse);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
