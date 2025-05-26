import { gql, useLazyQuery } from '@apollo/client';
import { useState } from 'react';

const GENERATE_RECIPES = gql`
  query GenerateRecipes($ingredients: [String!]) {
    generateRecipes(ingredients: $ingredients)
  }
`;

const RecipeGenerator = () => {
  const [ingredient, setIngredient] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [getRecipes, { loading, data, error }] = useLazyQuery(GENERATE_RECIPES);

  const addIngredient = () => {
    const trimmed = ingredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setIngredient('');
  };

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter(i => i !== item));
  };

  const handleSubmit = () => {
  if (ingredients.length === 0) {
    alert('Add at least one ingredient.');
    return;
  }

  getRecipes({ variables: { ingredients } });
};
  const recipes = data?.generateRecipes ? JSON.parse(data.generateRecipes) : null;

  return (
    <div >
      <h1>AI Recipe Generator</h1>

      {/* Ingredient Input */}
      <div>
        <input
          type="text"
          value={ingredient}
          placeholder="Enter an ingredient"
          onChange={(e) => setIngredient(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
        />
        <button
          onClick={addIngredient}
          >
          Add
        </button>
      </div>

      {/* Ingredient List */}
      {ingredients.length > 0 && (
        <div>
          {ingredients.map((item) => (
            <span
              key={item}
              >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}>
        Generate Recipes
      </button>

      {/* Results */}
      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error.message}</p>}
      {recipes && (
        <div className="mt-4">
          {Array.isArray(recipes) ? recipes.map((recipe) => (
            <div>
              <h2>{recipe.title}</h2>
              <p><strong>Ingredients:</strong> {recipe.ingredients.join(', ')}</p>
              <p><strong>Instructions:</strong> {recipe.instructions}</p>
            </div>
          )) : <pre>{JSON.stringify(recipes, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
};

export default RecipeGenerator;
