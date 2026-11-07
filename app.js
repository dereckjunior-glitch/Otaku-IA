const KITSU_API = "https://kitsu.io/api/edge";
const TVMAZE_API = "https://api.tvmaze.com";

// Doramas populares (o TVMaze é um catálogo geral de séries, por isso usamos nomes)
const DORAMAS_POPULARES = [
  "Squid Game",
  "Crash Landing on You",
  "Itaewon Class",
  "Hospital Playlist",
  "Descendants of the Sun",
  "Vincenzo",
  "Extraordinary Attorney Woo",
  "The Glory"
];

const IDIOMAS_DORAMA = ["Korean", "Japanese", "Chinese", "Mandarin", "Thai"];

// Botões de género da página Explorar (slug da Kitsu; "dorama" = lista de doramas)
const GENEROS_CHIPS = [
  { nome: "Todos", slug: "" },
  { nome: "Ação", slug: "action" },
  { nome: "Aventura", slug: "adventure" },
  { nome: "Comédia", slug: "comedy" },
  { nome: "Drama", slug: "drama" },
  { nome: "Fantasia", slug: "fantasy" },
  { nome: "Romance", slug: "romance" },
  { nome: "Terror", slug: "horror" },
  { nome: "Mistério", slug: "mystery" },
  { nome: "Ficção científica", slug: "science-fiction" },
  { nome: "Desporto", slug: "sports" },
  { nome: "Sobrenatural", slug: "supernatural" },
  { nome: "Cotidiano", slug: "slice-of-life" },
  { nome: "Suspense", slug: "thriller" },
  { nome: "🎭 Doramas", slug: "dorama" }
];

const POR_PAGINA = 12;

// Palavras que a Otaku AI reconhece -> categoria da Kitsu
const CATEGORIAS = {
  acao: "action",
  aventura: "adventure",
  comedia: "comedy",
  drama: "drama",
  fantasia: "fantasy",
  terror: "horror",
  misterio: "mystery",
  romance: "romance",
  ficcao: "science-fiction",
  desporto: "sports",
  esporte: "sports",
  sobrenatural: "supernatural",
  cotidiano: "slice-of-life",
  suspense: "thriller"
};

let currentType = "all";
let lista = loadList();
let lastPage = "home";
let homeLoaded = false;
let pedido = 0;
let explorar = null;

const $ = (id) => document.getElementById(id);


/* ===============================
   UTILITÁRIOS
================================ */

function escapeHTML(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanHTML(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function https(url) {
  return String(url || "").replace(/^http:/, "https:");
}

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return await response.json();
}


/* ===============================
   MINHA LISTA (guardada no telemóvel)
================================ */

function loadList() {
  try {
    return JSON.parse(localStorage.getItem("otaku-lista-v2")) || [];
  } catch (e) {
    return [];
  }
}

function saveList() {
  try {
    localStorage.setItem("otaku-lista-v2", JSON.stringify(lista));
  } catch (e) {}
}

function isSaved(key) {
  return lista.some((i) => i.key === key);
}

function toggleSaved(item) {
  const jaTem = isSaved(item.key);

  lista = jaTem
    ? lista.filter((i) => i.key !== item.key)
    : [...lista, item];

  saveList();

  document
    .querySelectorAll(`[data-key="${item.key}"]`)
    .forEach((card) => card.classList.toggle("na-lista", !jaTem));
}


/* ===============================
   ANIMES (Kitsu)
================================ */

function toAnimeItem(item) {
  const a = item.attributes || {};
  const t = a.titles || {};
  const nota = parseFloat(a.averageRating);

  return {
    key: "anime-" + item.id,
    type: "anime",
    title: t.en || t.en_jp || a.canonicalTitle || t.ja_jp || "Anime",
    poster: https(a.posterImage?.large || a.posterImage?.medium),
    description: a.synopsis || "Sinopse não disponível.",
    score: isNaN(nota) ? "N/A" : (nota / 10).toFixed(1),
    episodes: a.episodeCount || "N/A",
    status: a.status || "N/A"
  };
}

async function getAnimePage(query = "", categoria = "", limit = 10, offset = 0) {
  let url = KITSU_API + "/anime?page[limit]=" + limit + "&page[offset]=" + offset;

  if (query) {
    url += "&filter[text]=" + encodeURIComponent(query);
  } else {
    if (categoria) url += "&filter[categories]=" + encodeURIComponent(categoria);
    url += "&sort=-averageRating";
  }

  const result = await getJSON(url);
  const dados = result.data || [];

  return {
    total: dados.length,
    itens: dados.filter((item) => !item.attributes?.nsfw).map(toAnimeItem)
  };
}

async function getAnime(query = "", categoria = "", limit = 10) {
  return (await getAnimePage(query, categoria, limit)).itens;
}


/* ===============================
   DORAMAS (TVMaze)
================================ */

function toShowItem(show) {
  return {
    key: "dorama-" + show.id,
    type: "dorama",
    title: show.name || "Dorama",
    poster: https(show.image?.original || show.image?.medium),
    description: show.summary ? cleanHTML(show.summary) : "Sinopse não disponível.",
    score: show.rating?.average ? String(show.rating.average) : "N/A",
    episodes: "N/A",
    status: show.status || "N/A"
  };
}

async function getDramas(query = "") {
  if (query) {
    const result = await getJSON(
      TVMAZE_API + "/search/shows?q=" + encodeURIComponent(query)
    );

    return result
      .map((x) => x.show)
      .filter((s) => IDIOMAS_DORAMA.includes(s.language))
      .map(toShowItem);
  }

  const respostas = await Promise.allSettled(
    DORAMAS_POPULARES.map((nome) =>
      getJSON(TVMAZE_API + "/singlesearch/shows?q=" + encodeURIComponent(nome))
    )
  );

  return respostas
    .filter((r) => r.status === "fulfilled")
    .map((r) => toShowItem(r.value));
}


/* ===============================
   CARDS E LISTAS
================================ */

function createCard(item) {
  const card = document.createElement("article");
  card.className = "anime-card" + (isSaved(item.key) ? " na-lista" : "");
  card.dataset.key = item.key;

  const tipo = item.type === "anime" ? "ANIME" : "DORAMA";
  const estilo = item.poster
    ? ` style="background-image:url('${escapeHTML(item.poster)}')"`
    : "";

  card.innerHTML = `
    <div class="poster real-poster"${estilo}>${item.poster ? "" : tipo}</div>
    <div class="anime-info">
      <h3>${escapeHTML(item.title)}</h3>
      <p>${tipo}${item.score !== "N/A" ? " • ⭐ " + escapeHTML(item.score) : ""}</p>
    </div>
  `;

  card.addEventListener("click", () => openDetails(item));
  return card;
}

function renderList(id, items, vazio = "Nenhum conteúdo encontrado.") {
  const box = $(id);
  box.innerHTML = "";

  if (!items.length) {
    box.innerHTML = `<div class="error">${vazio}</div>`;
    return;
  }

  items.forEach((item) => box.appendChild(createCard(item)));
}

function showLoading(id, texto) {
  $(id).innerHTML = `<div class="loading">${texto}</div>`;
}

// Mostra o resultado de uma busca (ou o erro real, para facilitar a correção)
function renderResult(id, resultado, vazio) {
  if (resultado.status === "fulfilled") {
    renderList(id, resultado.value, vazio);
    return true;
  }

  console.error(resultado.reason);
  $(id).innerHTML = `
    <div class="error">
      Não foi possível carregar.<br>
      ${escapeHTML(resultado.reason?.message || "")}<br><br>
      Toca em Início para tentar de novo.
    </div>
  `;
  return false;
}


/* ===============================
   PÁGINAS
================================ */

function showPage(nome) {
  ["home", "results", "details", "library", "explore"].forEach((p) => {
    $(p + "-page").hidden = p !== nome;
  });

  if (nome !== "details") lastPage = nome;
  window.scrollTo({ top: 0 });
}

function setNav(i) {
  document
    .querySelectorAll(".bottom-nav button")
    .forEach((b, n) => b.classList.toggle("active", n === i));
}

function goHome() {
  showPage("home");
  setNav(0);
  if (!homeLoaded) loadHome();
}

function goBack() {
  showPage(lastPage);
  if (lastPage === "library") renderLibrary();
}

async function loadHome() {
  showLoading("featured-list", "Carregando animes...");
  showLoading("dorama-list", "Carregando doramas...");

  const [anime, dramas] = await Promise.allSettled([
    getAnime("", "", 6),
    getDramas()
  ]);

  const okAnime = renderResult("featured-list", anime);
  const okDrama = renderResult("dorama-list", dramas);

  homeLoaded = okAnime && okDrama;
}


/* ===============================
   DETALHES
================================ */

function openDetails(item) {
  showPage("details");

  const tipo = item.type === "anime" ? "ANIME" : "DORAMA";
  const desc =
    item.description.length > 700
      ? item.description.slice(0, 700) + "…"
      : item.description;
  const estilo = item.poster
    ? ` style="background-image:url('${escapeHTML(item.poster)}')"`
    : "";

  $("details-content").innerHTML = `
    <button class="back-btn" onclick="goBack()">← Voltar</button>

    <div class="details-top">
      <div class="details-poster real-poster"${estilo}></div>
      <div>
        <h2 class="details-title">${escapeHTML(item.title)}</h2>
        <p class="details-meta">${tipo}</p>
        <p class="details-meta">⭐ Nota: ${escapeHTML(item.score)}</p>
        <p class="details-meta">Episódios: ${escapeHTML(item.episodes)}</p>
        <p class="details-meta">Estado: ${escapeHTML(item.status)}</p>
      </div>
    </div>

    <p class="details-desc">${escapeHTML(desc)}</p>
    <button id="list-btn" class="primary-btn"></button>
  `;

  const botao = $("list-btn");

  const atualizar = () => {
    botao.textContent = isSaved(item.key)
      ? "✅ Na tua lista (remover)"
      : "➕ Adicionar à Minha Lista";
  };

  atualizar();

  botao.addEventListener("click", () => {
    toggleSaved(item);
    atualizar();
  });
}


/* ===============================
   PESQUISA
================================ */

function toggleSearch() {
  const box = $("search-box");
  box.classList.toggle("show");

  if (box.classList.contains("show")) $("search-input").focus();
}

async function performSearch() {
  const query = $("search-input").value.trim();
  if (!query) return;

  const meu = ++pedido;

  showPage("results");
  setNav(1);
  $("results-title").textContent = `🔍 Resultados para "${query}"`;
  showLoading("results-list", "Pesquisando...");

  const tarefas = [];
  if (currentType !== "dorama") tarefas.push(getAnime(query));
  if (currentType !== "anime") tarefas.push(getDramas(query));

  const respostas = await Promise.allSettled(tarefas);
  if (meu !== pedido) return;

  const itens = respostas
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const falhou = respostas.find((r) => r.status === "rejected");

  if (!itens.length && falhou) {
    renderResult("results-list", falhou);
    return;
  }

  renderList("results-list", itens, "Nada encontrado. Experimenta outro nome.");
}

function setupFilters() {
  const filter = $("content-filter");

  filter.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      currentType = button.dataset.type;

      filter
        .querySelectorAll("button")
        .forEach((btn) => btn.classList.remove("filter-active"));

      button.classList.add("filter-active");

      if ($("search-input").value.trim()) performSearch();
    });
  });
}


/* ===============================
   OTAKU AI (recomendações por género)
================================ */

async function askAI() {
  const texto = normalizar($("ai-input").value);
  if (!texto.trim()) return;

  const meu = ++pedido;

  showPage("results");
  setNav(2);
  $("results-title").textContent = "🤖 Animes recomendados para ti";

  const categorias = [
    ...new Set(
      Object.keys(CATEGORIAS)
        .filter((k) => texto.includes(k))
        .map((k) => CATEGORIAS[k])
    )
  ].slice(0, 2);

  if (!categorias.length) {
    renderList(
      "results-list",
      [],
      "Não reconheci nenhum género. Experimenta: ação, comédia, drama, romance, fantasia, terror."
    );
    return;
  }

  showLoading("results-list", "A procurar recomendações...");

  const respostas = await Promise.allSettled(
    categorias.map((c) => getAnime("", c, 8))
  );
  if (meu !== pedido) return;

  const vistos = new Set();
  const itens = respostas
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((i) => !vistos.has(i.key) && vistos.add(i.key))
    .sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));

  const falhou = respostas.find((r) => r.status === "rejected");

  if (!itens.length && falhou) {
    renderResult("results-list", falhou);
    return;
  }

  renderList("results-list", itens, "Não encontrei nada com esses géneros.");
}

function openAI() {
  showPage("home");
  setNav(2);
  if (!homeLoaded) loadHome();

  $("ai-section").scrollIntoView({ behavior: "smooth" });
  $("ai-input").focus();
}


/* ===============================
   OUTROS BOTÕES
================================ */

function openDiscover() {
  openExplore();
}

function startExploring() {
  openExplore();
}


/* ===============================
   EXPLORAR (género + Ver mais)
================================ */

function buildChips() {
  const bar = $("genre-bar");

  GENEROS_CHIPS.forEach((g) => {
    const botao = document.createElement("button");
    botao.textContent = g.nome;
    botao.dataset.slug = g.slug;
    botao.addEventListener("click", () => selectGenre(g.slug));
    bar.appendChild(botao);
  });
}

function openExplore() {
  showPage("explore");
  setNav(1);

  if (!explorar) {
    buildChips();
    selectGenre("");
  }
}

function selectGenre(slug) {
  explorar = { slug, offset: 0, fim: false, carregando: false };

  document
    .querySelectorAll("#genre-bar button")
    .forEach((b) => b.classList.toggle("filter-active", b.dataset.slug === slug));

  loadMore();
}

async function loadMore() {
  const estado = explorar;
  if (!estado || estado.carregando || estado.fim) return;
  estado.carregando = true;

  const primeira = estado.offset === 0;
  const botao = $("more-btn");

  if (primeira) {
    showLoading("explore-list", "Carregando...");
    botao.hidden = true;
  } else {
    botao.disabled = true;
    botao.textContent = "Carregando...";
  }

  let erro = null;
  let itens = [];

  try {
    if (estado.slug === "dorama") {
      itens = await getDramas();
      estado.fim = true;
    } else {
      const pagina = await getAnimePage("", estado.slug, POR_PAGINA, estado.offset);
      itens = pagina.itens;
      estado.offset += POR_PAGINA;
      estado.fim = pagina.total < POR_PAGINA;
    }
  } catch (e) {
    erro = e;
    console.error(e);
  }

  estado.carregando = false;
  if (estado !== explorar) return;

  const box = $("explore-list");
  botao.disabled = false;
  botao.textContent = "Ver mais";

  if (erro) {
    if (primeira) {
      box.innerHTML = `<div class="error">Não foi possível carregar.<br>${escapeHTML(erro.message)}</div>`;
    }
    botao.hidden = primeira;
    return;
  }

  if (primeira) box.innerHTML = "";
  if (primeira && !itens.length) {
    box.innerHTML = `<div class="error">Nada encontrado.</div>`;
  }

  itens.forEach((item) => box.appendChild(createCard(item)));
  botao.hidden = estado.fim;
}

function renderLibrary() {
  renderList(
    "library-list",
    lista,
    "A tua lista está vazia. Abre um anime ou dorama e toca em Adicionar."
  );
}

function openLibrary() {
  showPage("library");
  setNav(3);
  renderLibrary();
}


/* ===============================
   INICIALIZAÇÃO
================================ */

document.addEventListener("DOMContentLoaded", () => {
  setupFilters();

  $("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch();
  });

  $("ai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") askAI();
  });

  loadHome();

  // Permite instalar o app no ecrã inicial (só funciona com o site online, em https)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
