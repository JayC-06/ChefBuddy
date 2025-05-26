// import { Request, Response } from 'express';
// import { authenticateToken } from '../utils/auth.js';
// import RecipeHistory from '../models/RecipeHistory.js';
// import router from './recipes.js';

// router.get('/api/history', authenticateToken, async (req: Request, res: Response) => {
//     const userId = (req as any).user?.id;
  
//     try {
//       const history = await RecipeHistory.find({ userId }).sort({ createdAt: -1 });
//       res.json(history);
//     } catch {
//       res.status(500).json({ error: 'Could not fetch user history.' });
//     }
//   });

// router.patch('/api/history/:id/favorite', authenticateToken, async (req: Request, res: Response) => {
//     const userId = (req as any).user?.id;
//     const { id } = req.params;
  
//     try {
//       const recipe = await RecipeHistory.findOneAndUpdate(
//         { _id: id, userId },
//         { favorite: true },
//         { new: true }
//       );
  
//       if (!recipe) return res.status(404).json({ error: 'Recipe not found or unauthorized.' });
//       return res.json(recipe);
//     } catch (error) {
//       return res.status(500).json({ error: 'Could not update favorite.' });
//     }
//   });

//   export default router;