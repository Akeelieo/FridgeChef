import os
import base64
import requests

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

cloudflare_token = os.getenv("CLOUDFLARE_API_TOKEN")
cloudflare_account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")

model = "@cf/meta/llama-3.2-11b-vision-instruct"

url = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{cloudflare_account_id}/ai/run/{model}"
)

headers = {
    "Authorization": f"Bearer {cloudflare_token}"
}




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "FridgeChef API is working"}


@app.get("/ingredients")
def get_ingredients():
    return {
        "ingredients": [
            "Eggs",
            "Milk",
            "Cheese",
            "Tomatoes"
        ]
    }

@app.post("/analyse")
async def analyse_fridge(file: UploadFile = File(...)):

    # Read the uploaded image
    image_bytes = await file.read()

    # Convert the image to base64
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Create a data URL for Cloudflare
    image_data = f"data:{file.content_type};base64,{base64_image}"

    # Send the image to Cloudflare Workers AI
    response = requests.post(
        url,
        headers=headers,
        json={
            "messages": [
                {
                    "role": "system",
                    "content": "You identify food and drink items visible in photographs."
                },
                {
                    "role": "user",
                    "content": """
Look carefully at the provided image.

Identify every food or drink item that is clearly visible.

Return ONLY a comma-separated list of item names.

Example:
banana, apple, grapes, milk

Do not describe the image.
Do not include shelves, containers, packaging, furniture,
or other non-food objects.
Do not guess items that are not clearly visible.
"""
                }
            ],
            "image": image_data,
            "max_tokens": 100,
            "temperature": 0.1
        }
    )

    # Handle Cloudflare errors
    if response.status_code != 200:
        return {
            "ingredients": [],
            "error": "Image analysis failed"
        }

    # Convert Cloudflare's response to Python
    data = response.json()

    ingredients_text = data["result"]["response"]

    # Turn "banana, apple, grapes" into a Python list
    ingredients = [
        ingredient.strip()
        for ingredient in ingredients_text.split(",")
        if ingredient.strip()
    ]

    return {
        "ingredients": ingredients
    }

@app.post("/recipes")
async def find_recipes(data: dict):

    ingredients = data.get("ingredients", [])

    if not ingredients:
        return {"recipes": []}

    # For our first test, search using the first ingredient
    ingredient = ingredients[0]

    response = requests.get(
        "https://www.themealdb.com/api/json/v1/1/filter.php",
        params={"i": ingredient}
    )

    if response.status_code != 200:
        return {
            "recipes": [],
            "error": "Could not retrieve recipes"
        }

    data = response.json()

    meals = data.get("meals") or []

    # Only return the first 6 recipes
    meals = meals[:6]

    recipes = []

    for meal in meals:
        recipes.append({
            "id": meal["idMeal"],
            "name": meal["strMeal"],
            "image": meal["strMealThumb"]
        })

    return {
        "recipes": recipes
    }