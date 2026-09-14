const app = {
  status: "foundation"
};

function initializeApp() {
  document.documentElement.dataset.appStatus =
    app.status;
}

initializeApp();