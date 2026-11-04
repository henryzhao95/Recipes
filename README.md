# My Recipes

A small recipe website generated from Markdown with Jekyll and deployed to GitHub Pages.

## Add a recipe

Create a Markdown file in `_recipes/`, for example `_recipes/roasted-tomatoes.md`:

```markdown
---
title: Roasted Tomatoes
description: Slow-roasted tomatoes with herbs.
category: Sides
prep_time: 10 minutes
cook_time: 1 hour
servings: 4
---

## Ingredients

- 500 g tomatoes
- 2 tablespoons olive oil
- Salt and herbs

## Method

1. Heat the oven to 150°C.
2. Season the tomatoes and roast until soft and caramelized.
```

The front matter fields other than `title` are optional. Recipes appear on the home page and at `/recipes/<filename>/`.

The servings control remembers your last selection in this browser and applies it to other recipes.

## Experimental table view

Use the **Standard / Table** view toggle on the home page or a recipe page to choose a recipe layout for the current browser tab. Table is the default, and your choice is saved for the tab's session and carries across recipes. Home-page filters are also restored while you navigate in that tab. The table places ingredients in rows and cooking steps in columns, merging cells for ingredients handled together. Cells for steps with video clips include a button to open them in a dialog. Scroll horizontally to move through later steps.

## Add a recipe with AI

Ask Copilot to add a recipe from its source URL. The workspace [`recipe-ingestion` skill](.github/skills/recipe-ingestion/SKILL.md) guides AI through full step extraction, metric quantities, concise titles, linked images and step videos, and a site build check. Recipe Markdown files live in `_recipes/`.

## Preview locally

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll serve --baseurl ""
```

Open the local address printed by Jekyll (usually `http://127.0.0.1:4000`).

## Publish with GitHub Pages

Push the `main` branch to GitHub and enable **Settings → Pages → Build and deployment → GitHub Actions**. The workflow in `.github/workflows/pages.yml` builds and deploys the site on each push to `main`.
