import mongoose from 'mongoose';


interface IFridge extends mongoose.Document {
    profile: mongoose.Types.ObjectId;
    ingredients: [ mongoose.Schema.Types.ObjectId ];
    addedAt: Date;
}

const fridgeSchema = new mongoose.Schema<IFridge>({
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true }],
    addedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFridge>('Fridge', fridgeSchema);
export { IFridge };

