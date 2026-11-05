(() => {
  const cards = Array.from(document.querySelectorAll(".recipe-card[data-total-time-minutes]"));
  const buttons = Array.from(document.querySelectorAll("[data-filter-group][data-filter-value]"));
  const status = document.querySelector("[data-filter-status]");
  const searchInput = document.querySelector("[data-recipe-search]");
  const storageKey = "my-recipes-filters";
  const selected = { category: "all", method: "all", time: "all" };
  const validFilters = {
    category: new Set(
      buttons
        .filter((button) => button.dataset.filterGroup === "category")
        .map((button) => button.dataset.filterValue)
    ),
    method: new Set(
      buttons
        .filter((button) => button.dataset.filterGroup === "method")
        .map((button) => button.dataset.filterValue)
    ),
    time: new Set(
      buttons
        .filter((button) => button.dataset.filterGroup === "time")
        .map((button) => button.dataset.filterValue)
    )
  };

  try {
    const saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "{}");
    Object.keys(selected).forEach((group) => {
      if (validFilters[group].has(saved[group])) selected[group] = saved[group];
    });
    if (searchInput && typeof saved.search === "string") searchInput.value = saved.search;
  } catch (error) {
    console.warn("Could not read the recipe filters in this browser session.", error);
  }

  const savePreferences = () => {
    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ ...selected, search: searchInput?.value || "" })
      );
    } catch (error) {
      console.warn("Could not save the recipe filters in this browser session.", error);
    }
  };

  const matchesTime = (minutes, range) => {
    if (range === "quick") return minutes > 0 && minutes <= 15;
    if (range === "medium") return minutes >= 16 && minutes <= 30;
    if (range === "long") return minutes >= 31;
    return true;
  };

  const update = () => {
    const searchTerm = searchInput?.value.trim().toLocaleLowerCase() || "";
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filterValue === selected[button.dataset.filterGroup])
      );
    });
    let visible = 0;
    cards.forEach((card) => {
      const minutes = Number(card.dataset.totalTimeMinutes);
      const categories = (card.dataset.recipeCategories || "").split("|");
      const matchesCategory =
        selected.category === "all" || categories.includes(selected.category);
      const methods = (card.dataset.recipeMethods || "").split("|");
      const matchesMethod = selected.method === "all" || methods.includes(selected.method);
      const searchableText = card.dataset.recipeSearchText || "";
      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
      const matches =
        matchesSearch &&
        matchesCategory &&
        matchesMethod &&
        matchesTime(minutes, selected.time);
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    if (status) {
      status.textContent = visible
        ? `${visible} ${visible === 1 ? "recipe" : "recipes"}`
        : "No recipes match your search and filters.";
    }
  };

  update();
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const { filterGroup, filterValue } = button.dataset;
      if (!validFilters[filterGroup]?.has(filterValue)) return;
      selected[filterGroup] = filterValue;
      savePreferences();
      update();
    });
  });

  searchInput?.addEventListener("input", () => {
    savePreferences();
    update();
  });
})();
