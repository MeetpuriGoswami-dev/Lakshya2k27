// Lakshya 2027 - one script shared by all three pages.
// Each feature checks that its elements exist, so it only runs on the page that needs it.

// ===== Settings =====
// PLACEHOLDER date for the countdown: change it to the real Lakshya start date.
var EVENT_DATE = new Date("2027-03-20T09:00:00+05:30");
var STORAGE_KEY = "lakshya-registrations";
var THEME_KEY = "lakshya-theme";

// Restore the saved theme straight away so the page does not flash the wrong colours.
try {
  var savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
} catch (error) {
  // Storage can be blocked; the default theme is fine.
}

document.addEventListener("DOMContentLoaded", function () {
  setupThemeToggle();
  setupCountdown(); // Home page
  setupEventFilter(); // Events page
  setupRegistrationForm(); // Register page
});

// ===== Dark / light mode toggle (all pages) =====
function setupThemeToggle() {
  var button = document.getElementById("theme-toggle");
  if (!button) return;

  button.addEventListener("click", function () {
    var root = document.documentElement;
    var nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      // Ignore: the toggle still works for this visit.
    }
  });
}

// ===== JS feature 1 (Home): live countdown timer =====
function setupCountdown() {
  var countdown = document.getElementById("countdown");
  if (!countdown) return;

  var daysEl = document.getElementById("countdown-days");
  var hoursEl = document.getElementById("countdown-hours");
  var minutesEl = document.getElementById("countdown-minutes");
  var secondsEl = document.getElementById("countdown-seconds");
  var timerId;

  function twoDigits(number) {
    return String(number).padStart(2, "0");
  }

  function updateCountdown() {
    var msLeft = EVENT_DATE.getTime() - Date.now();

    if (msLeft <= 0) {
      countdown.innerHTML = '<p class="tagline">Lakshya has begun!</p>';
      clearInterval(timerId);
      return;
    }

    var totalSeconds = Math.floor(msLeft / 1000);
    daysEl.textContent = twoDigits(Math.floor(totalSeconds / 86400));
    hoursEl.textContent = twoDigits(Math.floor((totalSeconds % 86400) / 3600));
    minutesEl.textContent = twoDigits(Math.floor((totalSeconds % 3600) / 60));
    secondsEl.textContent = twoDigits(totalSeconds % 60);

    // Restart the small "tick" animation on the seconds digit.
    secondsEl.classList.remove("tick");
    void secondsEl.offsetWidth;
    secondsEl.classList.add("tick");
  }

  updateCountdown();
  timerId = setInterval(updateCountdown, 1000);
}

// ===== JS feature 2 (Events): category filter buttons =====
function setupEventFilter() {
  var buttons = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".card");
  var statusText = document.getElementById("filter-status");
  if (buttons.length === 0) return;

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var chosen = button.dataset.filter;
      var visibleCount = 0;

      buttons.forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === button));
      });

      cards.forEach(function (card) {
        var matches = chosen === "All" || card.dataset.category === chosen;
        card.hidden = !matches;
        if (matches) visibleCount++;
      });

      statusText.textContent = visibleCount === 0 ? "No events in this category yet." : "";
    });
  });
}

// ===== JS feature 3 (Register): form validation =====
function setupRegistrationForm() {
  var form = document.getElementById("register-form");
  if (!form) return;

  var successMessage = document.getElementById("success-message");
  var savedCount = document.getElementById("saved-count");

  // Each rule returns an error message, or "" when the value is fine.
  var rules = {
    name: function (value) {
      return value ? "" : "Enter your full name.";
    },
    email: function (value) {
      if (!value) return "Enter your email address.";
      var looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      return looksValid ? "" : "Enter a valid email, like you@college.edu.";
    },
    phone: function (value) {
      if (!value) return "Enter your phone number.";
      return /^\d{10}$/.test(value) ? "" : "Phone number must be exactly 10 digits.";
    },
    college: function (value) {
      return value ? "" : "Enter your college name.";
    },
    event: function (value) {
      return value ? "" : "Select an event.";
    },
  };

  function readSavedRegistrations() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function showSavedCount() {
    var total = readSavedRegistrations().length;
    var plural = total === 1 ? "" : "s";
    savedCount.textContent = total
      ? total + " registration" + plural + " saved in this browser."
      : "";
  }

  // Validate one field, show or clear its error, and return true when it is valid.
  function validateField(fieldName) {
    var input = form.elements[fieldName];
    var message = rules[fieldName](input.value.trim());
    document.getElementById(fieldName + "-error").textContent = message;
    input.closest(".form-field").classList.toggle("has-error", message !== "");
    input.setAttribute("aria-invalid", String(message !== ""));
    return message === "";
  }

  Object.keys(rules).forEach(function (fieldName) {
    var input = form.elements[fieldName];
    input.addEventListener("blur", function () {
      validateField(fieldName);
    });
    input.addEventListener("input", function () {
      if (input.closest(".form-field").classList.contains("has-error")) validateField(fieldName);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    successMessage.classList.remove("show");

    var allValid = true;
    Object.keys(rules).forEach(function (fieldName) {
      if (!validateField(fieldName)) allValid = false;
    });

    if (!allValid) {
      form.querySelector(".has-error input, .has-error select").focus();
      return;
    }

    var registration = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      college: form.elements.college.value.trim(),
      event: form.elements.event.value,
      savedAt: new Date().toISOString(),
    };

    var saved = readSavedRegistrations();
    saved.push(registration);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {
      // Storage blocked: the success message still shows, nothing is saved.
    }

    var firstName = registration.name.split(" ")[0];
    successMessage.textContent =
      "You're in, " + firstName + ". See you at " + registration.event + ".";
    successMessage.classList.add("show");
    form.reset();
    showSavedCount();
  });

  showSavedCount();
}
