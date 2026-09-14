const routes = {
  home: {
    title: "Home",
    eyebrow: "Jawa Timur Language Lab",
    heading: "Build your language identity.",
    description:
      "Tell BahasaBahasa how you relate to language, what you want to participate in, and where you want to begin."
  },

  profile: {
    title: "Profile",
    eyebrow: "Your Identity",
    heading: "Tell us who you are.",
    description:
      "Your profile will become the human foundation for your participation in BahasaBahasa."
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
      "Choose how you want to participate in the BahasaBahasa language infrastructure."
  },

  lab: {
    title: "Language Lab",
    eyebrow: "Jawa Timur Language Lab",
    heading: "A place for language to become participation.",
    description:
      "Explore, contribute, and ask as the Language Lab grows into a living human language infrastructure."
  }
};

const DEFAULT_ROUTE = "home";

function getRouteFromHash() {
  const route = window.location.hash
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

  return routes[route]
    ? route
    : DEFAULT_ROUTE;
}

function renderView(routeName) {
  const route = routes[routeName];
  const view = document.querySelector("#app-view");

  if (!view) {
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

    <div class="app-status" role="status">
      <span class="app-status__label">
        View status
      </span>

      <strong>
        ${route.title}
      </strong>
    </div>
  `;

  document.title =
    `${route.title} | BahasaBahasa`;

}

function updateNavigation(routeName) {
  const links =
    document.querySelectorAll(".app-nav__link");

  links.forEach((link) => {
    const linkRoute =
      link.getAttribute("href")
        ?.replace(/^#/, "");

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

function renderRoute() {
  const routeName =
    getRouteFromHash();

  renderView(routeName);
  updateNavigation(routeName);

  document.documentElement.dataset.route =
    routeName;
}

function initializeApp() {
  if (!window.location.hash) {
    window.location.replace(
      `${window.location.pathname}#${DEFAULT_ROUTE}`
    );

    return;
  }

  renderRoute();
}

window.addEventListener(
  "hashchange",
  renderRoute
);

initializeApp();