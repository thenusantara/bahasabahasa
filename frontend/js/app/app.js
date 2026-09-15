// ============================================================
// Application Configuration
// ============================================================

const APP_MODE = "auth";

const DEFAULT_ROUTE = "home";
const DEFAULT_AUTH_VIEW = "signup";

const API_BASE_URL =
  "http://127.0.0.1:8787";


// ============================================================
// Runtime Authentication State
// ============================================================

const authSession = {
  token: null,
  expiresAt: null,
  user: null
};


// ============================================================
// Application Routes
// ============================================================

const routes = {
  home: {
    title: "Home",
    eyebrow: "Jawa Timur Language Lab",
    heading: "Build your language identity.",
    description:
      "Tell bahasabahasa how you relate to language, what you want to participate in, and where you want to begin."
  },

  profile: {
    title: "Profile",
    eyebrow: "Your Identity",
    heading: "Tell us who you are.",
    description:
      "Your profile will become the human foundation for your participation in bahasabahasa."
  },

  languages: {
    title: "My Languages",
    eyebrow: "Language Relationships",
    heading: "How do you relate to language?",
    description:
      "A language can be something you speak, learn, teach, research, or are able to review."
  },

  participation: {
    title: "Participation",
    eyebrow: "Your Direction",
    heading: "What would you like to do?",
    description:
      "Choose how you want to participate in the bahasabahasa language infrastructure."
  },

  lab: {
    title: "Language Lab",
    eyebrow: "Jawa Timur Language Lab",
    heading:
      "A place for language to become participation.",
    description:
      "Explore, contribute, and ask as the Language Lab grows into a living human language infrastructure."
  }
};


// ============================================================
// Authentication Views
// ============================================================

const authViews = {
  signup: {
    title: "Join",
    eyebrow: "Join the Language Lab",
    heading:
      "Create your bahasabahasa identity.",
    description:
      "Start with an account. Your language relationships and participation will come next.",
    submitLabel: "Create Account",
    alternateView: "login",
    alternateLabel:
      "Already participating? Sign in"
  },

  login: {
    title: "Sign In",
    eyebrow: "Welcome Back",
    heading:
      "Continue your participation.",
    description:
      "Sign in to return to your language identity and the Language Lab.",
    submitLabel: "Sign In",
    alternateView: "signup",
    alternateLabel:
      "New to bahasabahasa? Join the Language Lab"
  }
};


// ============================================================
// Hash Resolution
// ============================================================

function getHashValue() {
  return window.location.hash
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
}


function getRouteFromHash() {
  const routeName = getHashValue();

  return Object.prototype.hasOwnProperty.call(
    routes,
    routeName
  )
    ? routeName
    : DEFAULT_ROUTE;
}


function getAuthViewFromHash() {
  const authViewName = getHashValue();

  return Object.prototype.hasOwnProperty.call(
    authViews,
    authViewName
  )
    ? authViewName
    : DEFAULT_AUTH_VIEW;
}


// ============================================================
// Application View Rendering
// ============================================================

function renderView(routeName) {
  const route = routes[routeName];

  const view =
    document.querySelector("#app-view");

  if (!view) {
    console.error(
      "[bahasabahasa] Cannot render: #app-view was not found."
    );

    return;
  }

  view.innerHTML = `
    <p class="app-eyebrow">
      ${route.eyebrow}
    </p>

    <h1>
      ${route.heading}
    </h1>

    <p class="app-lead">
      ${route.description}
    </p>

    <div
      class="app-status"
      role="status"
    >
      <span class="app-status__label">
        View status
      </span>

      <strong>
        ${route.title}
      </strong>
    </div>
  `;

  document.title =
    `${route.title} | bahasabahasa`;
}


// ============================================================
// Navigation State
// ============================================================

function updateNavigation(routeName) {
  const links =
    document.querySelectorAll(
      ".app-nav__link"
    );

  links.forEach((link) => {
    const linkRoute =
      link
        .getAttribute("href")
        ?.replace(/^#/, "")
        .trim()
        .toLowerCase();

    const isActive =
      linkRoute === routeName;

    link.classList.toggle(
      "app-nav__link--active",
      isActive
    );

    if (isActive) {
      link.setAttribute(
        "aria-current",
        "page"
      );
    } else {
      link.removeAttribute(
        "aria-current"
      );
    }
  });
}


// ============================================================
// Authentication Form Markup
// ============================================================

function createSignupFormMarkup(authView) {
  return `
    <form
      class="auth-form"
      id="auth-form"
      data-auth-form="signup"
      novalidate
    >

      <div class="auth-form__field">
        <label
          class="auth-form__label"
          for="auth-email"
        >
          Email
        </label>

        <input
          class="auth-form__input"
          id="auth-email"
          name="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
        >
      </div>

      <div class="auth-form__field">
        <label
          class="auth-form__label"
          for="auth-password"
        >
          Password
        </label>

        <input
          class="auth-form__input"
          id="auth-password"
          name="password"
          type="password"
          autocomplete="new-password"
          minlength="12"
          maxlength="128"
          required
        >

        <p class="auth-form__hint">
          Use 12 to 128 characters.
        </p>
      </div>

      <div class="auth-form__field">
        <label
          class="auth-form__label"
          for="auth-confirm-password"
        >
          Confirm password
        </label>

        <input
          class="auth-form__input"
          id="auth-confirm-password"
          name="confirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="12"
          maxlength="128"
          required
        >
      </div>

      <p
        class="auth-message"
        id="auth-message"
        role="status"
        aria-live="polite"
      ></p>

      <div class="auth-form__actions">
        <button
          class="auth-form__submit"
          type="submit"
        >
          ${authView.submitLabel}
        </button>

        <p class="auth-form__alternate">
          <a href="#${authView.alternateView}">
            ${authView.alternateLabel}
          </a>
        </p>
      </div>

    </form>
  `;
}


function createLoginFormMarkup(authView) {
  return `
    <form
      class="auth-form"
      id="auth-form"
      data-auth-form="login"
      novalidate
    >

      <div class="auth-form__field">
        <label
          class="auth-form__label"
          for="auth-email"
        >
          Email
        </label>

        <input
          class="auth-form__input"
          id="auth-email"
          name="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
        >
      </div>

      <div class="auth-form__field">
        <label
          class="auth-form__label"
          for="auth-password"
        >
          Password
        </label>

        <input
          class="auth-form__input"
          id="auth-password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </div>

      <p
        class="auth-message"
        id="auth-message"
        role="status"
        aria-live="polite"
      ></p>

      <div class="auth-form__actions">
        <button
          class="auth-form__submit"
          type="submit"
        >
          ${authView.submitLabel}
        </button>

        <p class="auth-form__alternate">
          <a href="#${authView.alternateView}">
            ${authView.alternateLabel}
          </a>
        </p>
      </div>

    </form>
  `;
}


function createAuthFormMarkup(
  authViewName,
  authView
) {
  if (authViewName === "login") {
    return createLoginFormMarkup(
      authView
    );
  }

  return createSignupFormMarkup(
    authView
  );
}


// ============================================================
// Authentication View Rendering
// ============================================================

function renderAuthView(authViewName) {
  const authView =
    authViews[authViewName];

  const view =
    document.querySelector("#app-view");

  if (!view) {
    console.error(
      "[bahasabahasa] Cannot render: #app-view was not found."
    );

    return;
  }

  view.innerHTML = `
    <p class="app-eyebrow">
      ${authView.eyebrow}
    </p>

    <h1>
      ${authView.heading}
    </h1>

    <p class="app-lead">
      ${authView.description}
    </p>

    ${createAuthFormMarkup(
      authViewName,
      authView
    )}
  `;

  document.title =
    `${authView.title} | bahasabahasa`;

  updateNavigation(null);

  document.documentElement.dataset.route =
    authViewName;

  initializeAuthForm();
}


// ============================================================
// Authentication Form State
// ============================================================

function getAuthMessageElement() {
  return document.querySelector(
    "#auth-message"
  );
}


function setAuthMessage(
  message,
  state = ""
) {
  const messageElement =
    getAuthMessageElement();

  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    message;

  if (state) {
    messageElement.dataset.state =
      state;
  } else {
    delete messageElement.dataset.state;
  }
}


function clearFieldErrors(form) {
  const fields =
    form.querySelectorAll(
      ".auth-form__input"
    );

  fields.forEach((field) => {
    field.removeAttribute(
      "aria-invalid"
    );
  });
}


function markFieldInvalid(field) {
  if (!field) {
    return;
  }

  field.setAttribute(
    "aria-invalid",
    "true"
  );

  field.focus();
}


function setFormBusy(form, busy) {
  const submitButton =
    form.querySelector(
      ".auth-form__submit"
    );

  if (!submitButton) {
    return;
  }

  submitButton.disabled = busy;

  form.setAttribute(
    "aria-busy",
    String(busy)
  );
}


// ============================================================
// Authentication Validation
// ============================================================

function isValidEmail(value) {
  const emailInput =
    document.createElement("input");

  emailInput.type = "email";
  emailInput.value = value;

  return emailInput.checkValidity();
}


function validateLoginForm(form) {
  const email =
    form.elements.email;

  const password =
    form.elements.password;

  const emailValue =
    email.value.trim();

  if (!emailValue) {
    return {
      valid: false,
      field: email,
      message:
        "Enter your email address."
    };
  }

  if (!isValidEmail(emailValue)) {
    return {
      valid: false,
      field: email,
      message:
        "Enter a valid email address."
    };
  }

  if (!password.value) {
    return {
      valid: false,
      field: password,
      message:
        "Enter your password."
    };
  }

  return {
    valid: true
  };
}


function validateSignupForm(form) {
  const email =
    form.elements.email;

  const password =
    form.elements.password;

  const confirmPassword =
    form.elements.confirmPassword;

  const emailValue =
    email.value.trim();

  if (!emailValue) {
    return {
      valid: false,
      field: email,
      message:
        "Enter your email address."
    };
  }

  if (!isValidEmail(emailValue)) {
    return {
      valid: false,
      field: email,
      message:
        "Enter a valid email address."
    };
  }

  if (!password.value) {
    return {
      valid: false,
      field: password,
      message:
        "Create a password."
    };
  }

  if (password.value.length < 12) {
    return {
      valid: false,
      field: password,
      message:
        "Password must contain at least 12 characters."
    };
  }

  if (password.value.length > 128) {
    return {
      valid: false,
      field: password,
      message:
        "Password must not exceed 128 characters."
    };
  }

  if (!confirmPassword.value) {
    return {
      valid: false,
      field: confirmPassword,
      message:
        "Confirm your password."
    };
  }

  if (
    password.value !==
    confirmPassword.value
  ) {
    return {
      valid: false,
      field: confirmPassword,
      message:
        "Passwords do not match."
    };
  }

  return {
    valid: true
  };
}


function validateAuthForm(form) {
  const formType =
    form.dataset.authForm;

  if (formType === "login") {
    return validateLoginForm(form);
  }

  return validateSignupForm(form);
}


// ============================================================
// API Layer
// ============================================================

async function apiRequest(
  path,
  options = {}
) {
  const headers =
    new Headers(options.headers || {});

  headers.set(
    "Accept",
    "application/json"
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (authSession.token) {
    headers.set(
      "Authorization",
      `Bearer ${authSession.token}`
    );
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers
      }
    );
  } catch {
    throw new Error(
      "Unable to reach the bahasabahasa API."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data;
}


// ============================================================
// Authentication API
// ============================================================

async function signup(email, password) {
  return apiRequest(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    }
  );
}


async function login(email, password) {
  const data =
    await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      }
    );

  authSession.token =
    data.session.token;

  authSession.expiresAt =
    data.session.expiresAt;

  authSession.user =
    data.user;

  return data;
}


async function getCurrentUser() {
  return apiRequest(
    "/auth/me",
    {
      method: "GET"
    }
  );
}


// ============================================================
// Authentication Form Submission
// ============================================================

async function handleAuthSubmit(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  clearFieldErrors(form);

  const result =
    validateAuthForm(form);

  if (!result.valid) {
    markFieldInvalid(
      result.field
    );

    setAuthMessage(
      result.message,
      "error"
    );

    return;
  }

  const formType =
    form.dataset.authForm;

  const email =
    form.elements.email.value
      .trim()
      .toLowerCase();

  const password =
    form.elements.password.value;

  setFormBusy(form, true);

  setAuthMessage(
    formType === "signup"
      ? "Creating account..."
      : "Signing in..."
  );

  try {
    if (formType === "signup") {
      await signup(
        email,
        password
      );

      form.reset();

      window.location.hash =
        "login";

      return;
    }

    await login(
      email,
      password
    );

    const currentUser =
      await getCurrentUser();

    authSession.user =
      currentUser.user;

    setAuthMessage(
      `Authenticated as ${currentUser.user.email}.`,
      "ready"
    );
  } catch (error) {
    setAuthMessage(
      error.message,
      "error"
    );
  } finally {
    setFormBusy(form, false);
  }
}


// ============================================================
// Authentication Form Initialization
// ============================================================

function initializeAuthForm() {
  const form =
    document.querySelector(
      "#auth-form"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    handleAuthSubmit
  );

  const fields =
    form.querySelectorAll(
      ".auth-form__input"
    );

  fields.forEach((field) => {
    field.addEventListener(
      "input",
      () => {
        field.removeAttribute(
          "aria-invalid"
        );

        setAuthMessage("");
      }
    );
  });
}


// ============================================================
// View Dispatch
// ============================================================

function renderCurrentView() {
  if (APP_MODE === "auth") {
    renderAuthView(
      getAuthViewFromHash()
    );

    return;
  }

  renderRoute();
}


// ============================================================
// Application Initialization
// ============================================================

function initializeApp() {
  window.addEventListener(
    "hashchange",
    renderCurrentView
  );

  if (
    APP_MODE !== "auth" &&
    !window.location.hash
  ) {
    window.location.replace(
      `${window.location.pathname}${window.location.search}#${DEFAULT_ROUTE}`
    );

    return;
  }

  renderCurrentView();
}


// ============================================================
// Bootstrap
// ============================================================

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeApp,
    { once: true }
  );
} else {
  initializeApp();
}