// =================== Register Form ===================
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        localStorage.setItem('user', JSON.stringify({ name, email }));
        alert('✅ Registered successfully!');
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
        alert('❌ Registration failed');
    }
});

// =================== Login Form ===================
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.email === email) {
            alert('✅ Login successful!');
            window.location.href = 'pantry.html';
        } else {
            throw new Error('Invalid login');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Login failed');
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
    localStorage.setItem('pantry', JSON.stringify(pantry));
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
            <button class="delete-btn" data-index="${index}">Delete</button>
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
}

// =================== Submit to Recipes ===================
document.getElementById('submit-to-recipes')?.addEventListener('click', () => {
    const pantry = JSON.parse(localStorage.getItem('pantry') || '[]');
    const selected = Array.from(document.querySelectorAll('.select-item:checked')).map(cb => pantry[cb.dataset.index]);
    if (selected.length === 0) return alert('Please select at least one ingredient!');
    localStorage.setItem('selectedIngredients', JSON.stringify(selected));
    window.location.href = 'recipes.html';
});

// =================== Recipes Page ===================
document.addEventListener('DOMContentLoaded', () => {
    displayPantry();

    const selectedIngredients = JSON.parse(localStorage.getItem('selectedIngredients') || '[]');
    const selectedIngredientsDiv = document.getElementById('selected-ingredients');
    const recipeResults = document.getElementById('recipe-results');

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
});
