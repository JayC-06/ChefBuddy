import mongoose, { Schema, Document } from "mongoose";

export interface IComment {
  username: string;
  text: string;
  createdAt: Date;
}

export interface IRecipeHistory extends Document {
  profile: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
  title: string;
  instructions: string[];
  ingredients: string[];
  favorite: boolean;
  mealType: string;
  createdAt: Date;
  comments: IComment[];
}

const RecipeHistorySchema = new Schema<IRecipeHistory>({
  profile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
  _id: { type: Schema.Types.ObjectId, ref: "_id", auto: true },
  title: { type: String, required: true },
  instructions: [{ type: String, required: true }],
  ingredients: [{ type: String, required: true }],
  favorite: { type: Boolean, default: false },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "dessert"],
    default: "lunch",
  },
  createdAt: { type: Date, default: Date.now },
  comments: [
    {
      username: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model<IRecipeHistory>(
  "RecipeHistory",
  RecipeHistorySchema
);
