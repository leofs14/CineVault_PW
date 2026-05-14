import { initializeApp }                         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         onAuthStateChanged }                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

let authResolved = false;

onAuthStateChanged(auth, user => {
  if (!authResolved) {
    authResolved = true;
    if (user) window.location.href = "index.html";
  }
});

window.switchTab = (tab) => {
  const isLogin = tab === "login";
  document.getElementById("form-login").classList.toggle("hidden", !isLogin);
  document.getElementById("form-register").classList.toggle("hidden", isLogin);
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-register").classList.toggle("active", !isLogin);
};

window.doLogin = async () => {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-pass").value;
  const btn   = document.getElementById("btn-login");
  const err   = document.getElementById("login-error");

  err.classList.add("hidden");
  btn.textContent = "A entrar...";
  btn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = "index.html";
  } catch (e) {
    err.textContent = traduzErro(e.code);
    err.classList.remove("hidden");
    btn.textContent = "Entrar";
    btn.disabled = false;
  }
};

window.doRegister = async () => {
  const email = document.getElementById("reg-email").value.trim();
  const pass  = document.getElementById("reg-pass").value;
  const btn   = document.getElementById("btn-register");
  const err   = document.getElementById("reg-error");

  err.classList.add("hidden");
  btn.textContent = "A criar...";
  btn.disabled = true;

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    window.location.href = "index.html";
  } catch (e) {
    err.textContent = traduzErro(e.code);
    err.classList.remove("hidden");
    btn.textContent = "Criar conta";
    btn.disabled = false;
  }
};

function traduzErro(code) {
  const erros = {
    "auth/invalid-email":        "Email inválido.",
    "auth/user-not-found":       "Utilizador não encontrado.",
    "auth/wrong-password":       "Password incorreta.",
    "auth/email-already-in-use": "Este email já está registado.",
    "auth/weak-password":        "A password deve ter pelo menos 6 caracteres.",
    "auth/invalid-credential":   "Email ou password incorretos.",
    "auth/too-many-requests":    "Demasiadas tentativas. Tenta mais tarde.",
  };
  return erros[code] ?? "Ocorreu um erro. Tenta novamente.";
}