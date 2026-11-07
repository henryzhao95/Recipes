(() => {
  const storageKey = "my-recipes-view";
  const toggle = document.querySelector("[data-recipe-view-toggle]");
  const choices = toggle
    ? Array.from(toggle.querySelectorAll("[data-recipe-view-choice]"))
    : [];
  const readPreference = () => {
    try {
      return window.sessionStorage.getItem(storageKey) === "standard" ? "standard" : "table";
    } catch (error) {
      console.warn("Could not read the recipe view preference in this browser.", error);
      return "table";
    }
  };
  const savePreference = (view) => {
    try {
      window.sessionStorage.setItem(storageKey, view);
    } catch (error) {
      console.warn("Could not save the recipe view preference in this browser.", error);
    }
  };
  const mediaStorageKey = "my-recipes-method-media-hidden";
  const readMediaHidden = () => {
    try {
      return window.sessionStorage.getItem(mediaStorageKey) === "true";
    } catch (error) {
      console.warn("Could not read the recipe media preference in this browser.", error);
      return false;
    }
  };
  const saveMediaHidden = (hidden) => {
    try {
      window.sessionStorage.setItem(mediaStorageKey, String(hidden));
    } catch (error) {
      console.warn("Could not save the recipe media preference in this browser.", error);
    }
  };
  const recipe = document.querySelector(".recipe");
  if (!recipe) {
    if (!toggle) return;
    const preference = readPreference();
    choices.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice.dataset.recipeViewChoice === preference));
      choice.addEventListener("click", () => {
        const view = choice.dataset.recipeViewChoice;
        choices.forEach((item) => {
          item.setAttribute("aria-pressed", String(item === choice));
        });
        savePreference(view);
      });
    });
    return;
  }

  const standardView = document.createElement("div");
  standardView.className = "recipe-standard-view";
  Array.from(recipe.children)
    .filter((child) => !child.matches("[data-recipe-view-toggle]"))
    .forEach((child) => standardView.append(child));
  recipe.append(standardView);
  const toolbar = document.createElement("div");
  toolbar.className = "recipe-view-toolbar";
  let mediaHidden = readMediaHidden();
  let mediaToggle;
  const pauseVisibleMedia = () => {
    recipe.querySelectorAll("video").forEach((video) => video.pause());
    recipe.querySelectorAll("iframe[data-video-src]").forEach((frame) => {
      frame.dispatchEvent(new Event("recipe-video-pause"));
    });
    recipe.querySelectorAll("dialog[open]").forEach((dialog) => {
      if (typeof dialog.close === "function") dialog.close();
    });
  };
  const updateMediaToggle = () => {
    if (!mediaToggle) return;
    mediaToggle.textContent = mediaHidden ? "Show Media" : "Hide Media";
    mediaToggle.setAttribute("aria-pressed", String(mediaHidden));
  };
  const setMediaHidden = (hidden, persist = true) => {
    mediaHidden = hidden;
    recipe.classList.toggle("recipe-media-hidden", hidden);
    if (hidden) pauseVisibleMedia();
    updateMediaToggle();
    if (persist) saveMediaHidden(hidden);
  };
  if (toggle) {
    recipe.insertBefore(toolbar, standardView);
    const allRecipesLink = document.createElement("a");
    allRecipesLink.className = "recipe-all-recipes";
    allRecipesLink.href = `${document.body.dataset.baseurl || ""}/`;
    allRecipesLink.textContent = "← All Recipes";
    const overviewLink = document.createElement("a");
    overviewLink.className = "recipe-overview-link";
    overviewLink.href = "#recipe-overview";
    overviewLink.textContent = "↑ Recipe Overview";
    overviewLink.hidden = true;
    const title = document.createElement("span");
    title.className = "recipe-toolbar-title";
    title.textContent = recipe.querySelector(".recipe-header h1")?.textContent.trim() || document.title;
    title.setAttribute("aria-hidden", "true");
    mediaToggle = document.createElement("button");
    mediaToggle.type = "button";
    mediaToggle.dataset.recipeMediaToggle = "";
    mediaToggle.addEventListener("click", () => {
      setMediaHidden(!mediaHidden);
    });
    toggle.append(mediaToggle);
    updateMediaToggle();
    toolbar.append(allRecipesLink);
    toolbar.append(toggle);
    toolbar.append(title);
    toolbar.append(overviewLink);
  }
  setMediaHidden(mediaHidden, false);

  const gridData = document.querySelector("#recipe-table-grid");
  if (!gridData) {
    const tableChoice = choices.find((choice) => choice.dataset.recipeViewChoice === "table");
    if (tableChoice) tableChoice.disabled = true;
    return;
  }

  const showError = (message) => {
    const error = document.createElement("section");
    error.className = "recipe-table-error";
    error.setAttribute("role", "alert");
    const text = document.createElement("p");
    text.textContent = message;
    error.append(text);
    standardView.before(error);
    const tableChoice = choices.find((choice) => choice.dataset.recipeViewChoice === "table");
    if (tableChoice) tableChoice.disabled = true;
  };

  let grid;
  try {
    grid = JSON.parse(gridData.textContent);
  } catch (error) {
    console.error("Could not read the recipe table mapping.", error);
    showError("The experimental table view could not read this recipe's grid data.");
    return;
  }

  const headings = Array.from(standardView.querySelectorAll("h2"));
  const ingredientsHeading = headings.find(
    (heading) => heading.textContent.trim().toLowerCase() === "ingredients"
  );
  const methodHeading = headings.find(
    (heading) => heading.textContent.trim().toLowerCase() === "method"
  );
  if (!ingredientsHeading || !methodHeading || !Array.isArray(grid)) {
    showError("The experimental table view is not configured for this recipe.");
    return;
  }

  const ingredients = [];
  let ingredientGroup = "";
  let node = ingredientsHeading.nextElementSibling;
  while (node && node !== methodHeading) {
    if (node.tagName === "H3") ingredientGroup = node.textContent.trim();
    if (node.matches("ul, ol")) {
      Array.from(node.children)
        .filter((child) => child.tagName === "LI")
        .forEach((item) => ingredients.push({ text: item.textContent.trim(), group: ingredientGroup }));
    }
    node = node.nextElementSibling;
  }

  const steps = [];
  const unassignedVideos = [];
  const getLinkedImages = (element) =>
    Array.from(element.querySelectorAll("a")).flatMap((anchor) =>
      Array.from(anchor.querySelectorAll("img"), (image) => ({
        href: anchor.href,
        src: image.src,
        alt: image.alt
      }))
    );
  const textWithoutLinkedImages = (element) => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("a").forEach((anchor) => {
      if (anchor.querySelector("img")) anchor.remove();
    });
    return clone.textContent.trim();
  };
  let currentStep;
  node = methodHeading.nextElementSibling;
  while (node && node.tagName !== "H2") {
    if (node.tagName === "H3") {
      currentStep = { title: node.textContent.trim(), paragraphs: [], videos: [], images: [] };
      steps.push(currentStep);
    } else if (node.tagName === "OL") {
      Array.from(node.children)
        .filter((child) => child.tagName === "LI")
        .forEach((item) => {
          const instruction = textWithoutLinkedImages(item);
          steps.push({
            title: `Step ${steps.length + 1}`,
            paragraphs: instruction ? [instruction] : [],
            videos: [],
            images: getLinkedImages(item)
          });
        });
      currentStep = steps[steps.length - 1];
    } else if (node.tagName === "P" && currentStep) {
      const instruction = textWithoutLinkedImages(node);
      if (instruction) currentStep.paragraphs.push(instruction);
      currentStep.images.push(...getLinkedImages(node));
    } else if (node.matches(".recipe-video-frame")) {
      if (currentStep) currentStep.videos.push(node);
      else unassignedVideos.push(node);
    }
    node = node.nextElementSibling;
  }
  steps.forEach((step) => {
    step.videos.push(...unassignedVideos);
  });

  if (
    ingredients.length === 0 ||
    steps.length === 0 ||
    grid.length !== steps.length ||
    grid.some(
      (step) =>
        !step ||
        !Array.isArray(step.ingredients) ||
        new Set(step.ingredients).size !== step.ingredients.length ||
        step.ingredients.some(
          (index) => !Number.isInteger(index) || index < 0 || index >= ingredients.length
        )
    ) ||
    steps.some((step) => step.paragraphs.length === 0)
  ) {
    showError("The experimental table mapping does not match this recipe's ingredients and steps.");
    return;
  }

  const servingControl = recipe.querySelector("[data-serving-control]");
  if (servingControl && toolbar) toolbar.append(servingControl);
  const intro = standardView.querySelector(".recipe-intro-stage").cloneNode(true);
  intro.id = "recipe-table-overview";

  const note = document.createElement("p");
  note.className = "recipe-table-note";
  note.textContent =
    "Read from left to right. Merged cells show which ingredients are handled together at each step. Scroll horizontally to see later steps.";

  const scrollRegion = document.createElement("div");
  scrollRegion.className = "recipe-table-scroll";
  scrollRegion.setAttribute("role", "region");
  scrollRegion.setAttribute("aria-label", "Tabular recipe; scroll horizontally to follow the steps");
  scrollRegion.tabIndex = 0;
  const table = document.createElement("table");
  table.className = "recipe-grid-table";
  const caption = document.createElement("caption");
  caption.textContent = `${ingredients.length} ingredients · ${steps.length} steps`;
  table.append(caption);

  const tableHead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const ingredientHeader = document.createElement("th");
  ingredientHeader.scope = "col";
  ingredientHeader.textContent = "Ingredients";
  headerRow.append(ingredientHeader);
  steps.forEach((step) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = step.title;
    headerRow.append(cell);
  });
  tableHead.append(headerRow);
  table.append(tableHead);

  const tableBody = document.createElement("tbody");
  const videoDialog = document.createElement("dialog");
  videoDialog.className = "recipe-video-dialog";
  videoDialog.setAttribute("aria-labelledby", "recipe-video-dialog-title");
  const dialogHeader = document.createElement("header");
  dialogHeader.className = "recipe-video-dialog-header";
  const dialogTitle = document.createElement("h2");
  dialogTitle.id = "recipe-video-dialog-title";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "recipe-video-dialog-close";
  closeButton.textContent = "Close";
  dialogHeader.append(dialogTitle, closeButton);
  const dialogContent = document.createElement("div");
  dialogContent.className = "recipe-video-dialog-content";
  videoDialog.append(dialogHeader, dialogContent);
  const pauseDialogVideos = () => {
    videoDialog.querySelectorAll("video").forEach((video) => video.pause());
    videoDialog.querySelectorAll("iframe[data-video-src]").forEach((frame) => {
      frame.dispatchEvent(new Event("recipe-video-pause"));
    });
    videoDialog.querySelectorAll(".recipe-video-dialog-item").forEach((item) => {
      item.hidden = true;
    });
  };
  closeButton.addEventListener("click", () => {
    pauseDialogVideos();
    videoDialog.close();
  });
  videoDialog.addEventListener("cancel", pauseDialogVideos);

  const showStepVideos = (step) => {
    dialogTitle.textContent = step.title;
    videoDialog.querySelectorAll(".recipe-video-dialog-item").forEach((item) => {
      item.hidden = !step.videoItems.includes(item);
    });
    videoDialog.showModal();
  };

  steps.forEach((step) => {
    step.videoItems = step.videos.map((source, index) => {
      const item = document.createElement("section");
      item.className = "recipe-video-dialog-item";
      item.hidden = true;
      const mediaTitle =
        source.querySelector("iframe")?.title ||
        source.querySelector("video")?.getAttribute("aria-label") ||
        `Video ${index + 1}`;
      const heading = document.createElement("h3");
      heading.textContent = mediaTitle;
      const frame = source.cloneNode(true);
      frame.querySelectorAll("video").forEach((video) => {
        video.preload = "none";
      });
      item.append(heading, frame);
      dialogContent.append(item);
      return item;
    });
  });

  videoDialog.addEventListener("click", (event) => {
    if (event.target === videoDialog) {
      pauseDialogVideos();
      videoDialog.close();
    }
  });

  const ingredientRows = ingredients.map((ingredient) => {
    const row = document.createElement("tr");
    const headerCell = document.createElement("th");
    headerCell.scope = "row";
    if (ingredient.group) {
      const group = document.createElement("span");
      group.className = "recipe-grid-ingredient-group";
      group.textContent = ingredient.group;
      headerCell.append(group);
    }
    const label = document.createElement("span");
    label.dataset.recipeIngredient = "";
    label.textContent = ingredient.text;
    headerCell.append(label);
    row.append(headerCell);
    tableBody.append(row);
    return row;
  });

  const stepRows = grid.map((step) => new Set(step.ingredients));
  const coveredThrough = steps.map(() => -1);
  ingredientRows.forEach((row, rowIndex) => {
    steps.forEach((step, stepIndex) => {
      if (rowIndex <= coveredThrough[stepIndex]) return;

      const cell = document.createElement("td");
      if (stepRows[stepIndex].has(rowIndex)) {
        let lastRow = rowIndex;
        while (stepRows[stepIndex].has(lastRow + 1)) lastRow += 1;
        cell.rowSpan = lastRow - rowIndex + 1;
        coveredThrough[stepIndex] = lastRow;
        step.paragraphs.forEach((paragraph) => {
          const text = document.createElement("p");
          text.textContent = paragraph;
          cell.append(text);
        });
        step.images.forEach(({ href, src, alt }) => {
          const link = document.createElement("a");
          link.className = "recipe-grid-step-image";
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          const image = document.createElement("img");
          image.src = src;
          image.alt = alt;
          image.loading = "lazy";
          link.append(image);
          cell.append(link);
        });
        if (step.videoItems.length > 0) {
          const videoButton = document.createElement("button");
          videoButton.type = "button";
          videoButton.className = "recipe-grid-video-button";
          videoButton.textContent =
            step.videoItems.length === 1
              ? "▶ Video"
              : `▶ Videos (${step.videoItems.length})`;
          videoButton.setAttribute("aria-label", `Show video for ${step.title}`);
          videoButton.addEventListener("click", () => showStepVideos(step));
          cell.append(videoButton);
        }
      } else {
        cell.className = "recipe-grid-empty";
        cell.setAttribute("aria-label", `No action during ${step.title}`);
      }
      row.append(cell);
    });
  });

  table.append(tableBody);
  scrollRegion.append(table);
  const tableView = document.createElement("section");
  tableView.className = "recipe-table-view";
  tableView.setAttribute("aria-label", "Experimental tabular recipe");
  tableView.append(intro, note, scrollRegion);
  const sourceGallery = standardView.querySelector(".recipe-source-gallery");
  if (sourceGallery) tableView.append(sourceGallery.cloneNode(true));
  tableView.append(videoDialog);
  recipe.append(tableView);

  const updateToolbar = () => {
    const overviewLink = toolbar.querySelector(".recipe-overview-link");
    const title = toolbar.querySelector(".recipe-toolbar-title");
    if (!overviewLink || !title) return;
    const tableSelected = !tableView.hidden;
    const contentTop = tableSelected
      ? scrollRegion.getBoundingClientRect().top
      : standardView.querySelector(".recipe-workspace")?.getBoundingClientRect().top ?? Infinity;
    const inRecipeContent =
      contentTop <= Math.max(toolbar.getBoundingClientRect().bottom + 8, window.innerHeight * 0.35);
    overviewLink.hidden = !inRecipeContent;
    title.setAttribute(
      "aria-hidden",
      String(!inRecipeContent || !window.matchMedia("(min-width: 900px)").matches)
    );
    toolbar.classList.toggle("is-content-active", inRecipeContent);
  };
  window.addEventListener("scroll", updateToolbar, { passive: true });
  window.addEventListener("resize", updateToolbar);
  window.addEventListener("DOMContentLoaded", updateToolbar, { once: true });

  const setView = (view, persist = true) => {
    const tableSelected = view === "table";
    standardView.hidden = tableSelected;
    tableView.hidden = !tableSelected;
    recipe.classList.toggle("is-table-view", tableSelected);
    const overviewLink = toolbar.querySelector(".recipe-overview-link");
    if (overviewLink) {
      overviewLink.href = tableSelected ? "#recipe-table-overview" : "#recipe-overview";
      overviewLink.hidden = true;
    }
    choices.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice.dataset.recipeViewChoice === view));
    });
    if (persist) savePreference(view);
    window.scrollTo(0, 0);
    updateToolbar();
  };

  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      setView(choice.dataset.recipeViewChoice);
    });
  });
  setView(readPreference(), false);
})();
