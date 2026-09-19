// ============================================================
// Application Configuration
// ============================================================

let appMode = "auth";

const DEFAULT_ROUTE = "home";
const DEFAULT_AUTH_VIEW = "signup";
const LOCAL_HOSTNAMES = new Set([
  "127.0.0.1",
  "localhost"
]);

const API_BASE_URL = LOCAL_HOSTNAMES.has(window.location.hostname)
  ? "http://127.0.0.1:8787"
  : "https://api.bahasabahasa.com";


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
// Language Relationship Vocabulary
// ============================================================

const LANGUAGE_RELATIONSHIP_OPTIONS = [
  ["speak", "Speak"],
  ["learn", "Learn"],
  ["teach", "Teach"],
  ["research", "Research"],
  ["review", "Review"]
];

// ============================================================
// Participation Interest Vocabulary
// ============================================================

const PARTICIPATION_INTEREST_OPTIONS = [
  ["learn", "Learn"],
  ["teach", "Teach"],
  ["research", "Research"],
  ["contribute", "Contribute"],
  ["language_ai", "Language AI"]
];

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
// Profile API
// ============================================================

async function getProfile() {
  return apiRequest(
    "/me/profile",
    {
      method: "GET"
    }
  );
}


async function saveProfile(profile) {
  return apiRequest(
    "/me/profile",
    {
      method: "PUT",
      body: JSON.stringify({
        displayName:
          profile.displayName,
        regionCode:
          profile.regionCode,
        bio:
          profile.bio
      })
    }
  );
}


// ============================================================
// Language API
// ============================================================

async function getLanguageCatalogue() {
  return apiRequest(
    "/languages",
    {
      method: "GET"
    }
  );
}


async function getMyLanguages() {
  return apiRequest(
    "/me/languages",
    {
      method: "GET"
    }
  );
}


async function addMyLanguage(entry) {
  return apiRequest(
    "/me/languages",
    {
      method: "POST",
      body: JSON.stringify({
        languageId:
          entry.languageId,
        relationship:
          entry.relationship,
        regionNote:
          entry.regionNote
      })
    }
  );
}


async function deleteMyLanguage(
  userLanguageId
) {
  return apiRequest(
    `/me/languages/${encodeURIComponent(
      userLanguageId
    )}`,
    {
      method: "DELETE"
    }
  );
}

// ============================================================
// Participation API
// ============================================================

async function getMyInterests() {
  return apiRequest(
    "/me/interests",
    {
      method: "GET"
    }
  );
}


async function saveMyInterests(
  interests
) {
  return apiRequest(
    "/me/interests",
    {
      method: "PUT",
      body: JSON.stringify({
        interests
      })
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

    appMode = "app";

    if (getHashValue() === "profile") {
      renderCurrentView();
    } else {
      window.location.hash =
        "profile";
    }
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
// Profile Markup
// ============================================================

function createProfileFormMarkup() {
  return `
    <form
      class="profile-form"
      id="profile-form"
      novalidate
    >
      <div class="profile-form__field">
        <label
          class="profile-form__label"
          for="profile-display-name"
        >
          Display name
        </label>

        <input
          class="profile-form__input"
          id="profile-display-name"
          name="displayName"
          type="text"
          autocomplete="name"
          minlength="2"
          maxlength="80"
          required
        >

        <p class="profile-form__hint">
          Use 2 to 80 characters.
        </p>
      </div>

      <div class="profile-form__field">
        <label
          class="profile-form__label"
          for="profile-region-code"
        >
          Region
        </label>

        <input
          class="profile-form__input"
          id="profile-region-code"
          name="regionCode"
          type="text"
          maxlength="64"
        >

        <p class="profile-form__hint">
          Optional. Use up to 64 characters.
        </p>
      </div>

      <div class="profile-form__field">
        <label
          class="profile-form__label"
          for="profile-bio"
        >
          About you
        </label>

        <textarea
          class="profile-form__input profile-form__textarea"
          id="profile-bio"
          name="bio"
          maxlength="500"
          rows="6"
        ></textarea>

        <p class="profile-form__hint">
          Optional. Use up to 500 characters.
        </p>
      </div>

      <p
        class="profile-message"
        id="profile-message"
        role="status"
        aria-live="polite"
      ></p>

      <div class="profile-form__actions">
        <button
          class="profile-form__submit"
          type="submit"
        >
          Save Profile
        </button>
      </div>
    </form>
  `;
}


// ============================================================
// Profile State
// ============================================================

function getProfileMessageElement() {
  return document.querySelector(
    "#profile-message"
  );
}


function setProfileMessage(
  message,
  state = ""
) {
  const messageElement =
    getProfileMessageElement();

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


function clearProfileFieldErrors(form) {
  const fields =
    form.querySelectorAll(
      ".profile-form__input"
    );

  fields.forEach((field) => {
    field.removeAttribute(
      "aria-invalid"
    );
  });
}


function setProfileFormBusy(
  form,
  busy
) {
  const submitButton =
    form.querySelector(
      ".profile-form__submit"
    );

  if (!submitButton) {
    return;
  }

  submitButton.disabled =
    busy;

  form.setAttribute(
    "aria-busy",
    String(busy)
  );
}


// ============================================================
// Profile Validation
// ============================================================

function validateProfileForm(form) {
  const displayName =
    form.elements.displayName;

  const regionCode =
    form.elements.regionCode;

  const bio =
    form.elements.bio;

  const displayNameValue =
    displayName.value.trim();

  const regionCodeValue =
    regionCode.value.trim();

  const bioValue =
    bio.value.trim();

  if (!displayNameValue) {
    return {
      valid: false,
      field: displayName,
      message:
        "Enter a display name."
    };
  }

  if (displayNameValue.length < 2) {
    return {
      valid: false,
      field: displayName,
      message:
        "Display name must contain at least 2 characters."
    };
  }

  if (displayNameValue.length > 80) {
    return {
      valid: false,
      field: displayName,
      message:
        "Display name must not exceed 80 characters."
    };
  }

  if (regionCodeValue.length > 64) {
    return {
      valid: false,
      field: regionCode,
      message:
        "Region must not exceed 64 characters."
    };
  }

  if (bioValue.length > 500) {
    return {
      valid: false,
      field: bio,
      message:
        "About you must not exceed 500 characters."
    };
  }

  return {
    valid: true,
    value: {
      displayName:
        displayNameValue,
      regionCode:
        regionCodeValue || null,
      bio:
        bioValue || null
    }
  };
}


// ============================================================
// Profile Rendering
// ============================================================

function populateProfileForm(profile) {
  if (!profile) {
    return;
  }

  const form =
    document.querySelector(
      "#profile-form"
    );

  if (!form) {
    return;
  }

  form.elements.displayName.value =
    profile.displayName ?? "";

  form.elements.regionCode.value =
    profile.regionCode ?? "";

  form.elements.bio.value =
    profile.bio ?? "";
}


async function renderProfileView() {
  const route =
    routes.profile;

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
        Profile status
      </span>

      <strong>
        Loading profile...
      </strong>
    </div>
  `;

  document.title =
    `${route.title} | bahasabahasa`;

  updateNavigation("profile");

  document.documentElement.dataset.route =
    "profile";

  try {
    const data =
      await getProfile();

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

      ${createProfileFormMarkup()}
    `;

    populateProfileForm(
      data.profile
    );

    initializeProfileForm();

    if (data.profile) {
      setProfileMessage(
        "Profile loaded.",
        "ready"
      );
    }
  } catch (error) {
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
        class="app-status app-status--error"
        role="alert"
      >
        <span class="app-status__label">
          Profile unavailable
        </span>

        <strong
          id="profile-load-error"
        ></strong>
      </div>
    `;

    const errorElement =
      document.querySelector(
        "#profile-load-error"
      );

    if (errorElement) {
      errorElement.textContent =
        error.message;
    }
  }
}


// ============================================================
// Profile Submission
// ============================================================

async function handleProfileSubmit(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  clearProfileFieldErrors(form);

  const result =
    validateProfileForm(form);

  if (!result.valid) {
    markFieldInvalid(
      result.field
    );

    setProfileMessage(
      result.message,
      "error"
    );

    return;
  }

  setProfileFormBusy(
    form,
    true
  );

  setProfileMessage(
    "Saving profile..."
  );

  try {
    const data =
      await saveProfile(
        result.value
      );

    populateProfileForm(
      data.profile
    );

    setProfileMessage(
      "Profile saved.",
      "ready"
    );
  } catch (error) {
    setProfileMessage(
      error.message,
      "error"
    );
  } finally {
    setProfileFormBusy(
      form,
      false
    );
  }
}


// ============================================================
// Profile Initialization
// ============================================================

function initializeProfileForm() {
  const form =
    document.querySelector(
      "#profile-form"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    handleProfileSubmit
  );

  const fields =
    form.querySelectorAll(
      ".profile-form__input"
    );

  fields.forEach((field) => {
    field.addEventListener(
      "input",
      () => {
        field.removeAttribute(
          "aria-invalid"
        );

        setProfileMessage("");
      }
    );
  });
}


// ============================================================
// Language Relationships Markup
// ============================================================

function createLanguagesViewMarkup() {
  const route =
    routes.languages;

  return `
    <p class="app-eyebrow">
      ${route.eyebrow}
    </p>

    <h1>
      ${route.heading}
    </h1>

    <p class="app-lead">
      ${route.description}
    </p>

    <section
      class="language-panel"
      aria-labelledby="language-add-heading"
    >
      <div class="language-panel__header">
        <h2 id="language-add-heading">
          Add a language relationship
        </h2>

        <p>
          Choose a language and describe how you relate to it.
        </p>
      </div>

      <form
        class="language-form"
        id="language-form"
        novalidate
      >
        <div class="language-form__field">
          <label
            class="language-form__label"
            for="language-id"
          >
            Language
          </label>

          <select
            class="language-form__input"
            id="language-id"
            name="languageId"
            required
          >
            <option value="">
              Loading languages...
            </option>
          </select>
        </div>

        <div class="language-form__field">
          <label
            class="language-form__label"
            for="language-relationship"
          >
            Relationship
          </label>

          <select
            class="language-form__input"
            id="language-relationship"
            name="relationship"
            required
          >
            <option value="">
              Choose a relationship
            </option>

            ${LANGUAGE_RELATIONSHIP_OPTIONS
              .map(
                ([value, label]) =>
                  `<option value="${value}">${label}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="language-form__field">
          <label
            class="language-form__label"
            for="language-region-note"
          >
            Region note
          </label>

          <input
            class="language-form__input"
            id="language-region-note"
            name="regionNote"
            type="text"
            maxlength="120"
          >

          <p class="language-form__hint">
            Optional. Add a regional or community context in up to 120 characters.
          </p>
        </div>

        <p
          class="language-message"
          id="language-message"
          role="status"
          aria-live="polite"
        ></p>

        <div class="language-form__actions">
          <button
            class="language-form__submit"
            type="submit"
          >
            Add Relationship
          </button>
        </div>
      </form>
    </section>

    <section
      class="language-panel"
      aria-labelledby="my-languages-heading"
    >
      <div class="language-panel__header">
        <h2 id="my-languages-heading">
          My relationships
        </h2>

        <p>
          Each relationship is stored independently, so one language can have more than one role in your language identity.
        </p>
      </div>

      <div
        class="language-list"
        id="language-list"
        aria-live="polite"
      >
        <p class="language-empty">
          Loading your language relationships...
        </p>
      </div>
    </section>
  `;
}


// ============================================================
// Language Relationship State
// ============================================================

function getLanguageMessageElement() {
  return document.querySelector(
    "#language-message"
  );
}


function setLanguageMessage(
  message,
  state = ""
) {
  const messageElement =
    getLanguageMessageElement();

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


function clearLanguageFieldErrors(form) {
  const fields =
    form.querySelectorAll(
      ".language-form__input"
    );

  fields.forEach((field) => {
    field.removeAttribute(
      "aria-invalid"
    );
  });
}


function setLanguageFormBusy(
  form,
  busy
) {
  const submitButton =
    form.querySelector(
      ".language-form__submit"
    );

  const fields =
    form.querySelectorAll(
      ".language-form__input"
    );

  if (submitButton) {
    submitButton.disabled =
      busy;
  }

  fields.forEach((field) => {
    field.disabled =
      busy;
  });

  form.setAttribute(
    "aria-busy",
    String(busy)
  );
}


// ============================================================
// Language Catalogue Rendering
// ============================================================

function populateLanguageCatalogue(
  languages
) {
  const select =
    document.querySelector(
      "#language-id"
    );

  if (!select) {
    return;
  }

  select.replaceChildren();

  const placeholder =
    document.createElement(
      "option"
    );

  placeholder.value = "";

  placeholder.textContent =
    languages.length
      ? "Choose a language"
      : "No active languages available";

  select.append(
    placeholder
  );

  languages.forEach((language) => {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      language.id;

    option.textContent =
      language.code
        ? `${language.name} (${language.code})`
        : language.name;

    select.append(
      option
    );
  });

  select.disabled =
    languages.length === 0;
}


// ============================================================
// Language Relationship Rendering
// ============================================================

function getRelationshipLabel(value) {
  return (
    LANGUAGE_RELATIONSHIP_OPTIONS.find(
      ([relationship]) =>
        relationship === value
    )?.[1] || value
  );
}


function renderLanguageRelationships(
  entries
) {
  const list =
    document.querySelector(
      "#language-list"
    );

  if (!list) {
    return;
  }

  list.replaceChildren();

  if (!entries.length) {
    const empty =
      document.createElement("p");

    empty.className =
      "language-empty";

    empty.textContent =
      "No language relationships yet.";

    list.append(
      empty
    );

    return;
  }

  entries.forEach((entry) => {
    const card =
      document.createElement(
        "article"
      );

    card.className =
      "language-card";

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "language-card__content";

    const heading =
      document.createElement(
        "h3"
      );

    heading.className =
      "language-card__title";

    heading.textContent =
      entry.language.name;

    const relationship =
      document.createElement(
        "p"
      );

    relationship.className =
      "language-card__relationship";

    relationship.textContent =
      getRelationshipLabel(
        entry.relationship
      );

    content.append(
      heading,
      relationship
    );

    if (entry.regionNote) {
      const region =
        document.createElement(
          "p"
        );

      region.className =
        "language-card__region";

      region.textContent =
        entry.regionNote;

      content.append(
        region
      );
    }

    const removeButton =
      document.createElement(
        "button"
      );

    removeButton.className =
      "language-card__remove";

    removeButton.type =
      "button";

    removeButton.dataset.userLanguageId =
      entry.id;

    removeButton.textContent =
      "Remove";

    removeButton.setAttribute(
      "aria-label",
      `Remove ${entry.language.name} - ${getRelationshipLabel(
        entry.relationship
      )}`
    );

    card.append(
      content,
      removeButton
    );

    list.append(
      card
    );
  });
}


// ============================================================
// Language Relationship Validation
// ============================================================

function validateLanguageForm(form) {
  const languageId =
    form.elements.languageId;

  const relationship =
    form.elements.relationship;

  const regionNote =
    form.elements.regionNote;

  const languageIdValue =
    languageId.value.trim();

  const relationshipValue =
    relationship.value
      .trim()
      .toLowerCase();

  const regionNoteValue =
    regionNote.value.trim();

  if (!languageIdValue) {
    return {
      valid: false,
      field: languageId,
      message:
        "Choose a language."
    };
  }

  if (
    !LANGUAGE_RELATIONSHIP_OPTIONS.some(
      ([value]) =>
        value === relationshipValue
    )
  ) {
    return {
      valid: false,
      field: relationship,
      message:
        "Choose a relationship."
    };
  }

  if (
    regionNoteValue.length > 120
  ) {
    return {
      valid: false,
      field: regionNote,
      message:
        "Region note must not exceed 120 characters."
    };
  }

  return {
    valid: true,
    value: {
      languageId:
        languageIdValue,
      relationship:
        relationshipValue,
      regionNote:
        regionNoteValue || null
    }
  };
}


// ============================================================
// Language Relationship Refresh
// ============================================================

async function refreshMyLanguages() {
  const data =
    await getMyLanguages();

  renderLanguageRelationships(
    data.languages
  );

  return data.languages;
}


// ============================================================
// Language Relationship Submission
// ============================================================

async function handleLanguageSubmit(
  event
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  clearLanguageFieldErrors(
    form
  );

  const result =
    validateLanguageForm(
      form
    );

  if (!result.valid) {
    markFieldInvalid(
      result.field
    );

    setLanguageMessage(
      result.message,
      "error"
    );

    return;
  }

  setLanguageFormBusy(
    form,
    true
  );

  setLanguageMessage(
    "Adding relationship..."
  );

  try {
    await addMyLanguage(
      result.value
    );

    form.elements.relationship.value =
      "";

    form.elements.regionNote.value =
      "";

    await refreshMyLanguages();

    setLanguageMessage(
      "Language relationship added.",
      "ready"
    );
  } catch (error) {
    setLanguageMessage(
      error.message,
      "error"
    );
  } finally {
    setLanguageFormBusy(
      form,
      false
    );
  }
}


// ============================================================
// Language Relationship Removal
// ============================================================

async function handleLanguageListClick(
  event
) {
  const button =
    event.target.closest(
      ".language-card__remove"
    );

  if (!button) {
    return;
  }

  const userLanguageId =
    button.dataset.userLanguageId;

  if (!userLanguageId) {
    return;
  }

  button.disabled =
    true;

  setLanguageMessage(
    "Removing relationship..."
  );

  try {
    await deleteMyLanguage(
      userLanguageId
    );

    await refreshMyLanguages();

    setLanguageMessage(
      "Language relationship removed.",
      "ready"
    );
  } catch (error) {
    button.disabled =
      false;

    setLanguageMessage(
      error.message,
      "error"
    );
  }
}


// ============================================================
// Language Relationship Initialization
// ============================================================

function initializeLanguageView() {
  const form =
    document.querySelector(
      "#language-form"
    );

  const list =
    document.querySelector(
      "#language-list"
    );

  if (form) {
    form.addEventListener(
      "submit",
      handleLanguageSubmit
    );

    const fields =
      form.querySelectorAll(
        ".language-form__input"
      );

    fields.forEach((field) => {
      field.addEventListener(
        "input",
        () => {
          field.removeAttribute(
            "aria-invalid"
          );

          setLanguageMessage("");
        }
      );

      field.addEventListener(
        "change",
        () => {
          field.removeAttribute(
            "aria-invalid"
          );

          setLanguageMessage("");
        }
      );
    });
  }

  if (list) {
    list.addEventListener(
      "click",
      handleLanguageListClick
    );
  }
}


// ============================================================
// Language Relationship View
// ============================================================

async function renderLanguagesView() {
  const route =
    routes.languages;

  const view =
    document.querySelector(
      "#app-view"
    );

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
        Language status
      </span>

      <strong>
        Loading languages...
      </strong>
    </div>
  `;

  document.title =
    `${route.title} | bahasabahasa`;

  updateNavigation(
    "languages"
  );

  document.documentElement.dataset.route =
    "languages";

  try {
    const [
      catalogueData,
      myLanguagesData
    ] = await Promise.all([
      getLanguageCatalogue(),
      getMyLanguages()
    ]);

    view.innerHTML =
      createLanguagesViewMarkup();

    populateLanguageCatalogue(
      catalogueData.languages
    );

    renderLanguageRelationships(
      myLanguagesData.languages
    );

    initializeLanguageView();
  } catch (error) {
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
        class="app-status app-status--error"
        role="alert"
      >
        <span class="app-status__label">
          Languages unavailable
        </span>

        <strong
          id="language-load-error"
        ></strong>
      </div>
    `;

    const errorElement =
      document.querySelector(
        "#language-load-error"
      );

    if (errorElement) {
      errorElement.textContent =
        error.message;
    }
  }
}

// ============================================================
// Participation Markup
// ============================================================

function createParticipationViewMarkup() {
  const route =
    routes.participation;

  return `
    <p class="app-eyebrow">
      ${route.eyebrow}
    </p>

    <h1>
      ${route.heading}
    </h1>

    <p class="app-lead">
      ${route.description}
    </p>

    <section
      class="participation-panel"
      aria-labelledby="participation-heading"
    >
      <div class="participation-panel__header">
        <h2 id="participation-heading">
          Participation interests
        </h2>

        <p>
          Choose the areas where you would like to participate.
          You can change this selection later.
        </p>
      </div>

      <form
        class="participation-form"
        id="participation-form"
        novalidate
      >
        <fieldset
          class="participation-form__fieldset"
        >
          <legend
            class="participation-form__legend"
          >
            What would you like to participate in?
          </legend>

          <div
            class="participation-options"
            id="participation-options"
          >
            ${PARTICIPATION_INTEREST_OPTIONS
              .map(
                ([value, label]) => `
                  <label
                    class="participation-option"
                  >
                    <input
                      class="participation-option__input"
                      type="checkbox"
                      name="interests"
                      value="${value}"
                    >

                    <span
                      class="participation-option__content"
                    >
                      <strong
                        class="participation-option__label"
                      >
                        ${label}
                      </strong>

                      <span
                        class="participation-option__description"
                      >
                        ${getParticipationInterestDescription(
                          value
                        )}
                      </span>
                    </span>
                  </label>
                `
              )
              .join("")}
          </div>
        </fieldset>

        <p
          class="participation-message"
          id="participation-message"
          role="status"
          aria-live="polite"
        ></p>

        <div
          class="participation-form__actions"
        >
          <button
            class="participation-form__submit"
            type="submit"
          >
            Save Interests
          </button>
        </div>
      </form>
    </section>

    <section
      class="participation-panel"
      aria-labelledby="current-interests-heading"
    >
      <div class="participation-panel__header">
        <h2 id="current-interests-heading">
          Current interests
        </h2>

        <p>
          These interests are stored with your bahasabahasa identity.
        </p>
      </div>

      <div
        class="participation-current"
        id="participation-current"
        aria-live="polite"
      >
        <p class="participation-empty">
          No participation interests selected.
        </p>
      </div>
    </section>
  `;
}


// ============================================================
// Participation Presentation
// ============================================================

function getParticipationInterestLabel(
  value
) {
  return (
    PARTICIPATION_INTEREST_OPTIONS.find(
      ([interest]) =>
        interest === value
    )?.[1] || value
  );
}


function getParticipationInterestDescription(
  value
) {
  const descriptions = {
    learn:
      "Learn languages and deepen your language knowledge.",

    teach:
      "Share language knowledge through teaching and learning activities.",

    research:
      "Participate in language research and evidence-building.",

    contribute:
      "Contribute knowledge, observations, or language data.",

    language_ai:
      "Explore responsible human participation in language and AI."
  };

  return descriptions[value] || "";
}


// ============================================================
// Participation State
// ============================================================

function getParticipationMessageElement() {
  return document.querySelector(
    "#participation-message"
  );
}


function setParticipationMessage(
  message,
  state = ""
) {
  const messageElement =
    getParticipationMessageElement();

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


function setParticipationFormBusy(
  form,
  busy
) {
  const submitButton =
    form.querySelector(
      ".participation-form__submit"
    );

  const inputs =
    form.querySelectorAll(
      ".participation-option__input"
    );

  if (submitButton) {
    submitButton.disabled =
      busy;
  }

  inputs.forEach((input) => {
    input.disabled =
      busy;
  });

  form.setAttribute(
    "aria-busy",
    String(busy)
  );
}


// ============================================================
// Participation Selection
// ============================================================

function getSelectedParticipationInterests(
  form
) {
  return Array.from(
    form.querySelectorAll(
      'input[name="interests"]:checked'
    )
  ).map(
    (input) =>
      input.value
        .trim()
        .toLowerCase()
  );
}


function populateParticipationForm(
  entries
) {
  const form =
    document.querySelector(
      "#participation-form"
    );

  if (!form) {
    return;
  }

  const selectedInterests =
    new Set(
      entries.map(
        (entry) =>
          entry.interest
      )
    );

  const inputs =
    form.querySelectorAll(
      'input[name="interests"]'
    );

  inputs.forEach((input) => {
    input.checked =
      selectedInterests.has(
        input.value
      );
  });
}


// ============================================================
// Participation Rendering
// ============================================================

function renderCurrentParticipationInterests(
  entries
) {
  const container =
    document.querySelector(
      "#participation-current"
    );

  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!entries.length) {
    const empty =
      document.createElement("p");

    empty.className =
      "participation-empty";

    empty.textContent =
      "No participation interests selected.";

    container.append(
      empty
    );

    return;
  }

  const list =
    document.createElement("ul");

  list.className =
    "participation-current__list";

  entries.forEach((entry) => {
    const item =
      document.createElement("li");

    item.className =
      "participation-current__item";

    const label =
      document.createElement("strong");

    label.className =
      "participation-current__label";

    label.textContent =
      getParticipationInterestLabel(
        entry.interest
      );

    item.append(
      label
    );

    list.append(
      item
    );
  });

  container.append(
    list
  );
}


// ============================================================
// Participation Submission
// ============================================================

async function handleParticipationSubmit(
  event
) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const interests =
    getSelectedParticipationInterests(
      form
    );

  /*
   * The backend accepts zero to five canonical interests.
   * An empty array intentionally clears the persisted set.
   */
  if (
    interests.length >
    PARTICIPATION_INTEREST_OPTIONS.length
  ) {
    setParticipationMessage(
      "Too many participation interests.",
      "error"
    );

    return;
  }

  setParticipationFormBusy(
    form,
    true
  );

  setParticipationMessage(
    interests.length
      ? "Saving participation interests..."
      : "Clearing participation interests..."
  );

  try {
    const data =
      await saveMyInterests(
        interests
      );

    populateParticipationForm(
      data.interests
    );

    renderCurrentParticipationInterests(
      data.interests
    );

    setParticipationMessage(
      interests.length
        ? "Participation interests saved."
        : "Participation interests cleared.",
      "ready"
    );
  } catch (error) {
    setParticipationMessage(
      error.message,
      "error"
    );
  } finally {
    setParticipationFormBusy(
      form,
      false
    );
  }
}


// ============================================================
// Participation Initialization
// ============================================================

function initializeParticipationView() {
  const form =
    document.querySelector(
      "#participation-form"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    handleParticipationSubmit
  );

  const inputs =
    form.querySelectorAll(
      ".participation-option__input"
    );

  inputs.forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        setParticipationMessage("");
      }
    );
  });
}


// ============================================================
// Participation View
// ============================================================

async function renderParticipationView() {
  const route =
    routes.participation;

  const view =
    document.querySelector(
      "#app-view"
    );

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
        Participation status
      </span>

      <strong>
        Loading participation interests...
      </strong>
    </div>
  `;

  document.title =
    `${route.title} | bahasabahasa`;

  updateNavigation(
    "participation"
  );

  document.documentElement.dataset.route =
    "participation";

  try {
    const data =
      await getMyInterests();

    view.innerHTML =
      createParticipationViewMarkup();

    populateParticipationForm(
      data.interests
    );

    renderCurrentParticipationInterests(
      data.interests
    );

    initializeParticipationView();
  } catch (error) {
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
        class="app-status app-status--error"
        role="alert"
      >
        <span class="app-status__label">
          Participation unavailable
        </span>

        <strong
          id="participation-load-error"
        ></strong>
      </div>
    `;

    const errorElement =
      document.querySelector(
        "#participation-load-error"
      );

    if (errorElement) {
      errorElement.textContent =
        error.message;
    }
  }
}

// ============================================================
// Application Route Dispatch
// ============================================================

function renderRoute() {
  const routeName =
    getRouteFromHash();

  if (routeName === "profile") {
    renderProfileView();

    return;
  }

  if (routeName === "languages") {
    renderLanguagesView();

    return;
  }

  if (routeName === "participation") {
    renderParticipationView();

    return;
  }

  renderView(
    routeName
  );

  updateNavigation(
    routeName
  );

  document.documentElement.dataset.route =
    routeName;
}


// ============================================================
// View Dispatch
// ============================================================

function renderCurrentView() {
  if (appMode === "auth") {
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
    appMode !== "auth" &&
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