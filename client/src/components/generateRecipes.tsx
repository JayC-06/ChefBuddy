import { useLazyQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { GENERATE_RECIPES, GET_FAVORITE_RECIPES } from '../utils/queries';
import { SAVE_RECIPE, TOGGLE_FAVORITE } from '../utils/mutations';

// function to generate recipes based on ingredients
interface Recipe {
  _id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
}

const RecipeGenerator = () => {
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [favoritesMap, setFavoritesMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [getRecipes, { loading, error }] = useLazyQuery(GENERATE_RECIPES);
  const [saveRecipe] = useMutation(SAVE_RECIPE);
  const [existingRecipes, setExistingRecipes] = useState<{
    [key: string]: Recipe;
  }>({});

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE, {
    update(cache, { data: { toggleFavorite } }) {
      try {
        const existing = cache.readQuery<{ myRecipeHistory: Recipe[] }>({
          query: GET_FAVORITE_RECIPES,
        });

        if (!existing) return;

        const alreadyFavorited = existing.myRecipeHistory.some(
          (recipe: Recipe) => recipe._id === toggleFavorite._id
        );

        const updatedFavorites = alreadyFavorited
          ? existing.myRecipeHistory.filter(
              (r: Recipe) => r._id !== toggleFavorite._id
            )
          : [...existing.myRecipeHistory, toggleFavorite];

        cache.writeQuery({
          query: GET_FAVORITE_RECIPES,
          data: { myRecipeHistory: updatedFavorites },
        });
      } catch (err) {
        // Cache might be empty — safe to ignore
      }
    },
    onCompleted: (data) => {
      console.log("Toggle favorite mutation completed:", data.toggleFavorite);
    },
    onError: (error) => {
      console.error("Error toggling favorite:", error.message);
    },
  });

  // Function to add an ingredient
  const addIngredient = () => {
    const trimmed = ingredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setIngredient("");
  };

  // Function to remove an ingredient
  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter((i) => i !== item));
  };

  // Function to handle form submission
  const handleSubmit = () => {
    if (ingredients.length === 0) {
      alert("Add at least one ingredient.");

      return;
    }
    console.log("Submitting ingredients:", ingredients);

    getRecipes({ variables: { ingredients } })
      .then((response) => {
        console.log("Recipes fetched:", response.data.generateRecipes);
        const recipes = response.data?.generateRecipes || [];
        if (recipes && recipes.length > 0) {
          recipes.forEach(
            (recipe: {
              category: string;
              title: string;
              ingredients: string[];
              instructions: string;
              _id: string;
            }) => {
              console.log("Saving recipe:", recipe.title);
              saveRecipe({
                variables: {
                  mealType: recipe.category,
                  title: recipe.title,
                  ingredients: recipe.ingredients,
                  instructions: recipe.instructions,
                },
              })
                .then((createdRecipe) => {
                  // console.log('Recipe saved successfully:', recipe.title);
                  setExistingRecipes((prev) => ({
                    ...prev,
                    [createdRecipe.data.saveRecipe._id]:
                      createdRecipe.data.saveRecipe,
                  }));
                })
                .catch((err) => {
                  console.error("Error saving recipe:", err);
                });
            }
          );
        }
      })
      .catch((err) => {
        console.error("Error fetching recipes:", err);
      });
  };
  console.log("Existing Recipes:", existingRecipes);
  
  // Function to toggle favorite status of a recipe
  const handleToggleFavorite = async (recipeId: string) => {
    console.log("Toggling favorite for recipeId:", recipeId);

    // Update the UI optimistically
    setFavoritesMap((prev) => ({
      ...prev,
      [recipeId]: !prev[recipeId],
    }));

    try {
      await toggleFavorite({
        variables: { recipeId },
        context: {
          headers: {
            authorization: localStorage.getItem("id_token") || "",
          },
        },
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);

      // Revert the UI change if there was an error
      setFavoritesMap((prev) => ({
        ...prev,
        [recipeId]: !prev[recipeId],
      }));
    }
  };

  // Render the component and handle user interactions
  return (
    <div>
      {/* Ingredient Input */}
      <div>
        <input
          type="text"
          value={ingredient}
          placeholder="Enter an ingredient"
          onChange={(e) => setIngredient(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIngredient()}
        />
        <button
          onClick={addIngredient}
          style={{
            padding: "2px 8px",
            fontSize: "1.5rem",
            marginLeft: "5px",
          }}
        >
          Add
        </button>
      </div>

      {/* Ingredient List */}
      {ingredients.length > 0 && (
        <div style={{ margin: "10px 0" }}>
          {ingredients.map((item) => (
            <span
              key={item}
              style={{
                display: "inline-block",
                padding: "3px 5px",
                margin: "5px",
                background: "#f0f0f0",
                borderRadius: "12px",
              }}
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                style={{
                  marginLeft: "5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#ff0000",
                }}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        style={{
          padding: "6px 12px",
          fontSize: "1rem",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginTop: "10px",
          transition: "background-color 0.3s",
        }}
      >
        👨‍🍳 Let's Cook 🥄
      </button>

      {/* Results */}
      {loading && <p className="mt-4">Finding recipes...</p>}
      {/* error && <p className="mt-4 text-red-500">Error: {error.message}</p> */}
      {error && (
        <p className="mt-4 text-red-500">
          {error.message.includes("not valid JSON")
            ? `SORRY ! There seems to be a glitch in the matrix! Please remove any weird ingredients and/or resubmit form.`
            : `Error: ${error.message}`}
        </p>
      )}
      {existingRecipes && (
        <div className="mt-4">
          {(Object.values(existingRecipes) as Recipe[]).map((recipe) => (
            <div key={recipe._id}>
              <h2>{recipe.title}</h2>
              <p>
                <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
              </p>
              <p>
                <strong>Instructions:</strong> {recipe.instructions}
              </p>
              <button
                onClick={() => handleToggleFavorite(recipe._id)}
                style={{
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                {favoritesMap[recipe._id] ? "❤️" : "🤍"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeGenerator;

