const API_KEY = "56c0750b96b29e50462add6f1590b200";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMG_FACE = "https://image.tmdb.org/t/p/w185";

let movies = [];

// favorites guarda IDs; favMovies guarda os objetos completos dos filmes favoritos
let favorites = JSON.parse(localStorage.getItem("cvFavs") || "[]");
let favMovies  = JSON.parse(localStorage.getItem("cvFavMovies") || "[]");

let genres = [];
let currentGenre = null;
let currentNav = "popular";

let searchQuery = "";
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
  if (val.length === 0) { closeAutocomplete(); clearSearch(); return; }
  if (val.length < 2) return;
  searchDebounceTimer = setTimeout(() => handleSearch(val), 350);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { clearSearch(); closeAutocomplete(); searchInput.blur(); }
  if (e.key === "Enter" && searchInput.value.trim().length > 1) { closeAutocomplete(); commitSearch(searchInput.value.trim()); }
});

searchClear.addEventListener("click", () => { clearSearch(); searchInput.focus(); });
document.addEventListener("click", (e) => { if (!e.target.closest(".search-wrap")) closeAutocomplete(); });

async function handleSearch(query) {
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-PT&query=${encodeURIComponent(query)}&page=1`);
    const data = await res.json();
    showAutocomplete(data.results.slice(0, 6), query);
  } catch (err) { console.error(err); }
}

async function commitSearch(query) {
  searchQuery = query;
  isSearching = true;
  currentGenre = null;
  createGenreButtons();
  updateSectionTitle();
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-PT&query=${encodeURIComponent(query)}&page=1`);
    const data = await res.json();
    movies = data.results;
    render();
  } catch (err) { console.error(err); }
}

function clearSearch() {
  searchInput.value = "";
  searchClear.classList.remove("visible");
  closeAutocomplete();
  if (isSearching) {
    isSearching = false;
    searchQuery = "";
    if (isShowingAll) {
      isShowingAll = false;
      const btn = document.querySelector(".section-action");
      btn.textContent = "ver todos →";
      btn.onclick = loadAllMovies;
    }
    fetchMovies();
  }
}

// ── Autocomplete ───────────────────────────────────────────

function showAutocomplete(results, query) {
  autocomplete.innerHTML = "";
  if (results.length === 0) { closeAutocomplete(); return; }

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
    info.innerHTML = `<div class="ac-title">${m.title}</div><div class="ac-meta">${m.release_date ? m.release_date.slice(0, 4) : "—"}</div>`;
    const score = document.createElement("div");
    score.className = "ac-score";
    score.textContent = m.vote_average ? `★ ${m.vote_average.toFixed(1)}` : "";
    item.appendChild(posterEl);
    item.appendChild(info);
    item.appendChild(score);
    item.addEventListener("click", () => { searchInput.value = m.title; searchClear.classList.add("visible"); closeAutocomplete(); commitSearch(m.title); });
    autocomplete.appendChild(item);
  });

  const divider = document.createElement("div");
  divider.className = "ac-divider";
  autocomplete.appendChild(divider);

  const allItem = document.createElement("div");
  allItem.className = "ac-item";
  allItem.innerHTML = `<div class="ac-external">→</div><div class="ac-info"><div class="ac-title" style="font-size:12px;color:var(--muted)">Ver todos os resultados para "${query}"</div></div>`;
  allItem.addEventListener("click", () => { closeAutocomplete(); commitSearch(query); });
  autocomplete.appendChild(allItem);
  autocomplete.classList.add("open");
}

function closeAutocomplete() {
  autocomplete.classList.remove("open");
  autocomplete.innerHTML = "";
}

// ── Géneros ────────────────────────────────────────────────

async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-PT`);
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
    createGenreButtons();
    if (isShowingAll) { loadAllMovies(); } else { render(); }
  });
  container.appendChild(allBtn);
  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.textContent = g.name;
    btn.classList.add("genre-btn");
    if (currentGenre === g.id) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentGenre = g.id;
      createGenreButtons();
      if (isShowingAll) { loadAllMovies(); } else { render(); }
    });
    container.appendChild(btn);
  });
}

// ── Fetch filmes ───────────────────────────────────────────

async function fetchMovies() {
  if (currentNav === "favs") {
    await fetchFavMovies();
    return;
  }

  let url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT`;
  if (currentNav === "top")    url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-PT`;
  if (currentNav === "recent") url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=pt-PT`;

  const res = await fetch(url);
  const data = await res.json();
  movies = data.results;
  render();
}

// busca os detalhes de cada filme favorito que ainda não estejam em cache
async function fetchFavMovies() {
  // IDs que já temos em cache
  const cachedIds = favMovies.map((m) => m.id);

  // IDs que precisam de ser descarregados
  const toFetch = favorites.filter((id) => !cachedIds.includes(id));

  if (toFetch.length > 0) {
    const fetched = await Promise.all(
      toFetch.map((id) =>
        fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=pt-PT`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    // adicionar ao cache local só os que vieram com sucesso
    fetched.forEach((m) => {
      if (m && m.id) favMovies.push(m);
    });
  }

  // remover do cache filmes que já não estão nos favoritos
  favMovies = favMovies.filter((m) => favorites.includes(m.id));

  // persistir cache
  saveFavMovies();

  // preencher genres_ids a partir de genres (pois /movie/:id devolve genres: [{id,name}] em vez de genre_ids)
  favMovies.forEach((m) => {
    if (!m.genre_ids && m.genres) {
      m.genre_ids = m.genres.map((g) => g.id);
    }
  });

  // usar favMovies como lista principal para o render
  movies = [...favMovies];
  render();
}

// ── Render ─────────────────────────────────────────────────

function render() {
  const grid = document.getElementById("movieGrid");
  grid.innerHTML = "";

  let lista = [...movies];

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

    let genreTag = "";
    if (m.genre_ids && m.genre_ids.length > 0) {
      const g = genres.find((g) => g.id === m.genre_ids[0]);
      if (g) genreTag = `<span class="card-genre-tag">${g.name}</span>`;
    }

    card.innerHTML = `
      <div class="card-poster" title="Ver detalhes">
        ${m.poster_path
          ? `<img src="${IMG_URL}${m.poster_path}" alt="${m.title}" style="width:100%;height:100%;object-fit:cover;display:block;">`
          : `<div class="card-poster-bg" style="background:var(--surface);">
              <svg class="card-poster-icon" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              <span class="card-poster-name">${m.title}</span>
            </div>`
        }
        <div class="card-poster-overlay">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/></svg>
        </div>
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

    card.querySelector(".card-poster").addEventListener("click", () => openModal(m.id));
    card.querySelector(".card-fav-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleFav(m.id); });

    grid.appendChild(card);
  });

  updateFavBtn();
}

// ── Modal ──────────────────────────────────────────────────

const modalOverlay = document.getElementById("modalOverlay");
let currentModalMovieId = null;

document.getElementById("modalClose").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

async function openModal(movieId) {
  currentModalMovieId = movieId;
  document.body.classList.add("modal-open");
  modalOverlay.classList.add("open");

  // reset conteúdo
  document.getElementById("modalBackdrop").style.backgroundImage = "";
  document.getElementById("modalPoster").innerHTML = `<div class="modal-poster-loading"></div>`;
  document.getElementById("modalTitle").textContent = "A carregar…";
  document.getElementById("modalGenres").innerHTML = "";
  document.getElementById("modalMeta").innerHTML = "";
  document.getElementById("modalOverview").textContent = "";
  document.getElementById("modalCast").innerHTML = "";
  document.getElementById("modalCastWrap").style.display = "none";
  updateModalFavBtn(movieId);

  try {
    const [detailRes, creditsRes] = await Promise.all([
      fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-PT`),
      fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=pt-PT`)
    ]);
    const movie = await detailRes.json();
    const credits = await creditsRes.json();

    // backdrop
    if (movie.backdrop_path) {
      document.getElementById("modalBackdrop").style.backgroundImage = `url(${IMG_ORIGINAL}${movie.backdrop_path})`;
    }

    // poster
    const posterEl = document.getElementById("modalPoster");
    if (movie.poster_path) {
      posterEl.innerHTML = `<img src="${IMG_URL}${movie.poster_path}" alt="${movie.title}">`;
    } else {
      posterEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:48px;background:var(--card);border-radius:12px;">🎬</div>`;
    }

    // título
    document.getElementById("modalTitle").textContent = movie.title;

    // géneros
    if (movie.genres && movie.genres.length > 0) {
      document.getElementById("modalGenres").innerHTML = movie.genres
        .map(g => `<span class="modal-genre-tag">${g.name}</span>`)
        .join("");
    }

    // meta
    const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min` : null;
    const score = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const votes = movie.vote_count ? movie.vote_count.toLocaleString("pt-PT") : null;

    document.getElementById("modalMeta").innerHTML = `
      <span class="modal-meta-item">${year}</span>
      ${runtime ? `<span class="modal-meta-sep">·</span><span class="modal-meta-item">${runtime}</span>` : ""}
      ${score ? `<span class="modal-meta-sep">·</span><span class="modal-meta-score">★ ${score}</span>${votes ? `<span class="modal-meta-votes">(${votes} votos)</span>` : ""}` : ""}
    `;

    // sinopse
    document.getElementById("modalOverview").textContent = movie.overview || "Sem sinopse disponível em português.";

    // elenco
    const cast = (credits.cast || []).slice(0, 8);
    if (cast.length > 0) {
      document.getElementById("modalCast").innerHTML = cast.map(p => `
        <div class="cast-item">
          <div class="cast-photo">
            ${p.profile_path
              ? `<img src="${IMG_FACE}${p.profile_path}" alt="${p.name}">`
              : `<div class="cast-photo-placeholder">${p.name.charAt(0)}</div>`
            }
          </div>
          <div class="cast-name">${p.name}</div>
          <div class="cast-char">${p.character || ""}</div>
        </div>
      `).join("");
      document.getElementById("modalCastWrap").style.display = "block";
    }

  } catch (err) {
    console.error("Erro ao carregar detalhe:", err);
    document.getElementById("modalTitle").textContent = "Erro ao carregar";
  }
}

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  currentModalMovieId = null;
}

function updateModalFavBtn(id) {
  const isFav = favorites.includes(id);
  document.getElementById("modalFavIcon").textContent = isFav ? "♥" : "♡";
  document.getElementById("modalFavLabel").textContent = isFav ? "Remover dos favoritos" : "Adicionar aos favoritos";
  document.getElementById("modalFavBtn").classList.toggle("active", isFav);
}

document.getElementById("modalFavBtn").addEventListener("click", () => {
  if (currentModalMovieId === null) return;
  toggleFav(currentModalMovieId);
  updateModalFavBtn(currentModalMovieId);
});

// ── Favoritos ──────────────────────────────────────────────

function toggleFav(id) {
  if (favorites.includes(id)) {
    // remover
    favorites  = favorites.filter((f) => f !== id);
    favMovies  = favMovies.filter((m) => m.id !== id);
  } else {
    // adicionar
    favorites.push(id);
    // tenta encontrar o objeto do filme no array atual
    const found = movies.find((m) => m.id === id);
    if (found && !favMovies.find((m) => m.id === id)) {
      const clone = { ...found };
      if (!clone.genre_ids && clone.genres) clone.genre_ids = clone.genres.map((g) => g.id);
      favMovies.push(clone);
    }
  }

  localStorage.setItem("cvFavs", JSON.stringify(favorites));
  saveFavMovies();

  // se estivermos na aba de favoritos, recarrega a lista
  if (currentNav === "favs") {
    movies = [...favMovies];
  }

  render();
}

function saveFavMovies() {
  try {
    localStorage.setItem("cvFavMovies", JSON.stringify(favMovies));
  } catch (e) {
    // localStorage cheio — guarda só os IDs (já estão guardados)
    console.warn("localStorage cheio, não foi possível guardar cache de filmes.");
  }
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

// ── Título ─────────────────────────────────────────────────

function updateSectionTitle(count) {
  const titleEl = document.getElementById("sectionTitle");
  const countEl = document.getElementById("sectionCount");
  if (isSearching) {
    titleEl.textContent = `Resultados para "${searchQuery}"`;
  } else {
    const titles = { popular: "Filmes populares", top: "Mais votados", recent: "Recentes", favs: "Os meus favoritos" };
    titleEl.textContent = titles[currentNav] || "Filmes";
  }
  if (count !== undefined) countEl.textContent = count > 0 ? `${count} filme${count !== 1 ? "s" : ""}` : "";
}

function setNav(nav) {
  currentNav = nav;
  isSearching = false;
  searchQuery = "";
  // sair do modo "ver todos" se estiver ativo
  if (isShowingAll) {
    isShowingAll = false;
    const btn = document.querySelector(".section-action");
    btn.textContent = "ver todos →";
    btn.onclick = loadAllMovies;
  }
  updateSectionTitle();
  fetchMovies();
}

// ── "Ver todos" ────────────────────────────────────────────

let isShowingAll = false;

document.querySelector(".section-action").addEventListener("click", loadAllMovies);

async function loadAllMovies() {
  isShowingAll = true;

  // botão muda para "← voltar"
  const btn = document.querySelector(".section-action");
  btn.textContent = "← voltar";
  btn.onclick = exitAllMovies;

  // mostrar spinner na grelha
  const grid = document.getElementById("movieGrid");
  grid.innerHTML = `
    <div class="grid-spinner" style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:60px 0;color:var(--muted);font-size:13px;">
      <div class="spinner-ring"></div>
      <span>A carregar todos os filmes…</span>
    </div>`;

  // buscar 5 páginas em paralelo
  const all = await fetchAllPages(5);

  // filtrar por género se selecionado
  let lista = currentGenre !== null
    ? all.filter((m) => m.genre_ids && m.genre_ids.includes(currentGenre))
    : all;

  // ordenar alfabeticamente
  lista.sort((a, b) => a.title.localeCompare(b.title, "pt", { sensitivity: "base" }));

  // atualizar título e contagem
  const genreName = currentGenre ? genres.find((g) => g.id === currentGenre)?.name : null;
  const titleEl = document.getElementById("sectionTitle");
  const countEl = document.getElementById("sectionCount");
  titleEl.textContent = genreName ? `Todos — ${genreName}` : "Todos os filmes";
  countEl.textContent = `${lista.length} filme${lista.length !== 1 ? "s" : ""}`;

  // renderizar diretamente na grelha principal
  movies = lista;
  renderAll(lista);
}

function exitAllMovies() {
  isShowingAll = false;
  const btn = document.querySelector(".section-action");
  btn.textContent = "ver todos →";
  btn.onclick = loadAllMovies;
  fetchMovies();
}

function renderAll(lista) {
  const grid = document.getElementById("movieGrid");
  grid.innerHTML = "";

  if (lista.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.style.gridColumn = "1/-1";
    empty.innerHTML = `
      <div class="empty-icon">🎬</div>
      <div class="empty-title">Sem filmes</div>
      <div class="empty-sub">Nenhum filme encontrado para este género.</div>`;
    grid.appendChild(empty);
    return;
  }

  lista.forEach((m) => {
    const isFav = favorites.includes(m.id);
    const year  = m.release_date ? m.release_date.slice(0, 4) : "—";
    const score = m.vote_average ? m.vote_average.toFixed(1) : null;

    let genreTag = "";
    if (m.genre_ids && m.genre_ids.length > 0) {
      const g = genres.find((g) => g.id === m.genre_ids[0]);
      if (g) genreTag = `<span class="card-genre-tag">${g.name}</span>`;
    }

    const card = document.createElement("div");
    card.className = "movie-card";
    card.setAttribute("role", "listitem");

    card.innerHTML = `
      <div class="card-poster" title="Ver detalhes">
        ${m.poster_path
          ? `<img src="${IMG_URL}${m.poster_path}" alt="${m.title}" style="width:100%;height:100%;object-fit:cover;display:block;">`
          : `<div class="card-poster-bg" style="background:var(--surface);">
              <svg class="card-poster-icon" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              <span class="card-poster-name">${m.title}</span>
            </div>`
        }
        <div class="card-poster-overlay">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/></svg>
        </div>
        ${score ? `<div class="card-score-badge"><span class="badge-star">★</span><span class="badge-score">${score}</span></div>` : ""}
        <button class="card-fav-btn${isFav ? " active" : ""}" aria-label="Favorito">
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

    card.querySelector(".card-poster").addEventListener("click", () => openModal(m.id));
    card.querySelector(".card-fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const id  = m.id;
      toggleFav(id);
      const isFavNow = favorites.includes(id);
      e.currentTarget.textContent = isFavNow ? "♥" : "♡";
      e.currentTarget.classList.toggle("active", isFavNow);
    });

    grid.appendChild(card);
  });

  updateFavBtn();
}

// busca N páginas da categoria atual em paralelo
async function fetchAllPages(n) {
  if (currentNav === "favs") return [...favMovies];

  let endpoint = "popular";
  if (currentNav === "top")    endpoint = "top_rated";
  if (currentNav === "recent") endpoint = "now_playing";

  const requests = [];
  for (let p = 1; p <= n; p++) {
    requests.push(
      fetch(`${BASE_URL}/movie/${endpoint}?api_key=${API_KEY}&language=pt-PT&page=${p}`)
        .then((r) => r.json())
        .then((d) => d.results || [])
        .catch(() => [])
    );
  }

  const pages = await Promise.all(requests);
  const seen = new Set();
  const all  = [];
  pages.flat().forEach((m) => {
    if (!seen.has(m.id)) { seen.add(m.id); all.push(m); }
  });
  return all;
}

// ── Init ───────────────────────────────────────────────────

async function init() {
  updateSectionTitle();
  await fetchGenres();
  await fetchMovies();
  updateFavBtn();
}

init();