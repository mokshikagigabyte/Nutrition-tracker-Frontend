// Login Form
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Login:', { email, password });
    window.location.href = 'pantry.html';
});

// Register Form
document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Register:', { name, email, password });
    window.location.href = 'index.html';
});

// Pantry Form
document.getElementById('pantry-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ingredient = document.getElementById('ingredient').value;
    const quantity = document.getElementById('quantity').value;
    const unit = document.getElementById('unit').value;
    const category = document.getElementById('category').value;
    const expiration = document.getElementById('expiration').value || 'N/A';

    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    pantry.push({ ingredient, quantity, unit, category, expiration });
    localStorage.setItem('pantry', JSON.stringify(pantry));

    displayPantry();
    e.target.reset();
});

// Display Pantry Items
function displayPantry() {
    const list = document.getElementById('ingredient-list');
    if (!list) return;
    list.innerHTML = '';
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    pantry.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'ingredient-item';
        li.innerHTML = `
            <div>
                <input type="checkbox" class="select-item" data-index="${index}">
                ${item.ingredient} - ${item.quantity}${item.unit} (${item.category}, Expires: ${item.expiration})
            </div>
            <button class="delete-btn" data-index="${index}">Delete</button>
        `;
        list.appendChild(li);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            deletePantryItem(index);
        });
    });
}

// Delete Pantry Item
function deletePantryItem(index) {
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    pantry.splice(index, 1);
    localStorage.setItem('pantry', JSON.stringify(pantry));
    displayPantry();
}

// Submit Selected to Recipes
document.getElementById('submit-to-recipes')?.addEventListener('click', () => {
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    const checkboxes = document.querySelectorAll('.select-item:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
    const selectedItems = selectedIndices.map(index => pantry[index]);

    if (selectedItems.length === 0) {
        alert('Please select at least one ingredient!');
        return;
    }

    localStorage.setItem('selectedIngredients', JSON.stringify(selectedItems));
    window.location.href = 'recipes.html';
});

// Display Selected Ingredients and Fetch Recipes
document.addEventListener('DOMContentLoaded', () => {
    displayPantry();
    const recipeList = document.getElementById('recipe-list');
    const selectedIngredientsDiv = document.getElementById('selected-ingredients');

    if (selectedIngredientsDiv) {
        const selectedIngredients = JSON.parse(localStorage.getItem('selectedIngredients') || '[]');
        if (selectedIngredients.length > 0) {
            selectedIngredientsDiv.innerHTML = `
                <h3>Selected Ingredients</h3>
                <ul>${selectedIngredients.map(item => `<li>${item.ingredient} (${item.quantity}${item.unit})</li>`).join('')}</ul>
            `;
        } else {
            selectedIngredientsDiv.innerHTML = '<p>No ingredients selected. Go to Pantry to add and select items.</p>';
        }
    }
});

// Fetch Recipes
document.getElementById('fetch-recipes')?.addEventListener('click', async () => {
    const pantry = JSON.parse(localStorage.getItem('selectedIngredients') || '[]');
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = '';

    if (pantry.length === 0) {
        recipeList.innerHTML = '<p>Select ingredients from your pantry first!</p>';
        return;
    }

    // Simulate OpenAI API response
    const mockRecipes = [
        { name: 'Chicken Stir-Fry', ingredients: ['Chicken Breast', 'Broccoli', 'Rice'], instructions: 'Cook chicken, add broccoli, serve with rice.' },
        { name: 'Veggie Pasta', ingredients: ['Pasta', 'Tomato', 'Spinach'], instructions: 'Boil pasta, mix with tomato sauce and spinach.' }
    ];

    const ingredientNames = pantry.map(item => item.ingredient.toLowerCase());
    mockRecipes.forEach(recipe => {
        const hasIngredients = recipe.ingredients.some(ing => ingredientNames.includes(ing.toLowerCase()));
        if (hasIngredients) {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h3>${recipe.name}</h3>
                <p><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
                <p><strong>Instructions:</strong> ${recipe.instructions}</p>
            `;
            recipeList.appendChild(card);
        }
    });

    try {
        const response = await fetch('http://localhost:3000/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients: pantry.map(item => `${item.quantity}${item.unit} ${item.ingredient}`) })
        });
        const recipes = await response.json();
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h3>${recipe.name}</h3>
                <p><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
                <p><strong>Instructions:</strong> ${recipe.instructions}</p>
            `;
            recipeList.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipeList.innerHTML = '<p>Error fetching recipes. Please try again later.</p>';
    }

});