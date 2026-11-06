const grid      = document.getElementById("movieGrid");
const topGrid   = document.getElementById("topMovies");
const select    = document.getElementById("showSelect");
const seatGrid  = document.getElementById("seatGrid");

const chosen = new Set();
let shows  = [];
let price  = 0;
let busy   = false;

// ── Lookup tables ────────────────────────────────────────────────────────────
const posterByTitle = {
  "rrr":               "posters/rrr.png",
  "kalki 2898 ad":     "posters/kalki.png",
  "pushpa 2: the rule":"posters/pushpa.png",
  "kgf chapter 2":     "posters/kgf.png",
  "salaar":            "posters/salaar.png",
};
const trailerByTitle = {
  "rrr":               "https://www.youtube.com/watch?v=NgBoMJy386M",
  "kalki 2898 ad":     "https://www.youtube.com/watch?v=y1-w1kUGuz8",
  "pushpa 2: the rule":"https://www.youtube.com/watch?v=g3JUbgOHgdw",
  "kgf chapter 2":     "https://www.youtube.com/watch?v=JKa05nyUmuQ",
  "salaar":            "https://www.youtube.com/watch?v=4GPvYMKtrtI",
};
const ratingByTitle = {
  "kgf chapter 2":      8.2,
  "rrr":                7.8,
  "pushpa 2: the rule": 7.6,
  "kalki 2898 ad":      7.0,
  "salaar":             6.5,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const money = n =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n) || 0);

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

const fmtDate = d =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// ── Show inline message (replaces alert) ─────────────────────────────────────
function showMsg(text, type = "") {
  const el = document.getElementById("bookingMessage");
  if (!el) return;
  el.className  = type;
  el.textContent = text;
}

// ── Build a movie card ───────────────────────────────────────────────────────
function renderCard(movie, showRating = false) {
  const title   = String(movie.title).trim().toLowerCase();
  const poster  = posterByTitle[title]  || movie.poster_url;
  const trailer = trailerByTitle[title] || movie.trailer_url;
  const rating  = ratingByTitle[title];
  return `<article class="movie">
    <div class="poster">
      <img src="${esc(poster)}" alt="${esc(movie.title)} poster">
      ${showRating && rating
        ? `<span class="rating-badge">★ ${rating.toFixed(1)} <small>DEMO RATING</small></span>`
        : ""}
    </div>
    <div class="movieinfo">
      <h3>${esc(movie.title)}</h3>
      <div class="meta">${esc(movie.genre)}<br>${esc(movie.language)} · ${movie.duration} min</div>
      <div class="actions">
        <a target="_blank" rel="noopener" href="${esc(trailer)}">▶ Trailer</a>
        <a class="book-link" href="booking.html?movieId=${encodeURIComponent(movie.movie_id)}">Book now</a>
      </div>
    </div>
  </article>`;
}

// ── Fetch movies — shared between movies page and booking page ───────────────
async function fetchMovies() {
  const response = await fetch("/api/movies");
  const rows     = await response.json();
  if (!response.ok) throw new Error(rows.message);
  return rows;
}

// ── Render movies grid (movies.html) and top-picks (index.html) ──────────────
async function movies() {
  try {
    const rows = await fetchMovies();
    const list = [...new Map(rows.map(m => [m.movie_id, m])).values()];
    shows = rows.filter(s => s.show_id);

    if (grid) {
      const countEl = document.getElementById("movieCount");
      if (countEl) countEl.textContent = `${list.length} FEATURED FILMS`;

      // Also update hero stats if present (index.html)
      const heroStat = document.querySelector(".stats b:first-child");
      if (heroStat) {
        heroStat.innerHTML = `${list.length}<small>FEATURED MOVIES</small>`;
      }

      grid.innerHTML = list.map(m => renderCard(m)).join("");
    }

    if (topGrid) {
      const topPicks = [...list].sort((a, b) => {
        const ra = ratingByTitle[String(a.title).trim().toLowerCase()] || 0;
        const rb = ratingByTitle[String(b.title).trim().toLowerCase()] || 0;
        return rb - ra;
      });
      topGrid.innerHTML = topPicks.map(m => renderCard(m, true)).join("");
    }
  } catch (err) {
    if (grid)    grid.textContent    = err.message;
    if (topGrid) topGrid.textContent = err.message;
  }
}

// ── Update seat summary totals ───────────────────────────────────────────────
function updateTotal() {
  const summaryEl = document.getElementById("seatSummary");
  const totalEl   = document.getElementById("totalAmount");
  if (summaryEl) summaryEl.textContent = `${chosen.size} seat(s) selected`;
  if (totalEl)   totalEl.textContent   = money(chosen.size * price);
}

// ── Load seat map for selected show ─────────────────────────────────────────
async function seats() {
  const id = select.value;
  chosen.clear();
  seatGrid.innerHTML = "";

  if (!id) {
    seatGrid.textContent = "Select a show to view seats.";
    price = 0;
    updateTotal();
    return;
  }
  if (busy) return;
  busy = true;

  try {
    const show = shows.find(s => s.show_id === Number(id));
    if (!show) throw new Error("The selected show is unavailable.");
    price = Number(show.ticket_price);

    const response = await fetch(`/api/shows/${encodeURIComponent(id)}/seats`);
    const data     = await response.json();
    if (!response.ok) throw new Error(data.message);

    const booked = new Set(data.booked_seats);
    for (let n = 1; n <= data.total_seats; n++) {
      const value  = `S${n}`;
      const btn    = document.createElement("button");
      btn.className   = "seat";
      btn.textContent = value;
      btn.type        = "button";

      if (booked.has(value)) {
        btn.classList.add("booked");
        btn.disabled = true;
      } else {
        btn.onclick = () => {
          if (chosen.has(value)) {
            chosen.delete(value);
            btn.classList.remove("selected");
          } else if (chosen.size < 8) {
            chosen.add(value);
            btn.classList.add("selected");
          } else {
            // Inline message instead of alert()
            showMsg("You can select a maximum of 8 seats.", "error");
          }
          updateTotal();
        };
      }
      seatGrid.appendChild(btn);
    }
    updateTotal();
  } catch (err) {
    seatGrid.textContent = err.message;
  } finally {
    busy = false;
  }
}

// ── Populate show dropdown — reuses fetchMovies() ────────────────────────────
async function initializeBooking() {
  const rows = await fetchMovies();           // single fetch, shared with movies()
  shows = rows.filter(s => s.show_id);

  select.innerHTML =
    '<option value="">Select a movie show</option>' +
    shows.map(s =>
      `<option value="${s.show_id}">${esc(s.title)} · ${esc(s.theatre_name)} · ${fmtDate(s.show_date)} ${String(s.show_time).slice(0, 5)} · ${money(s.ticket_price)}</option>`
    ).join("");

  const movieId = new URLSearchParams(window.location.search).get("movieId");
  if (movieId) {
    const match = shows.find(s => s.movie_id === Number(movieId));
    if (match) select.value = match.show_id;
  }
  await seats();
}

// ── Booking history ──────────────────────────────────────────────────────────
async function history() {
  const body = document.getElementById("bookingRows");
  if (!body) return;

  try {
    const response = await fetch("/api/bookings");
    const bookings = await response.json();
    if (!response.ok) throw new Error(bookings.message);

    body.innerHTML = bookings.length
      ? bookings.map(b => `<tr>
          <td>#${b.booking_id}</td>
          <td>${esc(b.name)}<br>${esc(b.email)}</td>
          <td>${esc(b.title)}</td>
          <td>${esc(b.theatre_name)}<br>${fmtDate(b.show_date)} · ${String(b.show_time).slice(0, 5)}</td>
          <td>${esc(b.seat_numbers)}</td>
          <td>${money(b.total_amount)}</td>
          <td>${esc(b.booking_status)}</td>
        </tr>`).join("")
      : '<tr><td colspan="7">No bookings yet. Book your first movie!</td></tr>';
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7">${esc(err.message)}</td></tr>`;
  }
}

// ── Confirm booking ──────────────────────────────────────────────────────────
async function confirmBooking() {
  const name  = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();

  if (!name || !email || !select.value || !chosen.size) {
    showMsg("Enter your name and email, select a show and choose seats.", "error");
    return;
  }

  const btn = document.getElementById("confirmBtn");
  btn.disabled    = true;
  btn.textContent = "Booking…";
  showMsg("Confirming booking...");

  try {
    const response = await fetch("/api/bookings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name,
        email,
        show_id:      Number(select.value),
        seat_numbers: [...chosen],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    showMsg(
      `${data.message} Booking #${data.booking_id} · Seats ${data.seats.join(", ")} · ${money(data.total_amount)}`,
      "success"
    );
    chosen.clear();
    await seats();
    await history();
  } catch (err) {
    showMsg(err.message, "error");
    await seats();
  } finally {
    btn.disabled    = false;
    btn.textContent = "Confirm Booking";
  }
}

// ── Set active nav link ──────────────────────────────────────────────────────
(function setActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
})();

// ── Init ─────────────────────────────────────────────────────────────────────
if (grid || topGrid) movies();

if (select && seatGrid) {
  select.onchange = seats;
  initializeBooking().catch(err => {
    select.innerHTML = '<option value="">Shows could not be loaded</option>';
    seatGrid.textContent = err.message;
  });
  document.getElementById("confirmBtn").onclick = confirmBooking;
}

const refreshBookings = document.getElementById("refreshBookings");
if (refreshBookings) refreshBookings.onclick = history;

history();
