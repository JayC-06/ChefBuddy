import mongoose from 'mongoose';

interface Ingredient {
    userId: mongoose.Schema.Types.ObjectId;
    name: string;
    category: string;
}

const ingredientSchema = new mongoose.Schema<Ingredient>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: { type: String },
});

const IngredientModel = mongoose.model<Ingredient>('Ingredient', ingredientSchema);
export default IngredientModel;