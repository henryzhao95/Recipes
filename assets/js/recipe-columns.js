(() => {
  const recipe = document.querySelector(".recipe");
  if (!recipe) return;

  const recipeContent = recipe.querySelector(".recipe-standard-view") || recipe;
  const children = Array.from(recipeContent.children);
  const ingredientsIndex = children.findIndex(
    (element) =>
      element.tagName === "H2" && element.textContent.trim().toLowerCase() === "ingredients"
  );
  const methodIndex = children.findIndex(
    (element, index) =>
      index > ingredientsIndex &&
      element.tagName === "H2" &&
      element.textContent.trim().toLowerCase() === "method"
  );
  if (ingredientsIndex < 0 || methodIndex < 0) return;

  const workspace = document.createElement("section");
  workspace.className = "recipe-workspace";
  workspace.id = "recipe-workspace";
  workspace.setAttribute("aria-label", "Ingredients and method");
  const ingredients = document.createElement("section");
  ingredients.className = "recipe-column recipe-column--ingredients";
  ingredients.setAttribute("aria-label", "Ingredients");
  const method = document.createElement("section");
  method.className = "recipe-column recipe-column--method";
  method.setAttribute("aria-label", "Method");
  const methodPanel = document.createElement("div");
  methodPanel.className = "recipe-method-panel";
  const progress = document.createElement("div");
  progress.className = "recipe-method-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Recipe method progress");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  const progressThumb = document.createElement("span");
  progressThumb.className = "recipe-method-progress-thumb";
  progress.append(progressThumb);

  recipeContent.insertBefore(workspace, children[ingredientsIndex]);
  workspace.append(ingredients, methodPanel);
  methodPanel.append(method, progress);
  children.slice(ingredientsIndex, methodIndex).forEach((element) => {
    ingredients.append(element);
  });
  children.slice(methodIndex).forEach((element) => {
    method.append(element);
  });

  const updateProgress = () => {
    const scrollableDistance = method.scrollHeight - method.clientHeight;
    const isScrollable = scrollableDistance > 0;
    const hasOverflow =
      method.scrollHeight > window.innerHeight ||
      ingredients.scrollHeight > window.innerHeight;
    const visibleRatio = method.clientHeight / method.scrollHeight;
    const thumbSize = Math.max(8, visibleRatio * 100);
    const progressRatio = isScrollable ? method.scrollTop / scrollableDistance : 0;

    methodPanel.classList.toggle("has-overflow", isScrollable);
    document.documentElement.classList.toggle("recipe-snap", hasOverflow);
    progress.setAttribute("aria-valuenow", String(Math.round(progressRatio * 100)));
    progressThumb.style.height = `${thumbSize}%`;
    progressThumb.style.top = `${progressRatio * (100 - thumbSize)}%`;
  };

  method.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateProgress).observe(method);
    new ResizeObserver(updateProgress).observe(ingredients);
  }
  updateProgress();

  if (window.matchMedia("(min-width: 700px) and (pointer: coarse)").matches) {
    let touchStart;

    document.addEventListener(
      "touchstart",
      (event) => {
        const target = event.target;
        if (
          event.touches.length !== 1 ||
          !(target instanceof Element) ||
          target.closest(".recipe-column, a, button, input")
        ) {
          touchStart = undefined;
          return;
        }

        touchStart = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
          stage: target.closest(".recipe-intro-stage, .recipe-workspace"),
        };
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      (event) => {
        if (!touchStart || !touchStart.stage || event.changedTouches.length !== 1) return;

        const deltaX = event.changedTouches[0].clientX - touchStart.x;
        const deltaY = event.changedTouches[0].clientY - touchStart.y;
        const stage = touchStart.stage;
        touchStart = undefined;

        if (!document.documentElement.classList.contains("recipe-snap")) return;
        if (Math.abs(deltaY) < 40 || Math.abs(deltaY) <= Math.abs(deltaX) * 1.2) return;

        let nextStage;
        if (stage.matches(".recipe-intro-stage") && deltaY < 0) {
          if (stage.getBoundingClientRect().bottom <= window.innerHeight + 40) {
            nextStage = workspace;
          }
        } else if (stage.matches(".recipe-workspace") && deltaY > 0) {
          nextStage = document.querySelector(".recipe-intro-stage");
        }

        nextStage?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      { passive: true }
    );

    document.addEventListener(
      "touchcancel",
      () => {
        touchStart = undefined;
      },
      { passive: true }
    );
  }
})();
