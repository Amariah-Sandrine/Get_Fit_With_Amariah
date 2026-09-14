/* =========================================================
   GETFITWITHAMARIAH — Personal Training
   Vanilla JS: nav, scroll reveal, gallery lightbox, video
   section, and the booking-to-WhatsApp workflow.
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     CENTRAL CONFIG — update Amariah's contact details here.
     Every WhatsApp link, tel: link, mailto: link and social
     link on the site is generated from this single object.
     ========================================================= */
  var siteConfig = {
    name: "Amariah",
    brand: "GetFitWithAmariah",
    phone: "+250783798735",
    whatsapp: "250783798735", // international format, no "+", for wa.me links
    email: "amarisandrah@gmail.com",
    instagram: "https://www.instagram.com/amaris_lean/",
    addressLabel: "Fitnesspoint",
    addressUrl: "https://www.google.com/search?client=mobilesearchapp&sca_esv=1f9121a7cdf920c7&bih=797&biw=390&channel=iss&cs=1&hl=en&rlz=1MDAPLA_enRW882RW882&v=432.9.954074404&sxsrf=APpeQntagOxkfXhA_NnZc-9HKs-aUQ9v1Q:1789037746986&kgmid=/g/11j4ww_jrz&q=Fitnesspoint&shem=epsd1,ltae,rimspwouoe&shndl=30&source=sh/x/loc/act/m1/5&kgs=5c1384ec4632b72f&utm_source=epsd1,ltae,rimspwouoe,sh/x/loc/act/m1/5#ebo=0"
  };

  /* =========================================================
     VIDEO CONFIG — the single source of truth for the Fitness
     Videos section. Each entry: { src, poster (optional),
     title, description }. Files live directly in media/,
     alongside the photos. Leave the array empty to show the
     "coming soon" placeholder state instead.
     ========================================================= */
  var SITE_VIDEOS = [
    { src: "media/Strength Sessions.mp4", title: "Strength Sessions", description: "A look inside a structured strength-training session." },
    { src: "media/Mobility & Stretching.mp4", title: "Mobility & Stretching", description: "Follow-along mobility and stretching work." },
    { src: "media/Technique Breakdowns.mp4", title: "Technique Breakdowns", description: "Form and technique, broken down step by step." },
    { src: "media/vid4.mp4", title: "Session Highlights", description: "Real training in motion — a look at a full session, start to finish." }
  ];

  /* Escapes text for safe insertion into innerHTML (attributes & text nodes). */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* Percent-encodes a local file path (spaces, etc.) for use as a src/href,
     then HTML-escapes the result so it's safe to drop into innerHTML too —
     needed because these filenames contain spaces and "&". */
  function encodeSrc(path) {
    return escapeHtml(encodeURI(path));
  }

  var qs = function (s, ctx) { return (ctx || document).querySelector(s); };
  var qsa = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- Footer year ---------- */
  var yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Wire up contact links from siteConfig ---------- */
  var whatsappHref = "https://wa.me/" + siteConfig.whatsapp;
  qsa('a[href^="https://wa.me/"]').forEach(function (a) {
    if (!a.getAttribute("href").includes("?text=")) a.setAttribute("href", whatsappHref);
  });

  qsa("#address-link, #address-link-footer").forEach(function (a) {
    a.setAttribute("href", siteConfig.addressUrl);
  });
  var addressLabelEl = qs("#address-label");
  if (addressLabelEl) addressLabelEl.textContent = siteConfig.addressLabel + " — View on Google Maps";

  /* ---------- Hero image slideshow: slides right-to-left, auto-advances ---------- */
  var heroSlides = qsa(".hero-slide");
  if (heroSlides.length > 1) {
    var heroIndex = heroSlides.findIndex(function (el) { return el.classList.contains("is-active"); });
    if (heroIndex < 0) heroIndex = 0;
    var HERO_INTERVAL = 3000;
    var HERO_TRANSITION_MS = 1000;
    var heroTimer = null;

    var advanceHero = function () {
      var nextIndex = (heroIndex + 1) % heroSlides.length;
      var current = heroSlides[heroIndex];
      var upcoming = heroSlides[nextIndex];

      // Slide the current image out to the left while the next one slides
      // in from the right.
      current.classList.remove("is-active");
      current.classList.add("is-prev");
      upcoming.classList.add("is-active");

      // Once the transition finishes, snap the old slide back to its
      // default off-screen-right position with no visible animation, so
      // it's ready to slide in again on its next turn.
      setTimeout(function () {
        current.classList.add("no-transition");
        current.classList.remove("is-prev");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { current.classList.remove("no-transition"); });
        });
      }, HERO_TRANSITION_MS + 60);

      heroIndex = nextIndex;
    };

    var startHero = function () {
      if (heroTimer) return;
      heroTimer = setInterval(advanceHero, HERO_INTERVAL);
    };
    var stopHero = function () {
      clearInterval(heroTimer);
      heroTimer = null;
    };

    // Respect reduced-motion preference: show the first image, no auto-play.
    var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) startHero();

    // Pause while the tab is hidden — no point animating (or burning
    // battery) on a page nobody is looking at; resume when visible again.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopHero();
      else if (!prefersReducedMotion) startHero();
    });
  }

  /* ---------- Header scroll state + back-to-top visibility ---------- */
  var header = qs("#site-header");
  var backToTop = qs("#back-to-top");
  var onScroll = function () {
    if (window.scrollY > 24) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");

    if (backToTop) {
      if (window.scrollY > window.innerHeight * 0.6) backToTop.classList.add("is-visible");
      else backToTop.classList.remove("is-visible");
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Back to top ---------- */
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
      var heading = qs("#page-top");
      if (heading) setTimeout(function () { heading.focus({ preventScroll: true }); }, 500);
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  var toggle = qs("#nav-toggle");
  var nav = qs("#main-nav");
  var closeNav = function () {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    qsa(".nav-link", nav).forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = qsa(".nav-link");
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- Scroll-reveal animations ---------- */
  var revealEls = qsa(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Service CTA -> pre-fill booking form ---------- */
  var serviceSelect = qs("#f-service");

  qsa("[data-service]").forEach(function (el) {
    el.addEventListener("click", function () {
      var service = el.getAttribute("data-service");
      if (serviceSelect && service) {
        setTimeout(function () { serviceSelect.value = service; }, 350);
      }
    });
  });

  /* ---------- Fitness Videos section ---------- */
  var videoGrid = qs("#video-grid");
  var videosHeading = qs("#videos-heading");
  var videosLead = qs("#videos-lead");
  function renderVideos() {
    if (!videoGrid) return;

    if (videosHeading) videosHeading.textContent = SITE_VIDEOS.length ? "Fitness videos" : "Fitness videos, coming soon";
    if (videosLead) videosLead.textContent = SITE_VIDEOS.length
      ? "A look at real training sessions — strength work, mobility and technique, in motion."
      : "Training sessions and workout videos will be available here soon — real movement, real coaching.";

    if (!SITE_VIDEOS.length) {
      var placeholders = [
        { title: "Strength Sessions", text: "Full training sessions will be posted here soon." },
        { title: "Mobility & Stretching", text: "Follow-along mobility routines are on their way." },
        { title: "Technique Breakdowns", text: "Form and technique clips will be added soon." }
      ];
      videoGrid.innerHTML = placeholders.map(function (p) {
        return (
          '<div class="video-placeholder">' +
            '<div class="video-placeholder-inner">' +
              '<svg class="icon icon-lg" aria-hidden="true"><use href="#i-play"/></svg>' +
              "<h3>" + p.title + "</h3>" +
              "<p>" + p.text + "</p>" +
            "</div>" +
          "</div>"
        );
      }).join("");
      return;
    }

    videoGrid.innerHTML = SITE_VIDEOS.map(function (v, i) {
      var poster = v.poster ? ' poster="' + encodeSrc(v.poster) + '"' : "";
      var label = escapeHtml(v.title ? v.title : "Training video " + (i + 1));
      return (
        '<article class="video-card">' +
          '<video controls preload="metadata"' + poster + ' aria-label="' + label + '">' +
            '<source src="' + encodeSrc(v.src) + '" type="video/mp4">' +
            "Your browser does not support the video tag." +
          "</video>" +
          '<div class="video-card-body">' +
            "<h3>" + label + "</h3>" +
            (v.description ? "<p>" + escapeHtml(v.description) + "</p>" : "") +
          "</div>" +
        "</article>"
      );
    }).join("");
  }
  renderVideos();

  /* ---------- Booking form validation + WhatsApp handoff ---------- */
  var form = qs("#booking-form");
  var successBox = qs("#form-success");
  var fallbackLink = qs("#whatsapp-fallback");

  var VALIDATORS = {
    name: function (v) {
      if (!v.trim()) return "Please enter your full name.";
      if (v.trim().length < 2) return "Please enter your full name.";
      return "";
    },
    phone: function (v) {
      if (!v.trim()) return "Please enter your phone number.";
      if (!/^\+?[0-9\s-]{7,16}$/.test(v.trim())) return "Please enter a valid phone number.";
      return "";
    },
    email: function (v) {
      if (!v.trim()) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Please enter a valid email address.";
      return "";
    },
    service: function (v) {
      if (!v) return "Please select a service.";
      return "";
    },
    date: function (v) {
      if (!v) return "Please choose a preferred date.";
      var chosen = new Date(v + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) return "Please choose a date that is today or later.";
      return "";
    },
    time: function (v) {
      if (!v) return "Please choose a preferred time.";
      return "";
    },
    goal: function (v) {
      if (!v.trim()) return "Please share your fitness goal.";
      if (v.trim().length < 2) return "Please share your fitness goal.";
      return "";
    }
  };

  function validateField(name, value) {
    var validator = VALIDATORS[name];
    var message = validator ? validator(value) : "";
    var field = qs("#f-" + name);
    var errorEl = qs("#err-" + name);
    if (field) field.closest(".field").classList.toggle("has-error", Boolean(message));
    if (errorEl) errorEl.textContent = message;
    return !message;
  }

  if (form) {
    // Prevent booking a date before today at the browser level too.
    var dateField = qs("#f-date");
    if (dateField) {
      var today = new Date();
      var iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      dateField.setAttribute("min", iso);
    }

    ["name", "phone", "email", "service", "date", "time", "goal"].forEach(function (name) {
      var field = qs("#f-" + name);
      if (!field) return;
      field.addEventListener("blur", function () { validateField(name, field.value); });
      field.addEventListener("input", function () {
        if (field.closest(".field").classList.contains("has-error")) validateField(name, field.value);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fields = {
        name: qs("#f-name").value,
        phone: qs("#f-phone").value,
        email: qs("#f-email").value,
        service: qs("#f-service").value,
        date: qs("#f-date").value,
        time: qs("#f-time").value,
        goal: qs("#f-goal").value
      };

      var allValid = true;
      Object.keys(fields).forEach(function (name) {
        if (!validateField(name, fields[name])) allValid = false;
      });

      if (!allValid) {
        var firstError = qs(".field.has-error input, .field.has-error select");
        if (firstError) firstError.focus();
        if (successBox) successBox.hidden = true;
        return;
      }

      var data = {
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        email: fields.email.trim(),
        service: fields.service,
        date: formatDate(fields.date),
        time: formatTime(fields.time),
        goal: fields.goal.trim(),
        message: qs("#f-message").value.trim()
      };

      var url = whatsappHref + "?text=" + encodeURIComponent(buildWhatsAppMessage(data));

      if (fallbackLink) fallbackLink.setAttribute("href", url);
      if (successBox) {
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      var opened = window.open(url, "_blank", "noopener");
      // Popup blockers return null (or, in some browsers, a closed window).
      // Either way, the visible "Open WhatsApp" fallback link above still
      // works — the visitor never has to copy anything by hand.
      if (!opened) {
        // no-op: fallback link in the success panel remains the way forward
      }

      form.reset();
      qsa(".field.has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
      qsa(".field-error", form).forEach(function (el) { el.textContent = ""; });
    });
  }

  function formatDate(isoDate) {
    if (!isoDate) return "";
    var d = new Date(isoDate + "T00:00:00");
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  }

  function formatTime(time24) {
    if (!time24) return "";
    var parts = time24.split(":");
    var h = parseInt(parts[0], 10);
    var m = parts[1] || "00";
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ":" + m + " " + suffix;
  }

  function buildWhatsAppMessage(data) {
    var lines = [
      "Hello " + siteConfig.name + ",",
      "",
      "I would like to book a training session.",
      "",
      "Booking Details:",
      "Name: " + data.name,
      "Phone: " + data.phone,
      "Email: " + data.email,
      "Service: " + data.service,
      "Preferred Date: " + data.date,
      "Preferred Time: " + data.time,
      "Fitness Goal: " + data.goal
    ];
    if (data.message) lines.push("Additional Message: " + data.message);
    lines.push("", "Thank you.");
    return lines.join("\n");
  }

  /* =========================================================
     REVIEWS — backed by a Google Sheet via a Google Apps Script
     Web App (see apps-script/Code.gs for the deployed script).
     Reviews themselves are no longer stored in localStorage —
     they live in the Sheet so every visitor, on any device or
     browser, sees the same list.

     PASTE YOUR DEPLOYED APPS SCRIPT WEB APP URL BELOW. Until a
     real URL is set, the section shows a friendly placeholder
     instead of a broken fetch.
     ========================================================= */
  var REVIEWS_API_URL = "https://script.google.com/macros/s/AKfycbw-p9cxqQkvO27K-oVE2DGLisCbueVj8sSBf5DtSTAj69mN3rXCWDFuFEBxbphacDsyQQ/exec";

  // The only thing still kept in localStorage is a per-browser list of
  // review IDs this visitor has already marked "Helpful" — this is just a
  // UI nicety to stop repeat clicks on the same device; it holds no review
  // content, and the real helpful count always lives in the Sheet.
  var VOTED_KEY = "gfwa_reviews_voted";
  function loadVoted() {
    try { return JSON.parse(localStorage.getItem(VOTED_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveVoted(ids) {
    try { localStorage.setItem(VOTED_KEY, JSON.stringify(ids)); } catch (e) {}
  }

  // Only ever render a social link if it's a genuine http/https URL —
  // reviews are now public, shared, server-stored content, so a submitted
  // value is untrusted input and must never be dropped into href as-is.
  function safeSocialHref(url) {
    if (!url) return "";
    var trimmed = String(url).trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) trimmed = "https://" + trimmed;
    try {
      var parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
      return parsed.href;
    } catch (e) {
      return "";
    }
  }

  function formatReviewDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function starsHtml(count) {
    var html = '<span class="review-stars" aria-label="' + count + ' out of 5 stars">';
    for (var i = 1; i <= 5; i++) {
      html += '<svg class="icon' + (i <= count ? '' : ' empty') + '" aria-hidden="true"><use href="#i-star"/></svg>';
    }
    return html + '</span>';
  }

  // In-memory cache of whatever the Sheet last returned, plus the
  // visitor's chosen sort order — re-rendered locally without refetching.
  var reviewsCache = [];
  var reviewsSort = "latest"; // "latest" | "top"

  function sortReviews(list) {
    var copy = list.slice();
    if (reviewsSort === "top") {
      copy.sort(function (a, b) {
        var diff = (b.helpful || 0) - (a.helpful || 0);
        return diff !== 0 ? diff : new Date(b.date) - new Date(a.date);
      });
    } else {
      copy.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    }
    return copy;
  }

  function renderReviews() {
    var reviewsList = qs("#reviews-list");
    var reviewsControls = qs("#reviews-controls");
    var reviewsCount = qs("#reviews-count");
    if (!reviewsList) return;

    var sorted = sortReviews(reviewsCache);
    var voted = loadVoted();

    if (reviewsControls) reviewsControls.hidden = reviewsCache.length === 0;
    if (reviewsCount) reviewsCount.textContent = reviewsCache.length + (reviewsCache.length === 1 ? " review" : " reviews");

    if (!sorted.length) {
      reviewsList.innerHTML = '<p class="reviews-empty">No reviews yet. Be the first to share your experience!</p>';
      return;
    }

    reviewsList.innerHTML = sorted.map(function (r) {
      var href = safeSocialHref(r.social);
      var authorHtml = href
        ? '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(r.name) + '</a>'
        : escapeHtml(r.name);
      var hasVoted = voted.indexOf(r.id) !== -1;
      return (
        '<article class="review-card" data-id="' + escapeHtml(r.id) + '">' +
          '<div class="review-card-header">' +
            '<span class="review-author">' + authorHtml + '</span>' +
            '<div class="review-meta">' +
              starsHtml(r.stars || 5) +
              '<span class="review-date">' + formatReviewDate(r.date) + '</span>' +
            '</div>' +
          '</div>' +
          '<p class="review-body">' + escapeHtml(r.message) + '</p>' +
          '<div class="review-helpful">' +
            '<button class="helpful-btn' + (hasVoted ? ' is-voted' : '') + '" data-id="' + escapeHtml(r.id) + '" aria-label="Mark as helpful">' +
              '&#128077; Helpful (' + (r.helpful || 0) + ')' +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    qsa(".helpful-btn", reviewsList).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var voted = loadVoted();
        if (voted.indexOf(id) !== -1) return;

        // Optimistic UI update so it feels instant...
        var rev = reviewsCache.find(function (r) { return r.id === id; });
        if (rev) rev.helpful = (rev.helpful || 0) + 1;
        voted.push(id);
        saveVoted(voted);
        renderReviews();

        // ...then persist the vote to the Sheet in the background.
        postToReviewsApi({ action: "helpful", id: id }).catch(function () {
          // If this fails silently, the count simply resyncs on next load.
        });
      });
    });
  }

  qsa(".sort-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      reviewsSort = btn.getAttribute("data-sort") === "top" ? "top" : "latest";
      qsa(".sort-btn").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      renderReviews();
    });
  });

  function reviewsApiConfigured() {
    return Boolean(REVIEWS_API_URL) && REVIEWS_API_URL.indexOf("PASTE_") !== 0;
  }

  // Sends a POST to the Apps Script Web App. Deliberately left without a
  // Content-Type header — with a plain string body, fetch defaults to
  // "text/plain", which keeps this a CORS "simple request" (no preflight),
  // matching how the Apps Script doPost below reads e.postData.contents.
  function postToReviewsApi(payload) {
    if (!reviewsApiConfigured()) return Promise.reject(new Error("Reviews API not configured."));
    return fetch(REVIEWS_API_URL, { method: "POST", body: JSON.stringify(payload) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || data.success === false) throw new Error((data && data.error) || "Request failed.");
        return data;
      });
  }

  function fetchReviews() {
    var reviewsList = qs("#reviews-list");
    if (!reviewsList) return;

    if (!reviewsApiConfigured()) {
      reviewsList.innerHTML = '<p class="reviews-empty">Reviews aren&rsquo;t connected yet.</p>';
      return;
    }

    reviewsList.innerHTML = '<p class="reviews-empty">Loading reviews&hellip;</p>';

    fetch(REVIEWS_API_URL + "?action=list")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || data.success === false) throw new Error((data && data.error) || "Request failed.");
        reviewsCache = Array.isArray(data.reviews) ? data.reviews : [];
        renderReviews();
      })
      .catch(function () {
        reviewsList.innerHTML = '<p class="reviews-empty">Couldn&rsquo;t load reviews right now. Please try again later.</p>';
      });
  }

  var reviewForm = qs("#review-form");
  if (reviewForm) {
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = qs("#rv-name");
      var socialEl = qs("#rv-social");
      var messageEl = qs("#rv-message");
      var nameErr = qs("#rv-err-name");
      var msgErr = qs("#rv-err-message");
      var submitBtn = reviewForm.querySelector('button[type="submit"]');
      var valid = true;

      var nameField = nameEl ? nameEl.closest(".field") : null;
      var msgField = messageEl ? messageEl.closest(".field") : null;

      if (!nameEl || !nameEl.value.trim()) {
        if (nameErr) nameErr.textContent = "Please enter your full name.";
        if (nameField) nameField.classList.add("has-error");
        valid = false;
      } else {
        if (nameErr) nameErr.textContent = "";
        if (nameField) nameField.classList.remove("has-error");
      }

      if (!messageEl || !messageEl.value.trim()) {
        if (msgErr) msgErr.textContent = "Please write your review.";
        if (msgField) msgField.classList.add("has-error");
        valid = false;
      } else {
        if (msgErr) msgErr.textContent = "";
        if (msgField) msgField.classList.remove("has-error");
      }

      if (!valid) return;

      var payload = {
        action: "add",
        name: nameEl.value.trim(),
        social: socialEl && socialEl.value.trim() ? socialEl.value.trim() : "",
        message: messageEl.value.trim(),
        stars: 5,
        // Visitor's current device date/time, sent as-is to be stored in the Sheet.
        date: new Date().toISOString()
      };

      if (submitBtn) submitBtn.disabled = true;

      postToReviewsApi(payload)
        .then(function () {
          reviewForm.reset();
          fetchReviews();
          var list = qs("#reviews-list");
          if (list) list.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function () {
          if (msgErr) msgErr.textContent = "Something went wrong submitting your review. Please try again.";
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  fetchReviews();

  /* ---------- Gallery lightbox ---------- */
  var lightboxBackdrop = qs("#lightbox-backdrop");
  var lightboxImg = qs("#lightbox-img");
  var lastFocused = null;

  function openBackdrop(backdrop) {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    requestAnimationFrame(function () { backdrop.classList.add("is-visible"); });
    document.body.style.overflow = "hidden";
  }
  function closeBackdrop(backdrop) {
    backdrop.classList.remove("is-visible");
    document.body.style.overflow = "";
    setTimeout(function () {
      backdrop.hidden = true;
      if (lastFocused) lastFocused.focus();
    }, 300);
  }

  if (lightboxBackdrop && lightboxImg) {
    qsa(".gallery-item[data-full]").forEach(function (item) {
      var open = function () {
        lightboxImg.src = item.getAttribute("data-full");
        var img = item.querySelector("img");
        lightboxImg.alt = img ? img.alt : "";
        openBackdrop(lightboxBackdrop);
      };
      item.addEventListener("click", open);
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    var lightboxClose = qs("#lightbox-close");
    if (lightboxClose) lightboxClose.addEventListener("click", function () { closeBackdrop(lightboxBackdrop); });
    lightboxBackdrop.addEventListener("click", function (e) {
      if (e.target === lightboxBackdrop) closeBackdrop(lightboxBackdrop);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightboxBackdrop.hidden) closeBackdrop(lightboxBackdrop);
    });
  }
})();
