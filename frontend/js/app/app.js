// ============================================================
// Application Configuration
// ============================================================

const APP_MODE = "auth";

const DEFAULT_ROUTE = "home";
const DEFAULT_AUTH_VIEW = "signup";


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
    heading: "A place for language to become participation.",
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
    heading: "Create your bahasabahasa identity.",
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
    heading: "Continue your participation.",
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
          required
        >
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

  // Authentication views do not select
  // application navigation items.
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
// Authentication Form Submission
// ============================================================

function handleAuthSubmit(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  clearFieldErrors(form);

  setAuthMessage(
    "Checking form…"
  );

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

  setAuthMessage(
    "Form ready for authentication integration.",
    "ready"
  );

  // T10.3.2 boundary:
  //
  // Do not authenticate here.
  // Do not create a fake user.
  // Do not store credentials.
  // Do not call an API.
  //
  // T10.4 will connect this validated
  // interaction contract to the backend.
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