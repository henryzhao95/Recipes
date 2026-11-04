(() => {
  const cards = Array.from(document.querySelectorAll(".recipe-card[data-total-time-minutes]"));
  const buttons = Array.from(document.querySelectorAll("[data-filter-group][data-filter-value]"));
  const status = document.querySelector("[data-filter-status]");
  const selected = { category: "all", method: "all", time: "all" };

  const matchesTime = (minutes, range) => {
    if (range === "quick") return minutes > 0 && minutes <= 15;
    if (range === "medium") return minutes >= 16 && minutes <= 30;
    if (range === "long") return minutes >= 31;
    return true;
  };

  const update = () => {
    let visible = 0;
    cards.forEach((card) => {
      const minutes = Number(card.dataset.totalTimeMinutes);
      const categories = (card.dataset.recipeCategories || "").split("|");
      const matchesCategory =
        selected.category === "all" || categories.includes(selected.category);
      const methods = (card.dataset.recipeMethods || "").split("|");
      const matchesMethod = selected.method === "all" || methods.includes(selected.method);
      const matches = matchesCategory && matchesMethod && matchesTime(minutes, selected.time);
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    if (status) {
      status.textContent = visible
        ? `${visible} ${visible === 1 ? "recipe" : "recipes"}`
        : "No recipes match these filters.";
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const { filterGroup, filterValue } = button.dataset;
      selected[filterGroup] = filterValue;
      buttons
        .filter((candidate) => candidate.dataset.filterGroup === filterGroup)
        .forEach((candidate) => {
          candidate.setAttribute("aria-pressed", String(candidate === button));
        });
      update();
    });
  });
})();
