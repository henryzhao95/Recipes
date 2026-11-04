(() => {
  const storageKey = "my-recipes-servings";
  const control = document.querySelector("[data-serving-control]");
  const recipe = document.querySelector(".recipe");
  if (!control || !recipe) return;

  const input = control.querySelector("[data-serving-input]");
  const baseServings = Number(control.dataset.baseServings);
  const ingredientHeading = Array.from(recipe.querySelectorAll("h2")).find(
    (heading) => heading.textContent.trim().toLowerCase() === "ingredients"
  );
  if (!input || !Number.isFinite(baseServings) || baseServings < 1 || !ingredientHeading) return;

  const ingredientItems = [];
  let node = ingredientHeading.nextElementSibling;
  while (node && node.tagName !== "H2") {
    if (node.matches("ul, ol")) {
      ingredientItems.push(...node.querySelectorAll(":scope > li"));
    }
    node = node.nextElementSibling;
  }

  const fractions = {
    "¼": 0.25,
    "½": 0.5,
    "¾": 0.75,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875
  };
  const amountPattern = "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])";
  const leadingAmount = new RegExp(
    `^(\\s*(?:about|approximately)\\s+)?(${amountPattern})(?:\\s*(?:-|–|—|\\bto\\b)\\s*(${amountPattern}))?(?=\\s|$)`,
    "i"
  );
  const fractionsByValue = Object.entries(fractions);

  const parseAmount = (value) => {
    const compact = value.trim().replace(/\s+/g, " ");
    if (compact in fractions) return fractions[compact];
    if (compact.includes("/")) {
      const [whole, fraction] = compact.split(" ");
      const [numerator, denominator] = (fraction || whole).split("/").map(Number);
      if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
      return fraction ? Number(whole) + numerator / denominator : numerator / denominator;
    }
    const amount = Number(compact);
    return Number.isFinite(amount) ? amount : null;
  };

  const formatAmount = (value) => {
    if (value <= 0) return String(Number(value.toFixed(2)));
    const whole = Math.floor(value);
    const remainder = value - whole;
    const closest = fractionsByValue.reduce(
      (best, [glyph, fraction]) =>
        Math.abs(remainder - fraction) < Math.abs(remainder - best.fraction)
          ? { glyph, fraction }
          : best,
      { glyph: "", fraction: 0 }
    );
    if (Math.abs(remainder - closest.fraction) <= 0.015 && closest.glyph) {
      return whole ? `${whole} ${closest.glyph}` : closest.glyph;
    }
    return String(Number(value.toFixed(2)));
  };

  const formatIngredient = (original, servings) => {
    const match = original.match(leadingAmount);
    if (!match) return original;

    const [, prefix = "", firstText, secondText] = match;
    const firstAmount = parseAmount(firstText);
    if (firstAmount === null) return original;

    const scaledFirst = formatAmount((firstAmount * servings) / baseServings);
    const prefixLength = prefix.length;
    if (!secondText) {
      return `${original.slice(0, prefixLength)}${scaledFirst}${original.slice(prefixLength + firstText.length)}`;
    }

    const secondAmount = parseAmount(secondText);
    if (secondAmount === null) return original;
    const rangePattern = new RegExp(
      `^${amountPattern}\\s*(-|–|—|\\bto\\b)\\s*${amountPattern}`,
      "i"
    );
    const rangeMatch = original.slice(prefixLength).match(rangePattern);
    if (!rangeMatch) return original;
    const separator = rangeMatch[1];
    const separatorIndex = rangeMatch[0].indexOf(separator);
    const secondStart = separatorIndex + separator.length;
    const secondMatch = rangeMatch[0].slice(secondStart).match(new RegExp(`^\\s*${amountPattern}`, "i"));
    if (!secondMatch) return original;

    const replacement = `${scaledFirst} ${separator} ${formatAmount((secondAmount * servings) / baseServings)}`;
    return `${original.slice(0, prefixLength)}${replacement}${original.slice(prefixLength + rangeMatch[0].length)}`;
  };

  ingredientItems.forEach((item) => {
    item.dataset.originalIngredient = item.textContent.trim();
  });

  const update = (persist = true) => {
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 100;
    const requested = Number(input.value);
    const servings = Math.min(max, Math.max(min, Math.round(requested || baseServings)));
    input.value = String(servings);
    ingredientItems.forEach((item) => {
      const original = item.dataset.originalIngredient;
      item.textContent =
        servings === baseServings ? original : formatIngredient(original, servings);
    });
    if (persist) {
      try {
        window.localStorage.setItem(storageKey, String(servings));
      } catch (error) {
        console.warn("Could not save the serving preference in this browser.", error);
      }
    }
  };

  try {
    const savedServings = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(savedServings) && savedServings > 0) {
      input.value = String(savedServings);
    }
  } catch (error) {
    console.warn("Could not read the saved serving preference in this browser.", error);
  }

  input.addEventListener("input", update);
  control.querySelectorAll("[data-serving-adjust]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = String(Number(input.value) + Number(button.dataset.servingAdjust));
      update();
    });
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey || event.newValue === null) return;
    const servings = Number(event.newValue);
    if (Number.isFinite(servings) && servings > 0) {
      input.value = String(servings);
      update(false);
    }
  });
  update(false);
})();
