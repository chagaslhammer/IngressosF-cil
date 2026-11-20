const form = document.getElementById("registerForm");

const campos = {
    nome: document.getElementById("nome"),
    email: document.getElementById("email"),
    senha: document.getElementById("senha"),
    confirmar: document.getElementById("confirmar"),
    termos: document.getElementById("termos")
};

const selectCategoria = document.getElementById("categoria");
const switchNovidades = document.getElementById("novidades");
const mensagem = document.getElementById("mensagem");
const listaUsuarios = document.getElementById("lista-usuarios");
const botaoVerSenha = document.getElementById("ver-senha");
const forcaProgresso = document.getElementById("forca-progresso");
const forcaBarra = document.getElementById("forca-barra");
const forcaTexto = document.getElementById("forca-texto");

const CHAVE_STORAGE = "ingressosfacil.usuarios";
const ROTULOS_FORCA = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
const CLASSES_FORCA = ["bg-danger", "bg-danger", "bg-warning", "bg-info", "bg-success"];
const NOMES_CATEGORIA = {
    show: "Shows",
    comedia: "Comédia",
    esporte: "Esportes",
    gastronomia: "Gastronomia"
};

function validarNome(valor) {
    const texto = valor.trim();
    if (texto === "") return "Informe seu nome.";
    if (texto.length < 3) return "O nome deve ter ao menos 3 caracteres.";
    return "";
}

function validarEmail(valor) {
    const texto = valor.trim();
    if (texto === "") return "Informe seu e-mail.";
    const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!padrao.test(texto)) return "E-mail inválido.";
    return "";
}

function validarSenha(valor) {
    if (valor === "") return "Informe uma senha.";
    if (valor.length < 8) return "A senha deve ter ao menos 8 caracteres.";
    return "";
}

function validarConfirmacao(valor) {
    if (valor === "") return "Repita a senha.";
    if (valor !== campos.senha.value) return "As senhas não conferem.";
    return "";
}

function validarTermos(marcado) {
    return marcado ? "" : "É preciso aceitar os termos de uso.";
}

const validadores = {
    nome: validarNome,
    email: validarEmail,
    senha: validarSenha,
    confirmar: validarConfirmacao,
    termos: validarTermos
};

function lerValor(input) {
    return input.type === "checkbox" ? input.checked : input.value;
}

function validarCampo(nomeCampo) {
    const input = campos[nomeCampo];
    const erro = document.getElementById("erro-" + nomeCampo);
    const texto = validadores[nomeCampo](lerValor(input));

    erro.textContent = texto;
    input.classList.toggle("is-invalid", texto !== "");
    input.classList.toggle("is-valid", texto === "");

    return texto === "";
}

Object.keys(campos).forEach(function (nomeCampo) {
    const input = campos[nomeCampo];

    input.addEventListener("blur", function () {
        validarCampo(nomeCampo);
    });

    input.addEventListener("input", function () {
        if (input.classList.contains("is-invalid")) {
            validarCampo(nomeCampo);
        }
    });
});

campos.senha.addEventListener("input", function () {
    if (campos.confirmar.value !== "") {
        validarCampo("confirmar");
    }
});

botaoVerSenha.addEventListener("click", function () {
    const estavaVisivel = campos.senha.type === "text";

    campos.senha.type = estavaVisivel ? "password" : "text";
    botaoVerSenha.querySelector("i").className = estavaVisivel ? "bi bi-eye" : "bi bi-eye-slash";
    botaoVerSenha.setAttribute("aria-label", estavaVisivel ? "Mostrar senha" : "Ocultar senha");
});

function calcularForca(senha) {
    let pontos = 0;
    if (senha.length >= 8) pontos++;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
    if (/\d/.test(senha)) pontos++;
    if (/[^A-Za-z0-9]/.test(senha)) pontos++;
    return pontos;
}

function mostrarForca(senha) {
    const pontos = calcularForca(senha);

    forcaBarra.style.width = pontos * 25 + "%";
    forcaBarra.className = "progress-bar " + CLASSES_FORCA[pontos];
    forcaProgresso.setAttribute("aria-valuenow", pontos * 25);
    forcaTexto.textContent = senha === "" ? "" : "Força: " + ROTULOS_FORCA[pontos];
}

campos.senha.addEventListener("input", function () {
    mostrarForca(campos.senha.value);
});

function lerUsuarios() {
    return JSON.parse(localStorage.getItem(CHAVE_STORAGE)) ?? [];
}

function gravarUsuarios(usuarios) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(usuarios));
}

function renderizarUsuarios() {
    const usuarios = lerUsuarios();
    listaUsuarios.replaceChildren();

    if (usuarios.length === 0) {
        const vazio = document.createElement("li");
        vazio.className = "list-group-item text-body-secondary";
        vazio.textContent = "Nenhum cadastro ainda.";
        listaUsuarios.append(vazio);
        return;
    }

    usuarios.forEach(function (usuario) {
        const item = document.createElement("li");
        item.className = "list-group-item d-flex justify-content-between align-items-center";

        const texto = document.createElement("span");
        texto.textContent = `${usuario.nome} (${usuario.email})`;
        item.append(texto);

        if (usuario.categoria !== "") {
            const etiqueta = document.createElement("span");
            etiqueta.className = "badge text-bg-secondary";
            etiqueta.textContent = NOMES_CATEGORIA[usuario.categoria];
            item.append(etiqueta);
        }

        listaUsuarios.append(item);
    });
}

form.addEventListener("submit", function (event) {
    event.preventDefault();
    mensagem.hidden = true;

    let formularioValido = true;
    Object.keys(campos).forEach(function (nomeCampo) {
        if (!validarCampo(nomeCampo)) {
            formularioValido = false;
        }
    });

    if (!formularioValido) {
        form.querySelector(".is-invalid").focus();
        return;
    }

    const usuario = {
        nome: campos.nome.value.trim(),
        email: campos.email.value.trim().toLowerCase(),
        categoria: selectCategoria.value,
        novidades: switchNovidades.checked,
        criadoEm: new Date().toLocaleString("pt-BR")
    };

    const usuarios = lerUsuarios();
    const jaExiste = usuarios.some(function (cadastrado) {
        return cadastrado.email === usuario.email;
    });

    if (jaExiste) {
        document.getElementById("erro-email").textContent = "Este e-mail já está cadastrado.";
        campos.email.classList.remove("is-valid");
        campos.email.classList.add("is-invalid");
        campos.email.focus();
        return;
    }

    usuarios.push(usuario);
    gravarUsuarios(usuarios);

    form.reset();
    Object.values(campos).forEach(function (input) {
        input.classList.remove("is-valid", "is-invalid");
    });
    mostrarForca("");

    mensagem.textContent = `Cadastro realizado! Bem-vindo(a), ${usuario.nome}.`;
    mensagem.hidden = false;

    renderizarUsuarios();
});

renderizarUsuarios();