import mongoose from 'mongoose';


interface IFridge extends mongoose.Document {
    userId: mongoose.Schema.Types.ObjectId;
    ingredient: mongoose.Schema.Types.ObjectId;
    addedAt: Date;
}

const fridgeSchema = new mongoose.Schema<IFridge>({
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,},
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    addedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFridge>('Fridge', fridgeSchema);
export { IFridge };

