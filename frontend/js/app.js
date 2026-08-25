const navToggle = document.querySelector(".nav-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");

navToggle.addEventListener("click", function () {
    const isOpen = primaryNavigation.classList.toggle("is-open");

    navToggle.setAttribute("aria-expanded", isOpen);
});

const navLinks = primaryNavigation.querySelectorAll("a");

navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        primaryNavigation.classList.remove("is-open");

        navToggle.setAttribute("aria-expanded", "false");
    });
});