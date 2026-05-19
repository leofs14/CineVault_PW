import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc,
         getDoc, collection, getDocs }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

let currentUser   = null;
let currentFilme  = null;
let abaAtiva      = 'populares';
let searchDebounce = null;

// ── Auth guard ──────────────────────────────────────────
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
    document.getElementById("user-email").textContent = user.email;
    mostrarPopulares();
});

window.doLogout = () => signOut(auth);

// ── Tab switching ───────────────────────────────────────
document.getElementById('tab-populares').addEventListener('click', () => {
    const hasSearch = searchInput.value.trim().length > 0;
    if (abaAtiva === 'populares' && !hasSearch) return;
    searchInput.value = '';
    searchClear.classList.add('hidden');
    clearTimeout(searchDebounce);
    abaAtiva = 'populares';
    document.getElementById('tab-populares').classList.add('active');
    document.getElementById('tab-favoritos').classList.remove('active');
    document.getElementById('section-title').textContent = 'Filmes Populares';
    mostrarPopulares();
});

document.getElementById('tab-favoritos').addEventListener('click', () => {
    if (abaAtiva === 'favoritos') return;
    searchInput.value = '';
    searchClear.classList.add('hidden');
    clearTimeout(searchDebounce);
    abaAtiva = 'favoritos';
    document.getElementById('tab-favoritos').classList.add('active');
    document.getElementById('tab-populares').classList.remove('active');
    document.getElementById('section-title').textContent = 'Os Meus Favoritos';
    mostrarFavoritos();
});

// ── Search ──────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');

searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    searchClear.classList.toggle('hidden', !q);
    clearTimeout(searchDebounce);
    if (!q) {
        document.getElementById('section-title').textContent =
            abaAtiva === 'favoritos' ? 'Os Meus Favoritos' : 'Filmes Populares';
        abaAtiva === 'favoritos' ? mostrarFavoritos() : mostrarPopulares();
        return;
    }
    searchDebounce = setTimeout(() => pesquisarFilmes(q), 350);
});

searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
    }
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
});

// ── Views ───────────────────────────────────────────────
async function mostrarPopulares() {
    document.querySelector('#app').innerHTML = '';
    try {
        const filmes = await obterFilmesPopulares();
        document.querySelector('#count').textContent = `${filmes.length} filmes`;
        filmes.forEach((filme, i) => criarHtmlFilme(filme, i));
    } catch (err) {
        criarHtmlErro(err.message);
    }
}

async function mostrarFavoritos() {
    if (!currentUser) return;
    const container = document.querySelector('#app');
    container.innerHTML = '';
    try {
        const snap   = await getDocs(collection(db, 'users', currentUser.uid, 'favoritos'));
        const filmes = snap.docs.map(d => d.data());
        document.querySelector('#count').textContent = `${filmes.length} filmes`;
        if (filmes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">♡</div>
                    <div class="empty-title">Sem favoritos ainda</div>
                    <div class="empty-sub">Adiciona filmes aos favoritos para os ver aqui.</div>
                </div>`;
            return;
        }
        filmes.forEach((filme, i) => criarHtmlFilme(filme, i));
    } catch (err) {
        criarHtmlErro(err.message);
    }
}

// ── TMDB ────────────────────────────────────────────────
async function obterFilmesPopulares() {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT&page=1`);
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return (await res.json()).results;
}

async function pesquisarFilmes(query) {
    const app = document.querySelector('#app');
    app.innerHTML = '';
    document.getElementById('section-title').textContent = `Resultados para "${query}"`;
    document.getElementById('count').textContent = '';
    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-PT&query=${encodeURIComponent(query)}&page=1`);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();
        document.getElementById('count').textContent = `${data.results.length} filmes`;
        if (data.results.length === 0) {
            app.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">&#x2205;</div>
                    <div class="empty-title">Sem resultados</div>
                    <div class="empty-sub">Não encontrámos filmes para "${query}".</div>
                </div>`;
            return;
        }
        data.results.forEach((filme, i) => criarHtmlFilme(filme, i));
    } catch (err) {
        criarHtmlErro(err.message);
    }
}

// ── Movie cards ─────────────────────────────────────────
function criarGrid(container) {
    const grid = document.createElement('div');
    grid.className = 'movie-grid';
    container.replaceChildren(grid);
    return grid;
}

function criarHtmlFilme(filme, indice) {
    const container   = document.querySelector('#app');
    const grid        = container.querySelector('.movie-grid') ?? criarGrid(container);
    const card        = document.createElement('div');
    const poster      = document.createElement('div');
    const body        = document.createElement('div');
    const titulo      = document.createElement('div');
    const meta        = document.createElement('div');
    const ano         = document.createElement('span');
    const badge       = document.createElement('div');
    const estrela     = document.createElement('span');
    const nota        = document.createElement('span');
    const cardOverlay = document.createElement('div');
    const quickFavBtn = document.createElement('button');

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
    poster.appendChild(quickFavBtn);

    card.className        = 'movie-card';
    poster.className      = 'card-poster';
    body.className        = 'card-body';
    titulo.className      = 'card-title';
    meta.className        = 'card-meta';
    badge.className       = 'card-score-badge';
    estrela.className     = 'badge-star';
    nota.className        = 'badge-score';
    cardOverlay.className = 'card-poster-overlay';
    quickFavBtn.className = 'card-fav-btn';
    quickFavBtn.title     = 'Adicionar aos favoritos';
    quickFavBtn.innerHTML = '♡';

    card.style.animationDelay = `${indice * 35}ms`;

    if (currentUser) {
        getDoc(doc(db, 'users', currentUser.uid, 'favoritos', String(filme.id)))
            .then(snap => atualizarQuickFavBtn(quickFavBtn, snap.exists()))
            .catch(() => {});
    }

    quickFavBtn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!currentUser) return;
        quickFavBtn.disabled = true;
        const ref  = doc(db, 'users', currentUser.uid, 'favoritos', String(filme.id));
        const snap = await getDoc(ref);
        if (snap.exists()) {
            await deleteDoc(ref);
            atualizarQuickFavBtn(quickFavBtn, false);
            if (abaAtiva === 'favoritos') mostrarFavoritos();
        } else {
            await setDoc(ref, {
                id:           filme.id,
                title:        filme.title,
                poster_path:  filme.poster_path  ?? null,
                release_date: filme.release_date ?? null,
                vote_average: filme.vote_average ?? null,
                overview:     filme.overview     ?? null
            });
            atualizarQuickFavBtn(quickFavBtn, true);
        }
        quickFavBtn.disabled = false;
    });

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

    estrela.textContent     = '★';
    nota.textContent        = filme.vote_average ? filme.vote_average.toFixed(1) : '—';
    cardOverlay.textContent = '▶';
    titulo.textContent      = filme.title;
    ano.className           = 'card-year';
    ano.textContent         = filme.release_date?.slice(0, 4) ?? '—';

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

function atualizarQuickFavBtn(btn, ativo) {
    btn.innerHTML = ativo ? '♥' : '♡';
    btn.classList.toggle('ativo', ativo);
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
        // Se estiver na aba favoritos, fechar e atualizar a lista
        if (abaAtiva === 'favoritos') {
            fecharOverlay();
            mostrarFavoritos();
        }
    } else {
        await setDoc(ref, {
            id:           currentFilme.id,
            title:        currentFilme.title,
            poster_path:  currentFilme.poster_path  ?? null,
            release_date: currentFilme.release_date ?? null,
            vote_average: currentFilme.vote_average ?? null,
            overview:     currentFilme.overview     ?? null
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
