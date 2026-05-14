import { initializeApp }           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged,
         signOut }                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBImVbDwiOyzoBmRq1fSFtSIIUg1x1Ub-4",
    authDomain: "cinevault-dd04c.firebaseapp.com",
    projectId: "cinevault-dd04c",
    storageBucket: "cinevault-dd04c.firebasestorage.app",
    messagingSenderId: "834500706718",
    appId: "1:834500706718:web:cb980461b41a355f6a568f"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("user-email").textContent = user.email;
  fetchPopularMovies().then(renderMovies).catch(err => renderError(err.message));
});

window.doLogout = () => signOut(auth);

const API_KEY  = "56c0750b96b29e50462add6f1590b200";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";

async function fetchPopularMovies() {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT&page=1`);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return (await res.json()).results;
}

function createMovieCard(movie, index) {
  const card = document.createElement("div");
  card.className = "movie-card";
  card.style.animationDelay = `${index * 35}ms`;

  const year   = movie.release_date?.slice(0, 4) ?? "—";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";

  const poster = movie.poster_path
    ? `<img src="${IMG_BASE}${movie.poster_path}" alt="${movie.title}" loading="lazy">`
    : `<div class="card-poster-bg">
         <div class="card-poster-icon">🎬</div>
         <div class="card-poster-name">${movie.title}</div>
       </div>`;

  card.innerHTML = `
    <div class="card-poster">
      ${poster}
      <div class="card-score-badge">
        <span class="badge-star">★</span>
        <span class="badge-score">${rating}</span>
      </div>
      <div class="card-poster-overlay">▶</div>
    </div>
    <div class="card-body">
      <div class="card-title">${movie.title}</div>
      <div class="card-meta">
        <span class="card-year">${year}</span>
      </div>
    </div>
  `;

  return card;
}

function renderMovies(movies) {
  document.getElementById("count").textContent = `${movies.length} filmes`;

  const grid = document.createElement("div");
  grid.className = "movie-grid";
  movies.forEach((m, i) => grid.appendChild(createMovieCard(m, i)));

  document.getElementById("app").replaceChildren(grid);
}

function renderError(msg) {
  document.getElementById("app").innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">Erro ao carregar</div>
      <div class="empty-sub">${msg}</div>
    </div>`;
}