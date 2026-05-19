# CineVault — Catálogo de Filmes

> Projeto de Programação para a Web — LEI 2025/2026

---

## Autores

- **Artiom Gusanu**
- **Leonardo Silva**

---

## Site

[Ver o site no GitHub Pages](https://leofs14.github.io/CineVault_PW/pages/login.html)

---

## Tema e Ideia do Projeto

**CineVault** é um catálogo de filmes interativo onde o utilizador pode explorar os filmes mais populares, ver detalhes de cada filme (sinopse, avaliação, ano) e guardar os seus favoritos para consulta futura, com persistência em base de dados na cloud.

---

## Funcionalidades Implementadas

- Autenticação com email/password (login e criação de conta)
- Auth guard — redireciona para login se o utilizador não estiver autenticado
- Listagem de filmes populares via TMDB API
- Alternância entre tabs: **Populares** e **Favoritos**
- Overlay de detalhes por filme (sinopse, avaliação, ano)
- Sistema de favoritos persistente por utilizador (Firestore)
- Botão de favorito rápido nos cartões e no overlay de detalhes
- Estado vazio ilustrado para favoritos sem filmes
- Logout

## Funcionalidades Previstas

- Reprodução de trailers integrada (YouTube IFrame API)
- Pesquisa de filmes em tempo real
- Filtros por género e ano

---

## APIs Utilizadas

| API | Descrição | Documentação |
|-----|-----------|--------------|
| **TMDB API** | Dados de filmes, géneros, avaliações e imagens | [developers.themoviedb.org](https://developers.themoviedb.org) |
| **Firebase Auth** | Autenticação de utilizadores (email/password) | [firebase.google.com/docs/auth](https://firebase.google.com/docs/auth) |
| **Firebase Firestore** | Persistência de favoritos por utilizador na cloud | [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore) |
| **YouTube IFrame API** | Reprodução de trailers diretamente no site *(previsto)* | [developers.google.com](https://developers.google.com/youtube/iframe_api_reference) |

---

## Estrutura do Projeto

```
CineVault_PW/
├── pages/
│   ├── login.html       # Página de login e registo
│   └── index.html       # Página principal (catálogo + favoritos)
├── scripts/
│   ├── login.js         # Lógica de autenticação Firebase
│   └── scriptnew.js     # Lógica principal (TMDB, favoritos, overlay)
└── styles/
    └── stylenew.css     # Estilos globais
```

---

## Tecnologias

- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase (Auth + Firestore)
- GitHub Pages

---

## Datas

| | |
|---|---|
| **Início** | 4 de Maio de 2026 |
| **Fim** | 29 de Maio de 2026 |
