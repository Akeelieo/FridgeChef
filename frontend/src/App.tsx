import { useRef, useState } from 'react'
import { ChefHat } from 'lucide-react'
import './App.css'


function App() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [recipes, setRecipes] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setImage(imageUrl)
      setImageFile(file)
    }
  }

  function removeImage() {
    setImage(null)
    setImageFile(null)
    setIngredients([])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function removeIngredient(ingredientToRemove: string) {
  setIngredients(
    ingredients.filter(
      (ingredient) => ingredient !== ingredientToRemove
    )
  )}

  function addIngredient() {
    const ingredient = newIngredient.trim()

    if (ingredient === '') {
      return
    }

    if (!ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient])
    }

    setNewIngredient('')
  }
  



  async function analyseFridge() {
  if (!imageFile) {
    return
  }

  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await fetch('http://127.0.0.1:8000/analyse', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  setIngredients(data.ingredients)
  }

async function findRecipes() {
  const response = await fetch('http://127.0.0.1:8000/recipes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ingredients: ingredients,
    }),
  })

  const data = await response.json()

  setRecipes(data.recipes)
}

  return (
    <main className="page">

      <section className="hero">

      <div className="brand">
          <ChefHat className="chef-logo" />

          <div className="logo">
            Fridge<span>Chef</span>
          </div>
      </div>

        <h1>
          Turn what's in your fridge
          <br />
          into your next meal.
        </h1>

        <p className="subtitle">
          Upload a photo of your fridge and discover recipes
          you can make with ingredients you already have.
        </p>

        {!image ? (
          <>
            <div
              className="upload-box"
              onClick={openFilePicker}
            >
              <div className="upload-icon">+</div>

              <h2>Upload your fridge</h2>

              <p>Choose a photo to get started</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
          </>
        ) : (
          <div className="preview-container">

            <img
              src={image}
              alt="Uploaded fridge"
              className="fridge-image"
            />

            <div className="image-buttons">
              <button
                className="secondary-button"
                onClick={openFilePicker}
              >
                Change photo
              </button>

              <button
                className="secondary-button"
                onClick={removeImage}
              >
                Remove
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />

            <button
              className="analyse-button"
              onClick={analyseFridge}
            >
              Analyse my fridge
            </button>

            {ingredients.length > 0 && (
                <div className="ingredients-section">
                  <h2>Detected ingredients</h2>

                  <div className="ingredient-list">
                    {ingredients.map((ingredient) => (
                      <div className="ingredient-chip" key={ingredient}>
                        <span>{ingredient}</span>

                        <button
                          className="remove-ingredient"
                          onClick={() => removeIngredient(ingredient)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="add-ingredient">
                    <input
                      type="text"
                      placeholder="Add an ingredient..."
                      value={newIngredient}
                      onChange={(event) => setNewIngredient(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          addIngredient()
                        }
                      }}
                    />

                    <button onClick={addIngredient}>
                      + Add
                    </button>
                  </div>

                  <button
                    className="find-recipes-button"
                    onClick={findRecipes}
                  >
                    Find recipes
                  </button>

                    {recipes.length > 0 && (
                      <div className="recipes-section">
                        <h2>Recipes you can make</h2>

                        {recipes.map((recipe) => (
                          <div className="recipe-card" key={recipe.id}>
                            <img
                              src={recipe.image}
                              alt={recipe.name}
                              className="recipe-image"
                            />

                            <h3>{recipe.name}</h3>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
            )}

      </section>

    </main>
  )
}

export default App