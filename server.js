require("dotenv").config();
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const db = require("./db");

const app = express();
app.use(express.json());

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Rate limiter for booking endpoint ───────────────────────────────────────
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many booking attempts. Please try again later." },
});

// ── GET /api/movies ─────────────────────────────────────────────────────────
app.get("/api/movies", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, s.show_id, s.theatre_name, s.show_date,
             s.show_time, s.ticket_price, s.total_seats
      FROM movies m
      LEFT JOIN shows s ON m.movie_id = s.movie_id
      ORDER BY m.movie_id, s.show_time
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error. Check db.js and run database.sql." });
  }
});

// ── GET /api/shows/:id/seats ─────────────────────────────────────────────────
app.get("/api/shows/:id/seats", async (req, res) => {
  try {
    const [show] = await db.query(
      "SELECT total_seats FROM shows WHERE show_id = ?",
      [req.params.id]
    );
    if (!show.length) return res.status(404).json({ message: "Show not found" });

    const [bookings] = await db.query(
      "SELECT seat_numbers FROM bookings WHERE show_id = ? AND booking_status = 'CONFIRMED'",
      [req.params.id]
    );
    const bookedSeats = bookings.flatMap(b =>
      (b.seat_numbers || "").split(",").filter(Boolean)
    );

    res.json({ total_seats: show[0].total_seats, booked_seats: bookedSeats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load seats" });
  }
});

// ── POST /api/bookings ───────────────────────────────────────────────────────
app.post("/api/bookings", bookingLimiter, async (req, res) => {
  const { name, email, show_id, seat_numbers } = req.body;

  // Basic presence validation
  if (
    !name?.trim() ||
    !email?.trim() ||
    !show_id ||
    !Array.isArray(seat_numbers) ||
    !seat_numbers.length
  ) {
    return res.status(400).json({ message: "Enter name, email, show and select seats" });
  }

  // Email format validation
  if (!validator.isEmail(email.trim())) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (seat_numbers.length > 8) {
    return res.status(400).json({ message: "Maximum 8 seats per booking" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [shows] = await conn.query(
      "SELECT * FROM shows WHERE show_id = ? FOR UPDATE",
      [show_id]
    );
    if (!shows.length) throw new Error("Show not found");

    const seats = seat_numbers.map(String);
    const validSeatPattern = /^S([1-9]|[1-3][0-9]|40)$/;
    if (
      seats.some(s => !validSeatPattern.test(s)) ||
      new Set(seats).size !== seats.length
    ) {
      throw new Error("Invalid seat selection");
    }

    const [existing] = await conn.query(
      "SELECT seat_numbers FROM bookings WHERE show_id = ? AND booking_status = 'CONFIRMED'",
      [show_id]
    );
    const taken = new Set(
      existing.flatMap(b => (b.seat_numbers || "").split(","))
    );
    const clashes = seats.filter(s => taken.has(s));
    if (clashes.length) throw new Error(`${clashes.join(", ")} already booked`);

    // Upsert user
    const [userResult] = await conn.query(
      "INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
      [name.trim(), email.trim().toLowerCase()]
    );
    let userId = userResult.insertId;
    if (!userId) {
      const [found] = await conn.query(
        "SELECT user_id FROM users WHERE email = ?",
        [email.trim().toLowerCase()]
      );
      userId = found[0].user_id;
    }

    const totalAmount = Number(shows[0].ticket_price) * seats.length;
    const [inserted] = await conn.query(
      "INSERT INTO bookings (user_id, show_id, seats, seat_numbers, total_amount, booking_status) VALUES (?, ?, ?, ?, ?, 'CONFIRMED')",
      [userId, show_id, seats.length, seats.join(","), totalAmount]
    );

    await conn.commit();
    res.status(201).json({
      message: "Booking confirmed!",
      booking_id: inserted.insertId,
      seats,
      total_amount: totalAmount,
    });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ── GET /api/bookings ────────────────────────────────────────────────────────
app.get("/api/bookings", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.booking_id, b.show_id, u.name, u.email, m.title,
             s.theatre_name, s.show_date, s.show_time,
             b.seats, b.seat_numbers, b.total_amount, b.booking_status
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN shows s ON b.show_id = s.show_id
      JOIN movies m ON s.movie_id = m.movie_id
      ORDER BY b.booking_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load bookings" });
  }
});

// ── Start server ─────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`NavyaFlix running at http://localhost:${port}`));
