(() => {
  const frames = Array.from(
    document.querySelectorAll(".recipe-video-frame iframe[data-video-src]")
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ratios = new Map();
  let activeFrame = null;

  const videoUrl = (frame) => {
    const url = new URL(frame.dataset.videoSrc);
    if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
      url.searchParams.set("enablejsapi", "1");
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("mute", "1");
    }
    return url;
  };

  const sendCommand = (frame, command, args = []) => {
    if (!frame.contentWindow || frame.dataset.loaded !== "true") {
      return;
    }
    frame.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: command, args }),
      videoUrl(frame).origin
    );
  };

  const startTime = (frame) => Number(videoUrl(frame).searchParams.get("start")) || 0;

  const activate = (frame) => {
    if (activeFrame === frame) {
      return;
    }

    if (activeFrame && activeFrame !== frame) {
      sendCommand(activeFrame, "pauseVideo");
      activeFrame.closest(".recipe-video-frame").classList.remove("is-playing");
    }

    activeFrame = frame;
    const container = frame.closest(".recipe-video-frame");
    container.classList.add("is-active");

    if (frame.dataset.loaded !== "true") {
      if (frame.dataset.loading === "true") {
        return;
      }
      frame.dataset.loading = "true";
      container.classList.add("is-loading");
      frame.src = videoUrl(frame).href;
      return;
    }

    container.classList.add("is-playing");
    sendCommand(frame, "mute");
    if (frame.dataset.restartOnLoad === "true") {
      sendCommand(frame, "seekTo", [startTime(frame), true]);
      frame.dataset.restartOnLoad = "false";
    }
    sendCommand(frame, "playVideo");
  };

  const restart = (frame) => {
    if (activeFrame !== frame) {
      frame.dataset.restartOnLoad = "true";
      activate(frame);
      return;
    }
    if (frame.dataset.loaded !== "true") {
      frame.dataset.restartOnLoad = "true";
      return;
    }
    sendCommand(frame, "seekTo", [startTime(frame), true]);
    sendCommand(frame, "playVideo");
  };

  const pause = (frame) => {
    sendCommand(frame, "pauseVideo");
    frame.closest(".recipe-video-frame").classList.remove("is-active", "is-playing");
    if (activeFrame === frame) {
      activeFrame = null;
    }
  };

  frames.forEach((frame) => {
    const container = frame.closest(".recipe-video-frame");
    const placeholder = document.createElement("button");
    const playIcon = document.createElement("span");
    const prompt = document.createElement("span");
    const videoId = new URL(frame.dataset.videoSrc).pathname.split("/").pop();
    const poster = document.createElement("img");

    placeholder.type = "button";
    placeholder.className = "recipe-video-placeholder";
    placeholder.setAttribute("aria-label", `Play ${frame.title}`);
    playIcon.className = "recipe-video-play-icon";
    playIcon.setAttribute("aria-hidden", "true");
    playIcon.textContent = "▶";
    prompt.className = "recipe-video-prompt";
    prompt.textContent = "Scroll to play this step";
    poster.className = "recipe-video-poster";
    poster.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
    poster.alt = "";
    poster.loading = "lazy";
    poster.decoding = "async";
    placeholder.append(poster, playIcon, prompt);
    placeholder.addEventListener("click", () => activate(frame));
    container.prepend(placeholder);

    const restartButton = document.createElement("button");
    restartButton.type = "button";
    restartButton.className = "recipe-video-restart";
    restartButton.textContent = "Restart this step";
    restartButton.setAttribute("aria-label", `Restart ${frame.title}`);
    restartButton.addEventListener("click", () => restart(frame));
    container.append(restartButton);

    frame.addEventListener("load", () => {
      if (frame.dataset.loading !== "true") {
        return;
      }
      frame.dataset.loading = "false";
      frame.dataset.loaded = "true";
      container.classList.remove("is-loading");
      if (activeFrame === frame) {
        container.classList.add("is-playing");
        sendCommand(frame, "mute");
        if (frame.dataset.restartOnLoad === "true") {
          sendCommand(frame, "seekTo", [startTime(frame), true]);
          frame.dataset.restartOnLoad = "false";
        }
        sendCommand(frame, "playVideo");
      }
    });
  });

  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const nextFrame = frames.reduce(
          (best, frame) => {
            const ratio = ratios.get(frame) || 0;
            return ratio > best.ratio ? { frame, ratio } : best;
          },
          { frame: null, ratio: 0 }
        );

        if (nextFrame.ratio >= 0.35) {
          activate(nextFrame.frame);
        } else if (activeFrame) {
          pause(activeFrame);
        }
      },
      { threshold: [0, 0.35, 0.6] }
    );

    frames.forEach((frame) => observer.observe(frame));
  }

  document.querySelectorAll(".recipe-video-frame video").forEach((video) => {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          video.muted = true;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch((error) => {
              console.warn("Recipe video autoplay was blocked; use the player controls.", error);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.5] }
    );
    observer.observe(video);
  });
})();
