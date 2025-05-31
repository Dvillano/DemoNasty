// This file contains the JavaScript code that interacts with the PokeAPI. It fetches the list of Pokémon and dynamically updates the HTML to display the Pokémon data.

const pokeList = document.getElementById('pokemon-list');
const POKEMONS_PER_PAGE = 20;
let currentPage = 1;
let totalPokemons = 0;

// Crear contenedor de paginación
let pagination = document.getElementById('pagination');
if (!pagination) {
    pagination = document.createElement('div');
    pagination.id = 'pagination';
    pagination.style.textAlign = 'center';
    pagination.style.margin = '20px 0';
    pokeList.parentNode.appendChild(pagination);
}

/**
 * Fetches a list of Pokémon from the PokeAPI based on the specified page number.
 * Calculates the offset using the page number and a constant number of Pokémon per page.
 * Updates the total number of Pokémon, displays the fetched Pokémon, and renders pagination controls.
 * Logs an error message to the console if the fetch operation fails.
 *
 * @param {number} page - The page number to fetch, defaults to 1.
 */

async function fetchPokemon(page = 1) {
    const offset = (page - 1) * POKEMONS_PER_PAGE;
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POKEMONS_PER_PAGE}&offset=${offset}`);
        const data = await response.json();
        totalPokemons = data.count;
        displayPokemon(data.results, offset);
        renderPagination();
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
    }
}

function getPokemonIdFromUrl(url) {
    const match = url.match(/\/pokemon\/(\d+)\//);
    return match ? match[1] : null;
}

function displayPokemon(pokemons, offset = 0) {
    pokeList.innerHTML = '';
    currentPokemons = pokemons; // Guarda la lista actual para el filtro
    pokemons.forEach((pokemon, index) => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        const img = document.createElement('img');
        const pokeId = getPokemonIdFromUrl(pokemon.url) || (offset + index + 1);
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`;
        img.alt = pokemon.name;
        const name = document.createElement('p');
        name.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

        // Botón de favorito
        const favBtn = document.createElement('button');
        favBtn.textContent = '⭐ Favorito';
        favBtn.onclick = (e) => {
            e.stopPropagation(); // Para que no se dispare el evento de la tarjeta
            let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
            if (!favoritos.find(f => f.id === pokeId)) {
                favoritos.push({ id: pokeId, name: pokemon.name });
                localStorage.setItem('favoritos', JSON.stringify(favoritos));
                favBtn.textContent = '✅ Guardado';
                favBtn.disabled = true;
            }
        };

        // Si ya es favorito, deshabilita el botón
        let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        if (favoritos.find(f => f.id === pokeId)) {
            favBtn.textContent = '✅ Guardado';
            favBtn.disabled = true;
        }

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(favBtn);

        card.addEventListener('click', async () => {
            const existing = card.querySelector('.moves-list');
            if (existing) {
                existing.remove();
                return;
            }
            const res = await fetch(pokemon.url);
            const pokeData = await res.json();
            const moves = pokeData.moves.map(m => m.move.name).slice(0, 5);
            const movesList = document.createElement('ul');
            movesList.className = 'moves-list';
            moves.forEach(move => {
                const li = document.createElement('li');
                li.textContent = move;
                movesList.appendChild(li);
            });
            card.appendChild(movesList);
        });

        pokeList.appendChild(card);
    });
}

function renderPagination() {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(totalPokemons / POKEMONS_PER_PAGE);

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPokemon(currentPage);
        }
    };

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPokemon(currentPage);
        }
    };

    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` Página ${currentPage} de ${totalPages} `;

    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
}

document.addEventListener('DOMContentLoaded', () => fetchPokemon(currentPage));


// ...existing code...

// Crear barra de búsqueda
const searchContainer = document.createElement('div');
searchContainer.style.textAlign = 'center';
searchContainer.style.margin = '20px 0';

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.placeholder = 'Buscar Pokémon por nombre o número...';
searchInput.style.padding = '8px';
searchInput.style.width = '220px';
searchInput.style.marginRight = '8px';

const searchButton = document.createElement('button');
searchButton.textContent = 'Buscar';
searchButton.style.padding = '8px 16px';

searchContainer.appendChild(searchInput);
searchContainer.appendChild(searchButton);
pokeList.parentNode.insertBefore(searchContainer, pokeList);

// Función de búsqueda
searchButton.onclick = async () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        fetchPokemon(1);
        return;
    }
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!res.ok) throw new Error('No encontrado');
        const pokeData = await res.json();
        // Mostrar solo el Pokémon encontrado
        displayPokemon([{
            name: pokeData.name,
            url: `https://pokeapi.co/api/v2/pokemon/${pokeData.id}/`
        }]);
        pagination.innerHTML = ''; // Oculta la paginación en búsqueda
    } catch {
        pokeList.innerHTML = '<p style="text-align:center;color:#b91c1c;">Pokémon no encontrado.</p>';
        pagination.innerHTML = '';
    }
};

// Permitir buscar con Enter
searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchButton.onclick();
});

// ...existing code...

let currentPokemons = []; // Guarda los Pokémon de la página actual

// ...existing code for pagination...

// Smart filter automático
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
fetchPokemon(currentPage);
        pagination.style.display = '';
        return;
    }
    // Filtra los Pokémon de la página actual por nombre o número
    const filtered = currentPokemons.filter(pokemon => {
        const pokeId = getPokemonIdFromUrl(pokemon.url);
        return (
            pokemon.name.toLowerCase().includes(query) ||
            (pokeId && pokeId.includes(query))
        );
    });
    displayPokemon(filtered);
    pagination.style.display = 'none'; // Oculta la paginación durante el filtro
});

function mostrarFavoritos() {
    let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
    if (favoritos.length === 0) {
        alert('No tienes favoritos guardados.');
        return;
    }
    let lista = favoritos.map(f => `${f.id} - ${f.name}`).join('\n');
    alert('Tus Pokémon favoritos:\n' + lista);
}