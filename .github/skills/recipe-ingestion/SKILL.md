---
name: recipe-ingestion
description: "Use when adding, importing, or editing recipes from a URL or source page in this Jekyll site. Covers metric ingredients, detailed methods, concise titles, source-linked hero images, step videos, categories, and cook-time metadata."
---

# Recipe Ingestion

Add recipes by researching the source page and writing a reviewed Markdown file in `_recipes/`. Do not use the Python importer unless explicitly requested; AI-assisted extraction and editing is preferred.

## Workflow

1. Read the source recipe page, including its full detailed **Steps** or method section, not just a recipe-card summary. Prefer explicit step text and step-specific video data over a condensed overview.
2. Create one `_recipes/<descriptive-slug>.md` file. Use the site's existing recipe files as the format reference.
3. Keep the title concise and useful. Remove promotional prefixes, personal names, subtitles, and trailing phrases that do not distinguish the dish. Apply this editorial judgment in the recipe Markdown, not in an importer.
4. Include source attribution and recipe metadata in YAML front matter:
   - `title`
   - `source_url`
   - `hero_image` and `hero_image_alt` when the source has a suitable image
   - `categories`, using `Protein` and/or `Vegetables` where applicable
   - `tags` for useful cooking methods written as readable labels, such as `Stir Fry`, `Air Fry`, or `Boil`
   - `prep_time`, `cook_time`, `total_time`, and `servings` when available
5. Keep `prep_time` and `cook_time` as simple numbers followed by `minute` or `minutes` (for example, `"7 minutes"`). The home page adds them together for the total-time tag and filters; if the source provides only an overall duration, set `total_time` and the home page uses it as a fallback.
6. Store `servings` as a numeric count (or a count followed by a label, such as `"4 servings"`). The recipe page uses it as the baseline for the servings scaler.
7. When adding a recipe with an experimental table view, add a `table_grid` front-matter list with one entry per rendered method step, in order. Each entry's `ingredients` array contains zero-based indexes into the direct ingredient list items under `## Ingredients` (section headings do not count). Map every ingredient involved in that step; adjacent ingredient rows are merged in the table. The number of entries must match the method steps.
8. Write a clear ingredient list with a leading numeric quantity when one applies, followed by metric units (g, kg, ml, L) or a count unit. The servings scaler multiplies leading numbers and ranges; qualitative amounts such as "salt to taste" stay unchanged. Convert source amounts carefully, round practical quantities, retain counts where appropriate, and convert oven temperatures to Celsius. Do not silently guess when a conversion is ambiguous.
9. Write a complete, concise method in your own words. Preserve the source's sequence, meaningful times and temperatures, and actionable details. Remove narrative, promotional commentary, personal anecdotes, and unrelated tips. Do not reduce a detailed steps section to a few generic steps.
10. Hotlink the original hero image and any available step-specific source photos; never download or add source media files to the project. Link each step photo to its original image URL and place it with the matching method step. Set `source_url` for attribution; the recipe layout displays the original-recipe link and links the hero image to its source, opening both in a new tab. Do not add a duplicate source paragraph to the recipe body.
11. When a step has a source video, place that step's video directly below its instructions. Reuse the original hosted video and its precise step segment; do not copy video files. YouTube step embeds must be lazy-loaded by the site's video player using `data-video-src`, not an eager `src`:

   ```html
   <div class="recipe-video-frame"><iframe data-video-src="https://www.youtube.com/embed/VIDEO_ID?start=START&amp;end=END" title="Step name — Recipe title" loading="lazy" data-autoplay-video allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
   ```

   Use `start` and `end` offsets from the source's clip metadata when available. Do not attach the full video to every step if only step-specific clips are available.
12. Build the site with `bundle exec jekyll build`. Check that the generated page has the expected title, metric ingredients, all method steps, images, and video clips, and that the prep-plus-cook total is present on the home page. Open the experimental table view and verify its ingredient mappings when `table_grid` is present.

## Existing site behavior

- Recipe files are Markdown in `_recipes/` and use the `recipe` layout by default.
- Home-page category filters use the `categories` list; method filters use `tags`; time filters use the sum of `prep_time` and `cook_time`.
- The servings control remembers the selected count in browser storage and applies it across recipe pages.
- Linked step photos appear in both Standard and Table recipe views.
- Video players show a preview, load YouTube only when activated by scrolling or a manual click, and pause the previously active video.
- Keep media externally hosted and retain clear attribution to the original recipe.
