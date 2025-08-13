const container = document.getElementById("mesaDeCorte");
const status = document.getElementById("statusAudio");
const playerGlobal = document.getElementById("playerGlobal");

const favoritos = JSON.parse(localStorage.getItem("favoritos")) || {};
const sonsPadrao = [
  { nome: "botao", url: "https://www.soundjay.com/button/beep-07.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/button-3.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/button-4.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/button-10.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/beep-08b.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/beep-01a.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/button-16.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/button-30.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/button-09.mp3" },
  { nome: "botão", url: "https://www.soundjay.com/button/beep-06.mp3" }
];

let todosOsSons = [];
let indiceFavoritoAtual = 0;
let repetirGlobal = false;

function getCorPorIndice(index) {
  if (index < 11) return "branco";
  if (index < 22) return "amarelo";
  return "azul";
}

function criarBotaoSom(som, index) {
  const btn = document.createElement("button");
  btn.className = "sound-button " + getCorPorIndice(index);
  som._btnRef = btn;

  const icone = document.createElement("i");
  icone.className = "fas fa-music";

  const nome = document.createElement("div");
  nome.className = "sound-name";
  nome.textContent = som.nome;

  const star = document.createElement("i");
  star.className = "fas fa-star favorite";
  if (favoritos[som.nome]) btn.classList.add("favorited");

  const btnRepeat = document.createElement("button");
  btnRepeat.className = "repeat-button";
  btnRepeat.textContent = "🔁";
  btnRepeat.title = "Ativar repetição";
  btnRepeat.onclick = (e) => {
    e.stopPropagation();
    repetirGlobal = !repetirGlobal;
    playerGlobal.loop = repetirGlobal;
    btnRepeat.classList.toggle("ativo", repetirGlobal);
    btnRepeat.title = repetirGlobal ? "Repetindo..." : "Ativar repetição";
  };

  btn.addEventListener("click", () => {
    document.querySelectorAll(".sound-button.tocando").forEach(b => b.classList.remove("tocando"));
    btn.classList.add("tocando");

    playerGlobal.src = som.url;
    playerGlobal.play();
    status.textContent = `🎵 Tocando: ${som.nome}`;
    status.classList.remove("hidden");
  });

  btn.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (btn.classList.toggle("favorited")) {
      favoritos[som.nome] = true;
    } else {
      delete favoritos[som.nome];
    }
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  });

  const btnDownload = document.createElement("button");
  btnDownload.className = "download-button";
  btnDownload.textContent = "⬇";
  if (som.url.startsWith("blob:") || som.url.startsWith("data:")) {
    btnDownload.onclick = () => {
      const a = document.createElement("a");
      a.href = som.url;
      a.download = som.nome + ".mp3";
      a.click();
    };
  } else {
    btnDownload.disabled = true;
    btnDownload.style.opacity = 0.4;
    btnDownload.title = "Som online, não disponível para download";
  }

  const inputUpload = document.createElement("input");
  inputUpload.type = "file";
  inputUpload.accept = "audio/*";
  inputUpload.className = "upload-input";
  inputUpload.id = "upload-" + index;

  const labelUpload = document.createElement("label");
  labelUpload.className = "upload-label";
  labelUpload.setAttribute("for", inputUpload.id);
  labelUpload.textContent = "⬆";

  inputUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      const newName = file.name.replace(/\.[^/.]+$/, "");
      som.url = newUrl;
      som.nome = newName.length > 15 ? newName.slice(0, 15) + "…" : newName;
      nome.textContent = som.nome;
      btnDownload.disabled = false;
      btnDownload.style.opacity = 1;
      btnDownload.onclick = () => {
        const a = document.createElement("a");
        a.href = som.url;
        a.download = som.nome + ".mp3";
        a.click();
      };
    }
  });

  btn.appendChild(star);
  btn.appendChild(icone);
  btn.appendChild(nome);
  btn.appendChild(btnRepeat);
  btn.appendChild(btnDownload);
  btn.appendChild(inputUpload);
  btn.appendChild(labelUpload);

  container.appendChild(btn);
}

function carregarSonsIniciais() {
  todosOsSons = [];
  for (let i = 0; i < 30; i++) {
    const somBase = sonsPadrao[i % sonsPadrao.length];
    todosOsSons.push({ nome: `${somBase.nome} ${i + 1}`, url: somBase.url });
  }
  container.innerHTML = "";
  todosOsSons.forEach((som, i) => criarBotaoSom(som, i));
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function salvarProjeto() {
  const dados = [];
  for (let som of todosOsSons) {
    if (som.url.startsWith("blob:")) {
      const response = await fetch(som.url);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      dados.push({ nome: som.nome, base64, favorito: !!favoritos[som.nome] });
    } else {
      dados.push({ nome: som.nome, url: som.url, favorito: !!favoritos[som.nome] });
    }
  }
  const blobFinal = new Blob([JSON.stringify(dados)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blobFinal);
  link.download = "meu_projeto_completo.json";
  link.click();
}

document.getElementById("salvarProjeto").addEventListener("click", salvarProjeto);

document.getElementById("carregarProjeto").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    const dados = JSON.parse(event.target.result);
    todosOsSons = [];
    for (let item of dados) {
      const url = item.base64 || item.url;
      todosOsSons.push({ nome: item.nome, url });
      if (item.favorito) favoritos[item.nome] = true;
    }
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    container.innerHTML = "";
    todosOsSons.forEach((som, i) => criarBotaoSom(som, i));
  };
  reader.readAsText(file);
});

document.getElementById("pararSom").addEventListener("click", () => {
  playerGlobal.pause();
  playerGlobal.currentTime = 0;
  document.querySelectorAll(".sound-button.tocando").forEach(b => b.classList.remove("tocando"));
  status.textContent = "🎵 Nenhum som tocando";
  status.classList.add("hidden");
});

document.getElementById("proximoFavorito").addEventListener("click", () => {
  const listaFavoritos = todosOsSons.filter(s => favoritos[s.nome]);
  if (listaFavoritos.length === 0) {
    alert("Nenhum favorito encontrado!");
    return;
  }
  if (indiceFavoritoAtual >= listaFavoritos.length) {
    indiceFavoritoAtual = 0;
  }
  const som = listaFavoritos[indiceFavoritoAtual];
  indiceFavoritoAtual++;
  if (som._btnRef) som._btnRef.click();
});

playerGlobal.addEventListener("ended", () => {
  document.querySelectorAll(".sound-button.tocando").forEach(b => b.classList.remove("tocando"));
  status.textContent = "🎵 Nenhum som tocando";
  status.classList.add("hidden");
});

carregarSonsIniciais();
