const API_KEY = "56c0750b96b29e50462add6f1590b200";
const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NmMwNzUwYjk2YjI5ZTUwNDYyYWRkNmYxNTkwYjIwMCIsIm5iZiI6MTcyNzc4NzQzNi44MjYsInN1YiI6IjY2ZmJmMWFjNDk1NWI0YTIwNmYxN2Y3OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.RnKqZOtIM5K31_UlI_ZAS34SguCrDL8t0IH7-UF-Nes";
const BASE_URL = `https://api.themoviedb.org/3`;
const IMG_URL = "https://image.tmdb.org/t/p/w500";




async function getPopularMovies() {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-PT`);
    const data = await response.json();
    console.log(data.results);
    
    return data;// array de filmes
}

function createHTML(movies) {
    movies.forEach(movie => {

        // container do filme
        let div = document.createElement('div');

        // imagem
        let img = document.createElement('img');
        img.src = IMG_URL + movie.poster_path;

        // título
        let title = document.createElement('p');
        title.textContent = movie.title;

        // adiciona no container
        div.appendChild(img);
        div.appendChild(title);

        // adiciona na página
        document.body.appendChild(div);
    });
}

async function init() {
    let data = await getPopularMovies();
    createHTML(data.results);
}

init();