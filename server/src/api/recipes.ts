import express from 'express';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import recipeHistory from '../models/RecipeHistory.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req: Request, res: Response) => {
  const { ingredients } = req.body;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Please provide a list of ingredients.' });
  }

  try {
    const prompt = `
    Suggest a list of recipes based on the following ingredients: ${ingredients.join(', ')}.
    Please provide the recipes in JSON format, including the recipe name, ingredients, measurements and instructions.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const result = response.choices[0].message?.content;

    await recipeHistory.create({
      ingredients,
      response: result,
    });

    return res.json({ recipes: result });
  } catch (error) {
    console.error('Error generating recipes:', error);
    return res.status(500).json({ error: 'An error occurred while generating recipes.' });
  }
});

export default router;
