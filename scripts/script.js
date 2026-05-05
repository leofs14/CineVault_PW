const API_KEY = "56c0750b96b29e50462add6f1590b200";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

let movies = [];
let favorites = JSON.parse(localStorage.getItem("cvFavs") || "[]");
let genres = [];
let currentGenre = null;
let currentNav = "popular";

// estado de pesquisa
let searchQuery = "";
let searchResults = [];
let isSearching = false;
let searchDebounceTimer = null;

// ── Navegação ──────────────────────────────────────────────

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    clearSearch();
    setNav(link.dataset.nav);
  });
});

document.getElementById("navFavBtn").addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
  document.querySelector('[data-nav="favs"]').classList.add("active");
  clearSearch();
  setNav("favs");
});

// ── Pesquisa ───────────────────────────────────────────────

const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const autocomplete = document.getElementById("autocomplete");

searchInput.addEventListener("input", () => {
  const val = searchInput.value.trim();
  searchClear.classList.toggle("visible", val.length > 0);

  clearTimeout(searchDebounceTimer);

  if (val.length === 0) {
    closeAutocomplete();
    clearSearch();
    return;
  }

  if (val.length < 2) return;

  searchDebounceTimer = setTimeout(() => {
    handleSearch(val);
  }, 350);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearSearch();
    closeAutocomplete();
    searchInput.blur();
  }
  if (e.key === "Enter" && searchInput.value.trim().length > 1) {
    closeAutocomplete();
    commitSearch(searchInput.value.trim());
  }
});

searchClear.addEventListener("click", () => {
  clearSearch();
  searchInput.focus();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) {
    closeAutocomplete();
  }
});

async function handleSearch(query) {
  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-PT&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    const results = data.results.slice(0, 6);
    showAutocomplete(results, query);
  } catch (err) {
    console.error("Erro na pesquisa:", err);
  }
}

async function commitSearch(query) {
  searchQuery = query;
  isSearching = true;
  currentGenre = null;
  createGenreButtons();
  updateSectionTitle();

  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-PT&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    movies = data.results;
    render();
  } catch (err) {
    console.error("Erro ao pesquisar filmes:", err);
  }
}

function clearSearch() {
  searchInput.value = "";
  searchClear.classList.remove("visible");
  closeAutocomplete();

  if (isSearching) {
    isSearching = false;
    searchQuery = "";
    fetchMovies();
  }
}

// ── Autocomplete ───────────────────────────────────────────

function showAutocomplete(results, query) {
  autocomplete.innerHTML = "";

  if (results.length === 0) {
    closeAutocomplete();
    return;
  }

  const header = document.createElement("div");
  header.className = "ac-header";
  header.textContent = "Resultados";
  autocomplete.appendChild(header);

  results.forEach((m) => {
    const item = document.createElement("div");
    item.className = "ac-item";

    const posterEl = document.createElement("div");
    posterEl.className = "ac-poster";

    if (m.poster_path) {
      const img = document.createElement("img");
      img.src = `https://image.tmdb.org/t/p/w92${m.poster_path}`;
      img.style.cssText = "width:30px;height:44px;object-fit:cover;border-radius:4px;";
      posterEl.appendChild(img);
    } else {
      posterEl.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="color:#555"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`;
    }

    const info = document.createElement("div");
    info.className = "ac-info";

    const title = document.createElement("div");
    title.className = "ac-title";
    title.textContent = m.title;

    const meta = document.createElement("div");
    meta.className = "ac-meta";
    meta.textContent = m.release_date ? m.release_date.slice(0, 4) : "—";

    info.appendChild(title);
    info.appendChild(meta);

    const score = document.createElement("div");
    score.className = "ac-score";
    score.textContent = m.vote_average ? `★ ${m.vote_average.toFixed(1)}` : "";

    item.appendChild(posterEl);
    item.appendChild(info);
    item.appendChild(score);

    item.addEventListener("click", () => {
      searchInput.value = m.title;
      searchClear.classList.add("visible");
      closeAutocomplete();
      commitSearch(m.title);
    });

    autocomplete.appendChild(item);
  });

  // opção "Ver todos os resultados"
  const divider = document.createElement("div");
  divider.className = "ac-divider";
  autocomplete.appendChild(divider);

  const allItem = document.createElement("div");
  allItem.className = "ac-item";
  allItem.innerHTML = `
    <div class="ac-external">→</div>
    <div class="ac-info"><div class="ac-title" style="font-size:12px;color:var(--muted)">Ver todos os resultados para "${query}"</div></div>
  `;
  allItem.addEventListener("click", () => {
    closeAutocomplete();
    commitSearch(query);
  });
  autocomplete.appendChild(allItem);

  autocomplete.classList.add("open");
}

function closeAutocomplete() {
  autocomplete.classList.remove("open");
  autocomplete.innerHTML = "";
}

// ── Géneros ────────────────────────────────────────────────

async function fetchGenres() {
  const res = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-PT`
  );
  const data = await res.json();
  genres = data.genres;
  createGenreButtons();
}

function createGenreButtons() {
  const container = document.getElementById("genreContainer");
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "Todos";
  allBtn.classList.add("genre-btn");
  if (currentGenre === null) allBtn.classList.add("active");
  allBtn.addEventListener("click", () => {
    currentGenre = null;
    render();
    createGenreButtons();
  });
  container.appendChild(allBtn);

  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.textContent = g.name;
    btn.classList.add("genre-btn");
    if (currentGenre === g.id) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentGenre = g.id;
      render();
      createGenreButtons();
    });
    container.appendChild(btn);
  });
}

// ── Fetch de filmes ────────────────────────────────────────

async function fetchMovies() {
  let url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT`;
  if (currentNav === "top") url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-PT`;
  if (currentNav === "recent") url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=pt-PT`;
  if (currentNav === "favs") { render(); return; }

  const res = await fetch(url);
  const data = await res.json();
  movies = data.results;
  render();
}

// ── Render ─────────────────────────────────────────────────

function render() {
  const grid = document.getElementById("movieGrid");
  grid.innerHTML = "";

  let lista = [...movies];

  if (currentNav === "favs" && !isSearching) {
    lista = movies.filter((m) => favorites.includes(m.id));
  }

  if (currentGenre !== null) {
    lista = lista.filter((m) => m.genre_ids && m.genre_ids.includes(currentGenre));
  }

  updateSectionTitle(lista.length);

  if (lista.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-icon">${isSearching ? "🔍" : currentNav === "favs" ? "♡" : "🎬"}</div>
      <div class="empty-title">${isSearching ? "Sem resultados" : currentNav === "favs" ? "Sem favoritos" : "Sem filmes"}</div>
      <div class="empty-sub">${isSearching ? `Nenhum filme encontrado para "${searchQuery}"` : currentNav === "favs" ? "Adiciona filmes aos favoritos para os veres aqui." : "Tenta outra categoria ou género."}</div>
    `;
    grid.appendChild(empty);
    return;
  }

  lista.forEach((m) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.setAttribute("role", "listitem");

    const isFav = favorites.includes(m.id);
    const year = m.release_date ? m.release_date.slice(0, 4) : "—";
    const score = m.vote_average ? m.vote_average.toFixed(1) : null;

    // genre tag — primeiro género do filme
    let genreTag = "";
    if (m.genre_ids && m.genre_ids.length > 0) {
      const g = genres.find((g) => g.id === m.genre_ids[0]);
      if (g) genreTag = `<span class="card-genre-tag">${g.name}</span>`;
    }

    card.innerHTML = `
      <div class="card-poster">
        ${
          m.poster_path
            ? `<img src="${IMG_URL}${m.poster_path}" alt="${m.title}" style="width:100%;height:100%;object-fit:cover;display:block;">`
            : `<div class="card-poster-bg" style="background:var(--surface);">
                <svg class="card-poster-icon" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <span class="card-poster-name">${m.title}</span>
              </div>`
        }
        ${score ? `<div class="card-score-badge"><span class="badge-star">★</span><span class="badge-score">${score}</span></div>` : ""}
        <button class="card-fav-btn${isFav ? " active" : ""}" data-id="${m.id}" aria-label="${isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
          ${isFav ? "♥" : "♡"}
        </button>
      </div>
      <div class="card-body">
        <div class="card-title">${m.title}</div>
        <div class="card-meta">
          <span class="card-year">${year}</span>
          ${genreTag}
        </div>
      </div>
    `;

    card.querySelector(".card-fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFav(m.id);
    });

    grid.appendChild(card);
  });

  updateFavBtn();
}

// ── Favoritos ──────────────────────────────────────────────

function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((f) => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("cvFavs", JSON.stringify(favorites));
  render();
}

function updateFavBtn() {
  const btn = document.getElementById("navFavBtn");
  const badge = document.getElementById("navFavBadge");
  if (favorites.length > 0) {
    btn.classList.add("has-favs");
    badge.style.display = "flex";
    badge.textContent = favorites.length;
  } else {
    btn.classList.remove("has-favs");
    badge.style.display = "none";
  }
}

// ── Título da secção ───────────────────────────────────────

function updateSectionTitle(count) {
  const titleEl = document.getElementById("sectionTitle");
  const countEl = document.getElementById("sectionCount");

  if (isSearching) {
    titleEl.textContent = `Resultados para "${searchQuery}"`;
  } else {
    const titles = {
      popular: "Filmes populares",
      top: "Mais votados",
      recent: "Recentes",
      favs: "Os meus favoritos",
    };
    titleEl.textContent = titles[currentNav] || "Filmes";
  }

  if (count !== undefined) {
    countEl.textContent = count > 0 ? `${count} filme${count !== 1 ? "s" : ""}` : "";
  }
}

// ── Nav ────────────────────────────────────────────────────

function setNav(nav) {
  currentNav = nav;
  isSearching = false;
  searchQuery = "";
  updateSectionTitle();
  fetchMovies();
}

// ── Init ───────────────────────────────────────────────────

async function init() {
  updateSectionTitle();
  await fetchGenres();
  await fetchMovies();
  updateFavBtn();
}

init();