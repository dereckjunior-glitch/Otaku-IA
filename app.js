const ANILIST_API = "https://graphql.anilist.co";
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

// Botões de género da página Explorar (nome do género no AniList; "dorama" = lista de doramas)
const GENEROS_CHIPS = [
  { nome: "Todos", slug: "" },
  { nome: "📅 Lançamentos", slug: "lancamentos" },
  { nome: "Ação", slug: "Action" },
  { nome: "Aventura", slug: "Adventure" },
  { nome: "Comédia", slug: "Comedy" },
  { nome: "Drama", slug: "Drama" },
  { nome: "Fantasia", slug: "Fantasy" },
  { nome: "Romance", slug: "Romance" },
  { nome: "Terror", slug: "Horror" },
  { nome: "Mistério", slug: "Mystery" },
  { nome: "Ficção científica", slug: "Sci-Fi" },
  { nome: "Desporto", slug: "Sports" },
  { nome: "Sobrenatural", slug: "Supernatural" },
  { nome: "Cotidiano", slug: "Slice of Life" },
  { nome: "Suspense", slug: "Thriller" },
  { nome: "🎭 Doramas", slug: "dorama" }
];

// Filtros da secção Doramas (precisam do servidor com a chave do TMDB)
const PAISES_DORAMA = [
  { nome: "🇰🇷 Coreia", idioma: "ko" },
  { nome: "🇯🇵 Japão", idioma: "ja" },
  { nome: "🇨🇳 China", idioma: "zh" },
  { nome: "🇹🇭 Tailândia", idioma: "th" }
];

const GENEROS_DORAMA = [
  { nome: "Todos", id: "" },
  { nome: "Drama", id: "18" },
  { nome: "Comédia", id: "35" },
  { nome: "Mistério", id: "9648" },
  { nome: "Crime", id: "80" },
  { nome: "Ação e aventura", id: "10759" },
  { nome: "Ficção e fantasia", id: "10765" },
  { nome: "Família", id: "10751" }
];

const POR_PAGINA = 12;

// Palavras que a Otaku AI reconhece -> género do AniList
const CATEGORIAS = {
  acao: "Action",
  aventura: "Adventure",
  comedia: "Comedy",
  drama: "Drama",
  fantasia: "Fantasy",
  terror: "Horror",
  misterio: "Mystery",
  romance: "Romance",
  ficcao: "Sci-Fi",
  desporto: "Sports",
  esporte: "Sports",
  sobrenatural: "Supernatural",
  cotidiano: "Slice of Life",
  suspense: "Thriller"
};

// Traduções para a página de detalhes
const GENERO_PT = {
  Action: "Ação", Adventure: "Aventura", Comedy: "Comédia", Drama: "Drama",
  Fantasy: "Fantasia", Horror: "Terror", Mystery: "Mistério", Romance: "Romance",
  "Science Fiction": "Ficção científica", Sports: "Desporto",
  Supernatural: "Sobrenatural", "Slice of Life": "Cotidiano", Thriller: "Suspense",
  Psychological: "Psicológico", Crime: "Crime", Family: "Família", Music: "Música",
  Medical: "Médico", War: "Guerra", History: "História", Military: "Militar",
  Mecha: "Mecha", Magic: "Magia", School: "Escola", "School Life": "Vida escolar",
  "Sci-Fi": "Ficção científica", "Mahou Shoujo": "Mahou shoujo", Ecchi: "Ecchi"
};

const ESTADO_PT = {
  finished: "Finalizado", current: "Em exibição", upcoming: "Em breve",
  tba: "Por anunciar", unreleased: "Por lançar",
  Ended: "Terminado", Running: "Em exibição",
  "To Be Determined": "Por definir", "In Development": "Em desenvolvimento",
  "Returning Series": "Em exibição", Canceled: "Cancelado",
  "In Production": "Em produção", Planned: "Planeado",
  FINISHED: "Finalizado", RELEASING: "Em exibição", NOT_YET_RELEASED: "Em breve",
  CANCELLED: "Cancelado", HIATUS: "Em pausa"
};

const TIPO_PT = {
  TV: "Série", movie: "Filme", OVA: "OVA", ONA: "ONA", special: "Especial", music: "Música", TV_SHORT: "Série curta", MOVIE: "Filme", SPECIAL: "Especial", MUSIC: "Música"
};

// Estados da Minha Lista e abas da página
const ESTADOS_LISTA = [
  { id: "quero", nome: "🕒 Quero ver" },
  { id: "vendo", nome: "▶️ A ver" },
  { id: "concluido", nome: "✅ Concluído" }
];

const ABAS_LISTA = [
  { id: "todos", nome: "Todos" },
  { id: "quero", nome: "🕒 Quero ver" },
  { id: "vendo", nome: "▶️ A ver" },
  { id: "concluido", nome: "✅ Concluídos" },
  { id: "historico", nome: "🕘 Histórico" }
];

const MAX_HISTORICO = 30;

let currentType = "all";
let lista = loadList();
let historico = loadHistory();
let abaLista = "todos";
let lastPage = "home";
let homeLoaded = false;
let pedido = 0;
let explorar = null;
let filtroDorama = { idioma: "ko", genero: "" };
let tmdbIndisponivel = false;   // vira true se o servidor não tiver a chave do TMDB ou falhar
let chat = [];
let chatOcupado = false;
let chatAviso = "";

const SUGESTOES_CHAT = [
  "Algo parecido com Death Note",
  "Anime curto para o fim de semana",
  "Dorama romântico e leve"
];

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

// O servidor (Cloudflare Worker) é configurado no arquivo config.js
function temServidor() {
  return typeof IA_URL !== "undefined" && String(IA_URL).startsWith("https://");
}

function servidorUrl(caminho) {
  return String(IA_URL).replace(/\/+$/, "") + caminho;
}

// Título "base" (sem "Season 2", "Part 2"...) para esconder temporadas repetidas
function baseTitulo(titulo) {
  return normalizar(titulo)
    .replace(/\b(\d+(st|nd|rd|th)|first|second|third|final)\s+season\b/g, "")
    .replace(/\bseason\s*\d+\b/g, "")
    .replace(/\b(part|cour)\s*\d+\b/g, "")
    .replace(/\b(ii|iii|iv)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function semRepetidos(itens, vistos = new Set()) {
  return itens.filter((i) => {
    const base = baseTitulo(i.title);
    if (vistos.has(base)) return false;
    vistos.add(base);
    return true;
  });
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

function estadoDe(key) {
  return lista.find((i) => i.key === key)?.estado || "quero";
}

// Atualiza o selo (✅ 🕒 ▶️) de todos os cards deste título que estão na tela
function atualizarCards(key) {
  const salvo = isSaved(key);

  document.querySelectorAll(`[data-key="${key}"]`).forEach((card) => {
    card.classList.toggle("na-lista", salvo);
    card.dataset.estado = salvo ? estadoDe(key) : "";
  });
}

function toggleSaved(item) {
  const jaTem = isSaved(item.key);

  lista = jaTem
    ? lista.filter((i) => i.key !== item.key)
    : [...lista, { ...item, estado: "quero" }];

  saveList();
  atualizarCards(item.key);
}

function definirEstado(item, estado) {
  const salvo = lista.find((i) => i.key === item.key);
  if (!salvo) return;

  salvo.estado = estado;
  saveList();
  atualizarCards(item.key);
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("otaku-historico-v1")) || [];
  } catch (e) {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem("otaku-historico-v1", JSON.stringify(historico));
  } catch (e) {}
}

// O título que abriste fica no topo do histórico (sem repetidos)
function registrarHistorico(item) {
  historico = [{ ...item }, ...historico.filter((i) => i.key !== item.key)].slice(0, MAX_HISTORICO);
  saveHistory();
}

function limparHistorico() {
  historico = [];
  saveHistory();
  renderLibrary();
}


/* ===============================
   ANIMES (AniList)
================================ */

const ANILIST_QUERY = `
query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort], $minPop: Int, $status: MediaStatus) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(
      type: ANIME
      isAdult: false
      search: $search
      genre: $genre
      sort: $sort
      popularity_greater: $minPop
      status: $status
      format_in: [TV, TV_SHORT, MOVIE, OVA, ONA]
    ) {
      id
      title { romaji english }
      coverImage { large }
      description(asHtml: false)
      averageScore
      episodes
      duration
      status
      format
      genres
      seasonYear
      startDate { year }
      trailer { id site }
      nextAiringEpisode { episode airingAt }
    }
  }
}`;

// Sinopse do AniList: tira etiquetas HTML e partes escondidas (spoilers)
function limparDescricao(texto) {
  if (!texto) return "Sinopse não disponível.";

  const limpo = cleanHTML(texto.replace(/<br\s*\/?>/gi, "\n"))
    .replace(/~![\s\S]*?!~/g, "")
    .trim();

  return limpo || "Sinopse não disponível.";
}

// "Ep. 5 • em 2d 3h" (vazio se não houver próximo episódio ou se ele já saiu)
function textoProximo(p) {
  if (!p || !p.quando) return "";

  const min = Math.round((p.quando * 1000 - Date.now()) / 60000);
  if (min <= 0) return "";

  const dias = Math.floor(min / 1440);
  const horas = Math.floor((min % 1440) / 60);
  const resto = min % 60;

  const quando =
    dias > 0 ? dias + "d " + horas + "h" : horas > 0 ? horas + "h " + resto + "min" : resto + "min";

  return "Ep. " + p.ep + " • em " + quando;
}

function toAnilistItem(m) {
  const nota = Number(m.averageScore);

  return {
    key: "anime-al-" + m.id,
    type: "anime",
    title: m.title?.english || m.title?.romaji || "Anime",
    poster: https(m.coverImage?.large),
    description: limparDescricao(m.description),
    score: nota > 0 ? (nota / 10).toFixed(1) : "N/A",
    episodes: m.episodes || "N/A",
    status: m.status || "N/A",
    year: String(m.seasonYear || m.startDate?.year || ""),
    subtype: m.format || "",
    runtime: m.duration || "",
    trailer:
      m.trailer?.site === "youtube" && m.trailer?.id
        ? "https://www.youtube.com/watch?v=" + m.trailer.id
        : "",
    genres: (m.genres || []).map((g) => GENERO_PT[g] || g).slice(0, 5),
    proximo: m.nextAiringEpisode
      ? { ep: m.nextAiringEpisode.episode, quando: m.nextAiringEpisode.airingAt }
      : null
  };
}

async function anilist(variaveis) {
  const resposta = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: variaveis })
  });

  const json = await resposta.json().catch(() => ({}));

  if (!resposta.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || "AniList HTTP " + resposta.status);
  }

  return json.data.Page;
}

async function getAnimePage(query = "", categoria = "", limit = 10, offset = 0, extra = {}) {
  const variaveis = {
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
    sort: [query ? "SEARCH_MATCH" : "SCORE_DESC"]
  };

  if (query) variaveis.search = query;
  else variaveis.minPop = 30000;          // só animes conhecidos, para a lista não ter títulos obscuros
  if (categoria) variaveis.genre = categoria;

  // Lançamentos: animes que estão a ser exibidos agora, dos mais populares
  if (extra.emExibicao) {
    variaveis.status = "RELEASING";
    variaveis.sort = ["POPULARITY_DESC"];
    delete variaveis.minPop;
  }

  const pagina = await anilist(variaveis);
  const media = pagina.media || [];

  return {
    total: media.length,
    temMais: Boolean(pagina.pageInfo?.hasNextPage),
    itens: media.map(toAnilistItem)
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
    status: show.status || "N/A",
    year: show.premiered ? show.premiered.slice(0, 4) : "",
    subtype: "TV",
    network: show.network?.name || show.webChannel?.name || "",
    genres: (show.genres || []).map((g) => GENERO_PT[g] || g).slice(0, 5)
  };
}

async function getDoramasTmdb({ pagina = 1, idioma = "ko", genero = "", q = "" } = {}) {
  const params = new URLSearchParams({ pagina, idioma });
  if (genero) params.set("genero", genero);
  if (q) params.set("q", q);

  const resposta = await fetch(servidorUrl("/dorama?" + params.toString()));
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.detalhe || dados.erro || "HTTP " + resposta.status);

  return { itens: dados.itens || [], totalPaginas: dados.total_paginas || 1 };
}

async function getDramas(query = "") {
  if (temServidor() && !tmdbIndisponivel) {
    try {
      const r = await getDoramasTmdb({ q: query });
      return query ? r.itens.slice(0, 12) : r.itens.slice(0, 9);
    } catch (e) {
      console.error("TMDB falhou, a usar a lista de reserva:", e);
      tmdbIndisponivel = true;
    }
  }

  return getDramasTvmaze(query);
}

async function getDramasTvmaze(query = "") {
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
  card.dataset.estado = isSaved(item.key) ? estadoDe(item.key) : "";

  const tipo = item.type === "anime" ? "ANIME" : "DORAMA";
  const prox = textoProximo(item.proximo);
  const estilo = item.poster
    ? ` style="background-image:url('${escapeHTML(item.poster)}')"`
    : "";

  card.innerHTML = `
    <div class="poster real-poster"${estilo}>${item.poster ? "" : tipo}</div>
    <div class="anime-info">
      <h3>${escapeHTML(item.title)}</h3>
      <p>${tipo}${item.score !== "N/A" ? " • ⭐ " + escapeHTML(item.score) : ""}${prox ? "<br>📅 " + escapeHTML(prox) : ""}</p>
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
  ["home", "results", "details", "library", "explore", "ai"].forEach((p) => {
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
  showLoading("airing-list", "Carregando lançamentos...");

  const [anime, dramas, emExibicao] = await Promise.allSettled([
    getAnime("", "", 9).then((a) => semRepetidos(a).slice(0, 6)),
    getDramas(),
    getAnimePage("", "", 9, 0, { emExibicao: true }).then((p) => semRepetidos(p.itens).slice(0, 6))
  ]);

  const okAnime = renderResult("featured-list", anime);
  const okDrama = renderResult("dorama-list", dramas);
  const okExibicao = renderResult("airing-list", emExibicao);

  homeLoaded = okAnime && okDrama && okExibicao;
}


/* ===============================
   DETALHES
================================ */

function openDetails(item) {
  showPage("details");
  registrarHistorico(item);
  renderDetails(item);
  enriquecerDorama(item);
}

// Doramas do TMDB: busca episódios, estado, canal e trailer ao abrir os detalhes
async function enriquecerDorama(item) {
  if (item.type !== "dorama" || !item.tmdbId || item.detalhado || !temServidor()) return;

  try {
    const resposta = await fetch(servidorUrl("/dorama/" + item.tmdbId));
    const extra = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(extra.detalhe || extra.erro || "HTTP " + resposta.status);

    Object.assign(item, extra, { detalhado: true });

    const salvo = lista.find((i) => i.key === item.key);
    if (salvo) {
      Object.assign(salvo, extra, { detalhado: true });
      saveList();
    }

    if (!$("details-page").hidden && $("details-content").dataset.key === item.key) {
      renderDetails(item);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderDetails(item) {
  $("details-content").dataset.key = item.key;

  const tipo = item.type === "anime" ? "ANIME" : "DORAMA";
  const subtipo = TIPO_PT[item.subtype] || "";
  const linhas = [
    subtipo ? tipo + " • " + subtipo : tipo,
    "⭐ Nota: " + item.score,
    item.year ? "📅 Ano: " + item.year : "",
    item.episodes !== "N/A"
      ? "🎞️ Episódios: " + item.episodes + (item.runtime ? " (" + item.runtime + " min)" : "")
      : "",
    item.network ? "📺 " + item.network : "",
    "Estado: " + (ESTADO_PT[item.status] || item.status),
    textoProximo(item.proximo) ? "📅 Próximo: " + textoProximo(item.proximo) : "",
    item.genres?.length ? "🏷️ " + item.genres.join(", ") : ""
  ].filter(Boolean);
  const trailer =
    item.trailer ||
    "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(item.title + " trailer");
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
        ${linhas.map((l) => `<p class="details-meta">${escapeHTML(l)}</p>`).join("")}
      </div>
    </div>

    <p class="details-desc">${escapeHTML(desc)}</p>
    <div class="details-actions">
      <a class="trailer-btn" href="${escapeHTML(trailer)}" target="_blank" rel="noopener">▶ Trailer</a>
      <button id="list-btn" class="primary-btn"></button>
    </div>
    <div id="status-bar" class="filters" hidden>
      ${ESTADOS_LISTA.map((e) => `<button data-estado="${e.id}">${e.nome}</button>`).join("")}
    </div>
  `;

  const botao = $("list-btn");

  const barra = $("status-bar");

  const atualizar = () => {
    const salvo = isSaved(item.key);
    const atual = salvo ? estadoDe(item.key) : "";

    botao.textContent = salvo ? "🗑️ Remover da lista" : "➕ Adicionar à Minha Lista";
    barra.hidden = !salvo;

    barra
      .querySelectorAll("button")
      .forEach((b) => b.classList.toggle("filter-active", b.dataset.estado === atual));
  };

  atualizar();

  botao.addEventListener("click", () => {
    toggleSaved(item);
    atualizar();
  });

  barra.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      definirEstado(item, b.dataset.estado);
      atualizar();
    })
  );
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

  const ordenados = respostas
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));
  const itens = semRepetidos(ordenados);

  const falhou = respostas.find((r) => r.status === "rejected");

  if (!itens.length && falhou) {
    renderResult("results-list", falhou);
    return;
  }

  renderList("results-list", itens, "Não encontrei nada com esses géneros.");
}

function openAI() {
  showPage("ai");
  setNav(2);
  renderChat();
}


/* ===============================
   CHAT COM A IA (via servidor Cloudflare)
================================ */

function renderChat(pensando = false) {
  const log = $("chat-log");

  let html = "";

  if (!chat.length) {
    html += `<div class="chat-msg ia">Olá! Sou a Otaku AI 👋 Diz-me o que gostas de ver e eu recomendo animes e doramas.</div>`;
    html += `<div class="chat-sugestoes">${SUGESTOES_CHAT.map(
      (s) => `<button data-sugestao="${escapeHTML(s)}">${escapeHTML(s)}</button>`
    ).join("")}</div>`;
  }

  chat.forEach((m) => {
    const classe = m.role === "user" ? "eu" : "ia";
    html += `<div class="chat-msg ${classe}">${escapeHTML(m.content).replace(/\n/g, "<br>")}</div>`;
  });

  if (pensando) html += `<div class="chat-msg ia">A pensar...</div>`;
  if (chatAviso) html += `<div class="chat-aviso">${escapeHTML(chatAviso)}</div>`;

  log.innerHTML = html;

  log.querySelectorAll("[data-sugestao]").forEach((b) =>
    b.addEventListener("click", () => sendChat(b.dataset.sugestao))
  );

  log.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function sendChat(textoPronto) {
  const input = $("chat-input");
  const texto = String(textoPronto || input.value).trim().slice(0, 500);
  if (!texto || chatOcupado) return;

  if (!temServidor()) {
    chatAviso = "A IA ainda não está ligada: falta colocar o endereço do servidor no arquivo config.js.";
    renderChat();
    return;
  }

  chatOcupado = true;
  chatAviso = "";
  input.value = "";
  chat.push({ role: "user", content: texto });
  renderChat(true);

  try {
    const resposta = await fetch(IA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensagens: chat.slice(-10),
        lista: lista.slice(0, 15).map((i) => i.title)
      })
    });

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.detalhe || dados.erro || "HTTP " + resposta.status);

    chat.push({ role: "assistant", content: dados.resposta });
  } catch (e) {
    console.error(e);
    chat.pop();            // tira a pergunta que falhou e devolve o texto ao campo
    input.value = texto;
    chatAviso = "Não consegui falar com a IA. " + e.message;
  }

  chatOcupado = false;
  renderChat();
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

function buildDoramaBars() {
  PAISES_DORAMA.forEach((p) => {
    const botao = document.createElement("button");
    botao.textContent = p.nome;
    botao.dataset.idioma = p.idioma;
    botao.addEventListener("click", () => {
      filtroDorama.idioma = p.idioma;
      marcarDoramaBars();
      selectGenre("dorama");
    });
    $("dorama-paises").appendChild(botao);
  });

  GENEROS_DORAMA.forEach((g) => {
    const botao = document.createElement("button");
    botao.textContent = g.nome;
    botao.dataset.id = g.id;
    botao.addEventListener("click", () => {
      filtroDorama.genero = g.id;
      marcarDoramaBars();
      selectGenre("dorama");
    });
    $("dorama-generos").appendChild(botao);
  });

  marcarDoramaBars();
}

function marcarDoramaBars() {
  document
    .querySelectorAll("#dorama-paises button")
    .forEach((b) => b.classList.toggle("filter-active", b.dataset.idioma === filtroDorama.idioma));

  document
    .querySelectorAll("#dorama-generos button")
    .forEach((b) => b.classList.toggle("filter-active", b.dataset.id === filtroDorama.genero));
}

function openExplore(slug) {
  showPage("explore");
  setNav(1);

  if (!explorar) {
    buildChips();
    buildDoramaBars();
    selectGenre(slug || "");
  } else if (slug !== undefined && explorar.slug !== slug) {
    selectGenre(slug);
  }
}

function selectGenre(slug) {
  explorar = { slug, offset: 0, pagina: 1, fim: false, carregando: false, vistos: new Set() };

  document
    .querySelectorAll("#genre-bar button")
    .forEach((b) => b.classList.toggle("filter-active", b.dataset.slug === slug));

  $("dorama-bar").hidden = !(slug === "dorama" && temServidor() && !tmdbIndisponivel);

  loadMore();
}

async function loadMore() {
  const estado = explorar;
  if (!estado || estado.carregando || estado.fim) return;
  estado.carregando = true;

  const primeira = estado.offset === 0 && estado.pagina === 1;
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
    if (estado.slug === "dorama" && temServidor() && !tmdbIndisponivel) {
      try {
        const r = await getDoramasTmdb({
          pagina: estado.pagina,
          idioma: filtroDorama.idioma,
          genero: filtroDorama.genero
        });
        itens = r.itens;
        estado.pagina += 1;
        estado.fim = estado.pagina > r.totalPaginas;
      } catch (e) {
        // Sem TMDB na primeira página: usa a lista de reserva em vez de mostrar erro
        if (estado.pagina > 1) throw e;
        console.error("TMDB falhou, a usar a lista de reserva:", e);
        tmdbIndisponivel = true;
        $("dorama-bar").hidden = true;
        itens = await getDramasTvmaze();
        estado.fim = true;
      }
    } else if (estado.slug === "dorama") {
      itens = await getDramasTvmaze();
      estado.fim = true;
    } else {
      const emExibicao = estado.slug === "lancamentos";
      const pagina = await getAnimePage(
        "",
        emExibicao ? "" : estado.slug,
        POR_PAGINA,
        estado.offset,
        { emExibicao }
      );
      itens = semRepetidos(pagina.itens, estado.vistos);
      estado.offset += POR_PAGINA;
      estado.fim = !pagina.temMais;
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

function buildLibraryTabs() {
  const barra = $("library-tabs");

  ABAS_LISTA.forEach((aba) => {
    const botao = document.createElement("button");
    botao.dataset.aba = aba.id;
    botao.addEventListener("click", () => {
      abaLista = aba.id;
      renderLibrary();
    });
    barra.appendChild(botao);
  });
}

function renderLibrary() {
  const contagem = {
    todos: lista.length,
    quero: lista.filter((i) => (i.estado || "quero") === "quero").length,
    vendo: lista.filter((i) => i.estado === "vendo").length,
    concluido: lista.filter((i) => i.estado === "concluido").length,
    historico: historico.length
  };

  document.querySelectorAll("#library-tabs button").forEach((b) => {
    const aba = ABAS_LISTA.find((a) => a.id === b.dataset.aba);
    b.textContent = aba.nome + " (" + contagem[aba.id] + ")";
    b.classList.toggle("filter-active", aba.id === abaLista);
  });

  $("clear-history").hidden = !(abaLista === "historico" && historico.length);

  if (abaLista === "historico") {
    renderList("library-list", historico, "Ainda não abriste nenhum título.");
    return;
  }

  const itens =
    abaLista === "todos" ? lista : lista.filter((i) => (i.estado || "quero") === abaLista);

  const vazio =
    abaLista === "todos"
      ? "A tua lista está vazia. Abre um anime ou dorama e toca em Adicionar."
      : "Ainda não tens nada nesta categoria.";

  renderList("library-list", [...itens].reverse(), vazio);   // mais recentes primeiro
}

const ANILIST_PROXIMOS = `
query ($ids: [Int], $perPage: Int) {
  Page(perPage: $perPage) {
    media(id_in: $ids, type: ANIME) {
      id
      status
      nextAiringEpisode { episode airingAt }
    }
  }
}`;

let ultimaAtualizacaoProximos = 0;

// Busca o próximo episódio dos animes da tua lista (no máximo de 10 em 10 minutos)
async function atualizarProximos() {
  if (Date.now() - ultimaAtualizacaoProximos < 10 * 60 * 1000) return;

  const ids = lista
    .filter((i) => i.key.startsWith("anime-al-") && i.estado !== "concluido")
    .map((i) => Number(i.key.replace("anime-al-", "")))
    .slice(0, 50);

  if (!ids.length) return;
  ultimaAtualizacaoProximos = Date.now();

  try {
    const resposta = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANILIST_PROXIMOS, variables: { ids, perPage: ids.length } })
    });

    const json = await resposta.json().catch(() => ({}));
    if (!resposta.ok || json.errors) {
      throw new Error(json.errors?.[0]?.message || "AniList HTTP " + resposta.status);
    }

    let mudou = false;

    json.data.Page.media.forEach((m) => {
      const salvo = lista.find((i) => i.key === "anime-al-" + m.id);
      if (!salvo) return;

      salvo.status = m.status;
      salvo.proximo = m.nextAiringEpisode
        ? { ep: m.nextAiringEpisode.episode, quando: m.nextAiringEpisode.airingAt }
        : null;
      mudou = true;
    });

    if (mudou) {
      saveList();
      if (!$("library-page").hidden) renderLibrary();
    }
  } catch (e) {
    ultimaAtualizacaoProximos = 0;
    console.error(e);
  }
}

function openLibrary() {
  showPage("library");
  setNav(3);
  renderLibrary();
  atualizarProximos();
}


/* ===============================
   INICIALIZAÇÃO
================================ */

document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  buildLibraryTabs();

  $("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch();
  });

  $("ai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") askAI();
  });

  $("chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChat();
  });

  loadHome();

  // Permite instalar o app no ecrã inicial (só funciona com o site online, em https)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
