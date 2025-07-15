// =================== Register Form ===================
document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('https://nutrition-tracker-backend-4.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(res => res.json())
    .then(data => {
        alert('✅ Registered successfully!');
        window.location.href = 'index.html';
    })
    .catch(err => {
        console.error('Register error:', err);
        alert('❌ Registration failed');
    });
});

// =================== Login Form ===================
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('https://nutrition-tracker-backend-4.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    })
    .then(data => {
        alert('✅ Login successful!');
        window.location.href = 'pantry.html';
    })
    .catch(err => {
        console.error('Login error:', err);
        alert('❌ Login failed');
    });
});

// =================== Pantry Form ===================
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

// =================== Display Pantry Items ===================
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

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            deletePantryItem(index);
        });
    });
}

function deletePantryItem(index) {
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    pantry.splice(index, 1);
    localStorage.setItem('pantry', JSON.stringify(pantry));
    displayPantry();
}

// =================== Submit Selected to Recipes ===================
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

// =================== Display Selected Ingredients ===================
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

// =================== Fetch Recipes from Backend ===================
document.getElementById('fetch-recipes')?.addEventListener('click', async () => {
    const pantry = JSON.parse(localStorage.getItem('selectedIngredients') || '[]');
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = '';

    if (pantry.length === 0) {
        recipeList.innerHTML = '<p>Select ingredients from your pantry first!</p>';
        return;
    }

    try {
        const response = await fetch('https://nutrition-tracker-backend-4.onrender.com/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients: pantry.map(item => `${item.quantity}${item.unit} ${item.ingredient}`) })
        });

        const recipes = await response.json();

        if (Array.isArray(recipes)) {
            recipes.forEach(recipe => {
                const card = document.createElement('div');
                card.className = 'recipe-card';
                card.innerHTML = `
                    <h3>${recipe.name}</h3>
                    <p><strong>Ingredients:</strong> ${recipe.ingredients?.join(', ') || 'Not listed'}</p>
                    <p><strong>Instructions:</strong> ${recipe.instructions || 'N/A'}</p>
                `;
                recipeList.appendChild(card);
            });
        } else {
            recipeList.innerHTML = '<p>No recipes found.</p>';
        }

    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipeList.innerHTML = '<p>Error fetching recipes. Please try again later.</p>';
    }
});
