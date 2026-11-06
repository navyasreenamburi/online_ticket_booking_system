# NavyaFlix – Online Movie Ticket Booking System

Full-stack mini project using HTML, CSS, JavaScript, Express.js, Node.js and MySQL.

## Features
- Five preloaded movie records with locally stored poster artwork
- Trailer buttons (opens YouTube search for the official trailer)
- Sample theatres, show dates and show timings
- Interactive seat selection and automatic price calculation
- Customer details, booking confirmation and booking history
- Booked seats are disabled to prevent double booking

## Database tables
- users: user_id (PK), name, email
- movies: movie_id (PK), title, genre, language, duration, release_date
- shows: show_id (PK), movie_id (FK), theatre_name, show_date, show_time, ticket_price
- bookings: booking_id (PK), user_id (FK), show_id (FK), seats, total_amount, booking_status

Extra support fields: movies.poster_url, movies.trailer_url, movies.description; shows.total_seats; bookings.seat_numbers and booked_at.

## Setup
1. In MySQL Workbench open and execute the complete `database.sql` file, then refresh Schemas and expand `navyaflix_db` > Tables.
2. In `db.js`, replace `YOUR_MYSQL_PASSWORD` with your MySQL root password. If there is no password, use an empty string.
3. Open this folder in VS Code. In Terminal run `npm install` then `npm start`.
4. Open http://localhost:3000.

The movie posters are original decorative SVG artwork, not official studio posters. Trailer links open YouTube search results so you can choose the official trailer. Theatre and show entries are sample demonstration data.

## GitHub upload
Create an empty repository named `navyaflix-online-movie-ticket-booking`, then run:
```
git init
git add .
git commit -m "Build NavyaFlix movie ticket booking system"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/navyaflix-online-movie-ticket-booking.git
git push -u origin main
```
Replace YOUR-GITHUB-USERNAME. Do not upload private database passwords.
