(function () {
  try {
    var stored = window.localStorage.getItem("helenastudy.theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (error) {
    // Sem localStorage disponível: a página segue o tema do sistema.
  }

  var fontPreload = document.getElementById("google-fonts-preload");
  if (fontPreload) {
    fontPreload.addEventListener(
      "load",
      function () {
        fontPreload.rel = "stylesheet";
      },
      { once: true },
    );
  }
})();
