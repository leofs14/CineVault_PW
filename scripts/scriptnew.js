import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc,
         deleteDoc, getDoc }                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db   = getFirestore(app);

const API_KEY  = "56c0750b96b29e50462add6f1590b200";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";

let currentUser  = null;
let currentFilme = null;

// ── Auth guard ──────────────────────────────────────────
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
    document.getElementById("user-email").textContent = user.email;
    obterFilmesPopulares()
        .then(filmes => {
            document.querySelector('#count').textContent = `${filmes.length} filmes`;
            filmes.forEach((filme, i) => criarHtmlFilme(filme, i));
        })
        .catch(err => criarHtmlErro(err.message));
});

window.doLogout = () => signOut(auth);

// ── TMDB ────────────────────────────────────────────────
async function obterFilmesPopulares() {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT&page=1`);
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return (await res.json()).results;
}

// ── Movie cards ─────────────────────────────────────────
function criarGrid(container) {
    const grid = document.createElement('div');
    grid.className = 'movie-grid';
    container.replaceChildren(grid);
    return grid;
}

function criarHtmlFilme(filme, indice) {
    const container = document.querySelector('#app');
    const grid      = container.querySelector('.movie-grid') ?? criarGrid(container);
    const card      = document.createElement('div');
    const poster    = document.createElement('div');
    const body      = document.createElement('div');
    const titulo    = document.createElement('div');
    const meta      = document.createElement('div');
    const ano       = document.createElement('span');
    const badge     = document.createElement('div');
    const estrela   = document.createElement('span');
    const nota      = document.createElement('span');
    const cardOverlay = document.createElement('div');

    grid.appendChild(card);
    card.appendChild(poster);
    card.appendChild(body);
    body.appendChild(titulo);
    body.appendChild(meta);
    meta.appendChild(ano);
    poster.appendChild(badge);
    badge.appendChild(estrela);
    badge.appendChild(nota);
    poster.appendChild(cardOverlay);

    card.className        = 'movie-card';
    poster.className      = 'card-poster';
    body.className        = 'card-body';
    titulo.className      = 'card-title';
    meta.className        = 'card-meta';
    badge.className       = 'card-score-badge';
    estrela.className     = 'badge-star';
    nota.className        = 'badge-score';
    cardOverlay.className = 'card-poster-overlay';

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

    estrela.textContent       = '★';
    nota.textContent          = filme.vote_average ? filme.vote_average.toFixed(1) : '—';
    cardOverlay.textContent   = '▶';
    titulo.textContent        = filme.title;
    ano.className             = 'card-year';
    ano.textContent           = filme.release_date?.slice(0, 4) ?? '—';

    card.addEventListener('click', () => {
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }
        mostrarOverlay(filme);
    });
}

// ── Overlay ─────────────────────────────────────────────
async function mostrarOverlay(filme) {
    currentFilme = filme;
    const overlay = document.querySelector('#overlay');

    overlay.querySelector('.overlay-poster').src      = filme.poster_path ? `${IMG_BASE}${filme.poster_path}` : '';
    overlay.querySelector('.overlay-poster').alt      = filme.title;
    overlay.querySelector('.overlay-titulo').textContent  = filme.title;
    overlay.querySelector('.overlay-ano').textContent     = filme.release_date?.slice(0, 4) ?? '—';
    overlay.querySelector('.overlay-nota').textContent    = `★ ${filme.vote_average?.toFixed(1) ?? '—'}`;
    overlay.querySelector('.overlay-sinopse').textContent = filme.overview || 'Sem sinopse disponível.';

    // Verificar se já está nos favoritos
    const favBtn = document.getElementById('overlay-fav-btn');
    favBtn.disabled = true;
    try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid, 'favoritos', String(filme.id)));
        atualizarBotaoFav(favBtn, snap.exists());
    } catch {
        atualizarBotaoFav(favBtn, false);
    }
    favBtn.disabled = false;

    overlay.classList.add('visivel');
}

function fecharOverlay() {
    document.querySelector('#overlay').classList.remove('visivel');
}

function atualizarBotaoFav(btn, ativo) {
    if (ativo) {
        btn.classList.add('ativo');
        btn.textContent = '♥ Guardado';
    } else {
        btn.classList.remove('ativo');
        btn.textContent = '♡ Favorito';
    }
}

async function toggleFavorito() {
    if (!currentUser || !currentFilme) return;
    const favBtn = document.getElementById('overlay-fav-btn');
    favBtn.disabled = true;
    const ref  = doc(db, 'users', currentUser.uid, 'favoritos', String(currentFilme.id));
    const snap = await getDoc(ref);
    if (snap.exists()) {
        await deleteDoc(ref);
        atualizarBotaoFav(favBtn, false);
    } else {
        await setDoc(ref, {
            id:           currentFilme.id,
            title:        currentFilme.title,
            poster_path:  currentFilme.poster_path  ?? null,
            release_date: currentFilme.release_date ?? null,
            vote_average: currentFilme.vote_average ?? null
        });
        atualizarBotaoFav(favBtn, true);
    }
    favBtn.disabled = false;
}

document.querySelector('#overlay').addEventListener('click', fecharOverlay);
document.querySelector('#overlay .overlay-caixa').addEventListener('click', e => e.stopPropagation());
document.querySelector('#overlay .overlay-fechar').addEventListener('click', fecharOverlay);
document.getElementById('overlay-fav-btn').addEventListener('click', toggleFavorito);

// ── Error state ─────────────────────────────────────────
function criarHtmlErro(mensagem) {
    document.querySelector('#app').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div class="empty-title">Erro ao carregar</div>
            <div class="empty-sub">${mensagem}</div>
        </div>`;
}
