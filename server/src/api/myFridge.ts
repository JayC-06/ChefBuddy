import express from 'express';
import FridgeItem from '../models/fridgeModel.js';
import { Response } from 'express';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

// Get all items in user's fridge
router.get('/', authMiddleware, async (req: any, res: Response) => {
  const items = await FridgeItem.find({ userId: req.user._id });
  res.json(items);
});

// Add an item to fridge
router.post('/', authMiddleware, async (req: any, res: Response) => {
  const { name, quantity } = req.body;
  const item = await FridgeItem.create({
    userId: req.user._id,
    name,
    quantity,
  });
  res.status(201).json(item);
});

// Updating items or changing the quantity 
router.put('/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const updatedItem = await FridgeItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ error: 'Fridge item not found' });
    }
    return res.json(updatedItem);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete items
router.delete('/:id', authMiddleware, async (req: any, res: Response) => {
  const result = await FridgeItem.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!result) return res.status(404).json({ error: 'Item not found' });
  return res.json({ message: 'Deleted' });
});

export default router;