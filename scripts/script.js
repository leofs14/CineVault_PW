const API_KEY = "56c0750b96b29e50462add6f1590b200";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

let movies = [];
let favorites = [];

let genres = [];
let currentGenre = null;
let currentNav = "popular";

// buscar filmes
async function fetchMovies() {
  let url = BASE_URL + "/movie/popular?api_key=" + API_KEY;

  if (currentNav === "top") {
    url = BASE_URL + "/movie/top_rated?api_key=" + API_KEY;
  }

  if (currentNav === "recent") {
    url = BASE_URL + "/movie/now_playing?api_key=" + API_KEY;
  }

  const res = await fetch(url);
  const data = await res.json();

  movies = data.results;
  render();
}

// buscar géneros
async function fetchGenres() {
  const res = await fetch(
    BASE_URL + "/genre/movie/list?api_key=" + API_KEY + "&language=pt-PT"
  );

  const data = await res.json();
  genres = data.genres;

  createGenreButtons();
}

// criar botões de género
function createGenreButtons() {
  const container = document.getElementById("genreContainer");
  container.innerHTML = "";

  // botão TODOS
  const allBtn = document.createElement("button");
  allBtn.textContent = "Todos";
  allBtn.classList.add("genre-btn");

  if (currentGenre === null) {
    allBtn.classList.add("active");
  }

  allBtn.addEventListener("click", function () {
    currentGenre = null;
    render();
    createGenreButtons();
  });

  container.appendChild(allBtn);

  // géneros da API
  for (let i = 0; i < genres.length; i++) {
    const g = genres[i];

    const btn = document.createElement("button");
    btn.textContent = g.name;
    btn.classList.add("genre-btn");

    if (currentGenre === g.id) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", function () {
      currentGenre = g.id;
      render();
      createGenreButtons();
    });

    container.appendChild(btn);
  }
}

// renderizar filmes
function render() {
  const grid = document.getElementById("movieGrid");
  grid.innerHTML = "";

  let lista = [];

  if (currentNav === "favs") {
    for (let i = 0; i < movies.length; i++) {
      if (favorites.includes(movies[i].id)) {
        lista.push(movies[i]);
      }
    }
  } else {
    lista = movies;
  }

  if (currentGenre !== null) {
    let temp = [];

    for (let i = 0; i < lista.length; i++) {
      if (lista[i].genre_ids.includes(currentGenre)) {
        temp.push(lista[i]);
      }
    }

    lista = temp;
  }

  for (let i = 0; i < lista.length; i++) {
    const m = lista[i];

    const card = document.createElement("div");
    card.className = "card";

    if (m.poster_path) {
      const img = document.createElement("img");
      img.src = IMG_URL + m.poster_path;
      img.style.width = "150px";
      card.appendChild(img);
    }

    const title = document.createElement("h3");
    title.textContent = m.title;
    card.appendChild(title);

    const year = document.createElement("p");
    if (m.release_date) {
      year.textContent = m.release_date.slice(0, 4);
    }
    card.appendChild(year);

    const btn = document.createElement("button");

    if (favorites.includes(m.id)) {
      btn.textContent = "♥";
    } else {
      btn.textContent = "♡";
    }

    btn.addEventListener("click", function () {
      toggleFav(m.id);
    });

    card.appendChild(btn);

    grid.appendChild(card);
  }
}

// mudar menu
function setNav(nav) {
  currentNav = nav;
  fetchMovies();
}

// iniciar a app
async function init() {
  await fetchGenres();
  await fetchMovies();
}

init();