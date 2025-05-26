import { Profile } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import { OpenAI } from 'openai';
import recipeHistory from '../models/RecipeHistory.js';

interface Profile {
  _id: string;
  name: string;
  email: string;
  password: string;
  skills: string[];
}
interface ProfileArgs {
  profileId: string;
}
interface AddProfileArgs {
  input:{
    name: string;
    email: string;
    password: string;
  }
}
interface Context {
  user?: Profile;
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is missing from environment variables.');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const resolvers = {
  Query: {
    // existing resolvers...
    profiles: async (): Promise<Profile[]> => {
      return await Profile.find();
    },
    profile: async (_parent: any, { profileId }: ProfileArgs): Promise<Profile | null> => {
      return await Profile.findOne({ _id: profileId });
    },
    me: async (_parent: any, _args: any, context: Context): Promise<Profile | null> => {
      if (context.user) {
        return await Profile.findOne({ _id: context.user._id });
      }
      throw AuthenticationError;
    },

    // AI recipe generator resolver
    generateRecipes: async (_: any, { ingredients }: { ingredients: string[] }) => {
      if (!ingredients || ingredients.length === 0) {
        throw new Error('Please provide a list of ingredients.');
      }

      const prompt = `
        Suggest a list of recipes based on the following ingredients: ${ingredients.join(', ')}.
        Please provide the recipes in JSON format, including the recipe name, ingredients, measurements and instructions.
      `;

      const openai = getOpenAIClient();
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });

      const result = response.choices[0].message?.content;

      await recipeHistory.create({
        ingredients,
        response: result,
      });

      return result || '';
    },
  },

  Mutation: {
    addProfile: async (_parent: any, { input }: AddProfileArgs) => {
      const profile = await Profile.create({ ...input });
      const token = signToken({ _id: profile._id, email: profile.email, username: profile.name });
      return { token, profile };
    },
    login: async (_parent: any, { email, password }: { email: string; password: string }) => {
      const profile = await Profile.findOne({ email });
      if (!profile) throw AuthenticationError;
      const correctPw = await profile.isCorrectPassword(password);
      if (!correctPw) throw AuthenticationError;
      const token = signToken({ _id: profile._id, email: profile.email, username: profile.name });
      return { token, profile };
    },
    removeProfile: async (_parent: any, _args: any, context: Context) => {
      if (context.user) {
        return await Profile.findOneAndDelete({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
  },
};
export default resolvers;