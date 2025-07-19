// Simulated user database and pantry items using localStorage
const users = JSON.parse(localStorage.getItem('users')) || {};
let selectedIngredients = JSON.parse(localStorage.getItem('selectedIngredients')) || [];

// Helper function to save data to localStorage
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Update Navigation Link State for Recipes
function updateRecipesLink() {
    const recipesLinks = document.querySelectorAll('.nav a[href="recipes.html"]');
    recipesLinks.forEach(link => {
        if (selectedIngredients.length === 0) {
            link.classList.add('disabled');
            link.style.pointerEvents = 'none';
            link.title = 'Please select ingredients from the Pantry first';
        } else {
            link.classList.remove('disabled');
            link.style.pointerEvents = 'auto';
            link.title = '';
        }
    });
}

// Check if user is already logged in and redirect
function checkAuthAndRedirect() {
    const currentUser = localStorage.getItem('currentUser');
    const currentPage = window.location.pathname.split('/').pop();
    if (currentUser && ['index.html', 'register.html', ''].includes(currentPage)) {
        window.location.href = 'pantry.html';
    } else if (!currentUser && !['index.html', 'register.html', ''].includes(currentPage)) {
        document.body.classList.add('redirecting');
        alert('Please log in to access this page.');
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
    }
}

// Run auth check on page load
checkAuthAndRedirect();

// =================== Register Form ===================
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (users[email]) {
            alert('❌ Email already registered');
            return;
        }
        users[email] = { name, password };
        saveToLocalStorage('users', users);
        localStorage.setItem('currentUser', email); // Auto-login after registration
        alert('✅ Registered successfully! Redirecting to Pantry...');
        window.location.href = 'pantry.html';
    } catch (err) {
        console.error(err);
        alert('❌ Registration failed');
    }
});
if (localStorage.getItem('currentUser') && document.getElementById('user-name')) {
    const userEmail = localStorage.getItem('currentUser');
    document.getElementById('user-name').textContent = users[userEmail].name;
}
const loginTime = Date.now();
localStorage.setItem('loginTime', loginTime);
if (Date.now() - localStorage.getItem('loginTime') > 24 * 60 * 60 * 1000) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
}
// =================== Login Form ===================
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const user = users[email];
        if (user && user.password === password) {
            localStorage.setItem('currentUser', email);
            alert('✅ Login successful!');
            window.location.href = 'pantry.html';
        } else {
            throw new Error('Invalid login');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Invalid email or password');
    }
});

// =================== Pantry Form ===================
document.getElementById('pantry-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    const item = {
        ingredient: document.getElementById('ingredient').value,
        quantity: document.getElementById('quantity').value,
        unit: document.getElementById('unit').value,
        category: document.getElementById('category').value,
        expiration: document.getElementById('expiration').value || 'N/A'
    };
    pantry.push(item);
    saveToLocalStorage('pantry', pantry);
    e.target.reset();
    displayPantry();
});

// =================== Display Pantry Items ===================
function displayPantry() {
    const list = document.getElementById('ingredient-list');
    if (!list) return;

    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    list.innerHTML = '';
    pantry.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'ingredient-item';
        li.innerHTML = `
            <div>
                <input type="checkbox" class="select-item" data-index="${index}"/>
                ${item.ingredient} - ${item.quantity}${item.unit} (${item.category}, Expires: ${item.expiration})
            </div>
            <button class="delete-btn" data-index="${index}">Delete🗑</button>
        `;
        list.appendChild(li);
    });

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
            pantry.splice(index, 1);
            localStorage.setItem('pantry', JSON.stringify(pantry));
            displayPantry();
        })
    );

    // Update Recipes link state
    updateRecipesLink();
}

// =================== Submit to Recipes ===================
document.getElementById('submit-to-recipes')?.addEventListener('click', () => {
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    selectedIngredients = Array.from(document.querySelectorAll('.select-item:checked')).map(cb => pantry[cb.dataset.index]);
    if (selectedIngredients.length === 0) return alert('Please select at least one ingredient!');
    saveToLocalStorage('selectedIngredients', selectedIngredients);
    updateRecipesLink();
    window.location.href = 'recipes.html';
});

// =================== Recipes Page ===================
document.addEventListener('DOMContentLoaded', () => {
    displayPantry();

    const selectedIngredientsDiv = document.getElementById('selected-ingredients');
    const recipeResults = document.getElementById('recipe-results');

    // Check if ingredients are selected, otherwise redirect to pantry
    if (window.location.pathname.split('/').pop() === 'recipes.html' && selectedIngredients.length === 0) {
        document.body.classList.add('redirecting');
        alert('Please select ingredients from the Pantry first.');
        setTimeout(() => { window.location.href = 'pantry.html'; }, 500);
        return;
    }

    if (selectedIngredientsDiv) {
        selectedIngredientsDiv.innerHTML = selectedIngredients.length
            ? `<h3>Selected Ingredients</h3><ul>${selectedIngredients.map(i => `<li>${i.ingredient} (${i.quantity}${i.unit})</li>`).join('')}</ul>`
            : '<p>No ingredients selected. Go to Pantry to add and select items.</p>';
    }

    document.getElementById('fetch-recipes')?.addEventListener('click', async () => {
        if (selectedIngredients.length === 0) {
            recipeResults.innerHTML = '<p>Select ingredients from your pantry first!</p>';
            return;
        }

        recipeResults.innerHTML = '<p>🔄 Fetching recipes...</p>';

        try {
            const ingredientsString = selectedIngredients.map(item => `${item.quantity}${item.unit} ${item.ingredient}`).join(', ');

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer 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',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'user',
                            content: `Suggest 3 healthy recipes I can make with these ingredients: ${ingredientsString}. Include ingredients and simple instructions.`
                        }
                    ]
                })
            });

            const data = await response.json();
            const fullText = data.choices?.[0]?.message?.content || 'No recipes found.';
            recipeResults.innerHTML = '';

            const recipeSections = fullText.split(/\*\*Recipe \d+: /).filter(Boolean);

            recipeSections.forEach((section, index) => {
                const titleMatch = section.match(/^(.+?)\*\*/);
                const title = titleMatch ? titleMatch[1].trim() : `Recipe ${index + 1}`;
                const content = section.replace(titleMatch?.[0], '').trim();

                const ingredientsMatch = content.match(/Ingredients:(.+?)Instructions:/s);
                const instructionsMatch = content.match(/Instructions:(.+)/s);

                const ingredientsText = ingredientsMatch?.[1]?.trim() || '';
                const instructionsText = instructionsMatch?.[1]?.trim() || '';

                const ingredients = ingredientsText.split('\n').filter(line => line.trim()).map(i => i.replace(/^- /, '').trim());
                const instructions = instructionsText.split(/\n\d+\.\s+/).filter(Boolean);

                const card = document.createElement('div');
                card.className = 'recipe-card';

                const imageUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(title)}+food`;

                card.innerHTML = `
                    <img class="recipe-img" src="${imageUrl}" alt="${title}" />
                    <div class="recipe-content">
                        <h2>🍽️ ${title}</h2>
                        <h4>🧂 Ingredients</h4>
                        <ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                        <h4>👨‍🍳 Instructions</h4>
                        <ol>${instructions.map(i => `<li>${i.trim()}</li>`).join('')}</ol>
                    </div>
                `;
                recipeResults.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipeResults.innerHTML = '<p>❌ Error fetching recipes. Please try again later.</p>';
        }
    });

    // Update Recipes link state
    updateRecipesLink();
});

// =================== Logout Handling ===================
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedIngredients');
        selectedIngredients = [];
        window.location.href = 'index.html';
    });
                                                           }
