import express from 'express';

export const chatbotRouter = express.Router();

chatbotRouter.post('/ask', async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: 'GROQ_API_KEY is not configured' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant for a university complaint system. Help students pick the correct department (e.g., IT, Finance, Registrar, Library) and answer short FAQs. Keep replies concise.',
          },
          { role: 'user', content: question },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Groq error:', text);
      return res.status(500).json({ message: 'Chat service error' });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? 'No answer.';
    res.json({ answer });
  } catch (err) {
    next(err);
  }
});

