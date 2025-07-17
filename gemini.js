const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class GeminiService {
  constructor(apiKey, model = 'gemini-1.5-flash', systemPrompt = null) {
    this.apiKey = apiKey;
    this.model = model;
    this.systemPrompt = systemPrompt || `You are a helpful AI assistant.`;
  }

  async sendMessage(prompt, context = '') {
    try {
      const fullMessage = context
        ? `Context:\n${context}\n\nQuestion: ${prompt}`
        : prompt;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${this.systemPrompt}\n\n${fullMessage}` }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Response:', response.status, response.statusText);
        console.error('Gemini API Error Body:', errorText);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
    } catch (error) {
      console.error('GeminiService error:', error);
      return 'Gemini API call failed.';
    }
  }
}

module.exports = GeminiService;