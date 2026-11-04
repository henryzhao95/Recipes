(() => {
  const recipe = document.querySelector(".recipe");
  if (!recipe) return;

  const children = Array.from(recipe.children);
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
  const navigation = document.createElement("nav");
  navigation.className = "recipe-workspace-nav";
  navigation.setAttribute("aria-label", "Recipe navigation");
  navigation.innerHTML =
    '<a href="/">← All Recipes</a><a href="#recipe-overview">↑ Recipe Overview</a>';
  const recipeTitle = document.createElement("span");
  recipeTitle.className = "recipe-workspace-title";
  recipeTitle.textContent = recipe.querySelector("h1")?.textContent.trim() || "";
  recipeTitle.setAttribute("aria-hidden", "true");
  navigation.insertBefore(recipeTitle, navigation.lastElementChild);
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

  recipe.insertBefore(workspace, children[ingredientsIndex]);
  workspace.append(navigation, ingredients, methodPanel);
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
    const visibleRatio = method.clientHeight / method.scrollHeight;
    const thumbSize = Math.max(8, visibleRatio * 100);
    const progressRatio = isScrollable ? method.scrollTop / scrollableDistance : 0;

    methodPanel.classList.toggle("has-overflow", isScrollable);
    progress.setAttribute("aria-valuenow", String(Math.round(progressRatio * 100)));
    progressThumb.style.height = `${thumbSize}%`;
    progressThumb.style.top = `${progressRatio * (100 - thumbSize)}%`;
  };

  method.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateProgress).observe(method);
  }
  updateProgress();

  const updateWorkspaceTitle = () => {
    const workspaceTop = workspace.getBoundingClientRect().top;
    const isWorkspaceActive = workspaceTop >= -1 && workspaceTop <= 1;
    recipeTitle.setAttribute("aria-hidden", String(!isWorkspaceActive));
    workspace.classList.toggle("is-active", isWorkspaceActive);
  };
  let titleUpdateScheduled = false;
  const scheduleWorkspaceTitleUpdate = () => {
    if (titleUpdateScheduled) return;
    titleUpdateScheduled = true;
    window.requestAnimationFrame(() => {
      updateWorkspaceTitle();
      titleUpdateScheduled = false;
    });
  };

  window.addEventListener("scroll", scheduleWorkspaceTitleUpdate, { passive: true });
  window.addEventListener("resize", scheduleWorkspaceTitleUpdate);
  updateWorkspaceTitle();
})();
