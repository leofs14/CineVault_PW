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

async function obterFilmesPopulares() {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT&page=1`);
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return (await res.json()).results;
}

function criarHtmlFilme(filme, indice) {
    const app     = document.querySelector('#app');
    const grid    = app.querySelector('.movie-grid') ?? criarGrid(app);
    const card    = document.createElement('div');
    const poster  = document.createElement('div');
    const body    = document.createElement('div');
    const titulo  = document.createElement('div');
    const meta    = document.createElement('div');
    const ano     = document.createElement('span');
    const badge   = document.createElement('div');
    const estrela = document.createElement('span');
    const nota    = document.createElement('span');
    const overlay = document.createElement('div');

    grid.appendChild(card);
    card.appendChild(poster);
    card.appendChild(body);
    body.appendChild(titulo);
    body.appendChild(meta);
    meta.appendChild(ano);
    poster.appendChild(badge);
    badge.appendChild(estrela);
    badge.appendChild(nota);
    poster.appendChild(overlay);

    card.className    = 'movie-card';
    poster.className  = 'card-poster';
    body.className    = 'card-body';
    titulo.className  = 'card-title';
    meta.className    = 'card-meta';
    badge.className   = 'card-score-badge';
    estrela.className = 'badge-star';
    nota.className    = 'badge-score';
    overlay.className = 'card-poster-overlay';

    card.style.animationDelay = `${indice * 35}ms`;

    if (filme.poster_path) {
        const img   = document.createElement('img');
        img.src     = `${IMG_BASE}${filme.poster_path}`;
        img.alt     = filme.title;
        img.loading = 'lazy';
        poster.insertBefore(img, badge);
    } else {
        const fallback = document.createElement('div');
        fallback.className = 'card-poster-bg';
        fallback.innerHTML = `<div class="card-poster-icon">🎬</div>
                              <div class="card-poster-name">${filme.title}</div>`;
        poster.insertBefore(fallback, badge);
    }

    estrela.textContent = '★';
    nota.textContent    = filme.vote_average ? filme.vote_average.toFixed(1) : '—';
    overlay.textContent = '▶';
    titulo.textContent  = filme.title;
    ano.className       = 'card-year';
    ano.textContent     = filme.release_date?.slice(0, 4) ?? '—';

    card.addEventListener('click', () => mostrarOverlay(filme));
}

function criarGrid(app) {
    const grid = document.createElement('div');
    grid.className = 'movie-grid';
    app.replaceChildren(grid);
    return grid;
}

function mostrarOverlay(filme) {
    const overlay = document.querySelector('#overlay');

    overlay.querySelector('.overlay-poster').src       = filme.poster_path ? `${IMG_BASE}${filme.poster_path}` : '';
    overlay.querySelector('.overlay-poster').alt       = filme.title;
    overlay.querySelector('.overlay-titulo').textContent   = filme.title;
    overlay.querySelector('.overlay-ano').textContent      = filme.release_date?.slice(0, 4) ?? '—';
    overlay.querySelector('.overlay-nota').textContent     = `★ ${filme.vote_average?.toFixed(1) ?? '—'}`;
    overlay.querySelector('.overlay-sinopse').textContent  = filme.overview || 'Sem sinopse disponível.';

    overlay.classList.add('visivel');
}

function fecharOverlay() {
    document.querySelector('#overlay').classList.remove('visivel');
}

document.querySelector('#overlay').addEventListener('click', fecharOverlay);
document.querySelector('#overlay .overlay-caixa').addEventListener('click', e => e.stopPropagation());
document.querySelector('#overlay .overlay-fechar').addEventListener('click', fecharOverlay);

function criarHtmlErro(mensagem) {
    document.querySelector('#app').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div class="empty-title">Erro ao carregar</div>
            <div class="empty-sub">${mensagem}</div>
        </div>`;  
}

obterFilmesPopulares()
    .then(filmes => {
        document.querySelector('#count').textContent = `${filmes.length} filmes`;
        filmes.forEach((filme, i) => criarHtmlFilme(filme, i));
    })
    .catch(err => criarHtmlErro(err.message));
