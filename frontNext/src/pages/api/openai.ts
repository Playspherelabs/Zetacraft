// pages/api/generateRecipeNameAndEmoji.ts

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { ingredient1, ingredient2 } = req.body;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a creative assistant that generates fun and unique recipe names along with appropriate emojis." },
        { role: "user", content: `Generate a creative and fun name for a recipe that combines ${ingredient1} and ${ingredient2}. The name should be short and catchy, no more than 3-4 words. Also, suggest 1-3 relevant emojis for this recipe. Respond in the format: Name: [recipe name] | Emojis: [emojis]` }
      ],
      model: "gpt-4",
    });

    const response = completion.choices[0].message.content?.trim();
    const [namePart, emojiPart] = response?.split('|') || [];
    
    const name = namePart?.split(':')[1]?.trim().replace(/"/g, '') || '';
    const emojis = emojiPart?.split(':')[1]?.trim() || '';

    res.status(200).json({ name, emoji: emojis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred', error: (error as Error).message });
  }
}