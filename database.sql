CREATE DATABASE IF NOT EXISTS navyaflix_db;
USE navyaflix_db;
CREATE TABLE IF NOT EXISTS users(user_id INT PRIMARY KEY AUTO_INCREMENT,name VARCHAR(100) NOT NULL,email VARCHAR(150) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS movies(movie_id INT PRIMARY KEY AUTO_INCREMENT,title VARCHAR(150) NOT NULL,genre VARCHAR(150),language VARCHAR(150),duration INT,release_date DATE,poster_url VARCHAR(255),trailer_url VARCHAR(500),description TEXT);
CREATE TABLE IF NOT EXISTS shows(show_id INT PRIMARY KEY AUTO_INCREMENT,movie_id INT NOT NULL,theatre_name VARCHAR(100) NOT NULL,show_date DATE NOT NULL,show_time TIME NOT NULL,ticket_price DECIMAL(10,2) NOT NULL,total_seats INT NOT NULL DEFAULT 40,FOREIGN KEY(movie_id) REFERENCES movies(movie_id));
CREATE TABLE IF NOT EXISTS bookings(booking_id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,show_id INT NOT NULL,seats INT NOT NULL,seat_numbers VARCHAR(100) NOT NULL,total_amount DECIMAL(10,2) NOT NULL,booking_status VARCHAR(30) DEFAULT 'CONFIRMED',booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(user_id),FOREIGN KEY(show_id) REFERENCES shows(show_id));
INSERT INTO movies(title,genre,language,duration,release_date,poster_url,trailer_url,description)
SELECT 'RRR','Action • Drama','Telugu',187,'2022-03-25','/posters/rrr.svg','https://www.youtube.com/results?search_query=RRR+official+trailer','An epic action drama about friendship and rebellion.' WHERE NOT EXISTS(SELECT 1 FROM movies WHERE title='RRR');
INSERT INTO movies(title,genre,language,duration,release_date,poster_url,trailer_url,description)
SELECT 'Kalki 2898 AD','Sci-Fi • Action','Telugu',181,'2024-06-27','/posters/kalki.svg','https://www.youtube.com/results?search_query=Kalki+2898+AD+official+trailer','A futuristic science-fiction adventure.' WHERE NOT EXISTS(SELECT 1 FROM movies WHERE title='Kalki 2898 AD');
INSERT INTO movies(title,genre,language,duration,release_date,poster_url,trailer_url,description)
SELECT 'Pushpa 2: The Rule','Action • Thriller','Telugu',200,'2024-12-05','/posters/pushpa.svg','https://www.youtube.com/results?search_query=Pushpa+2+The+Rule+official+trailer','An action story of ambition and power.' WHERE NOT EXISTS(SELECT 1 FROM movies WHERE title='Pushpa 2: The Rule');
INSERT INTO movies(title,genre,language,duration,release_date,poster_url,trailer_url,description)
SELECT 'KGF Chapter 2','Action • Crime','Kannada',168,'2022-04-14','/posters/kgf.svg','https://www.youtube.com/results?search_query=KGF+Chapter+2+official+trailer','An action drama set in the gold fields.' WHERE NOT EXISTS(SELECT 1 FROM movies WHERE title='KGF Chapter 2');
INSERT INTO movies(title,genre,language,duration,release_date,poster_url,trailer_url,description)
SELECT 'Salaar','Action • Drama','Telugu',175,'2023-12-22','/posters/salaar.svg','https://www.youtube.com/results?search_query=Salaar+official+trailer','A tale of friendship, loyalty and rival kingdoms.' WHERE NOT EXISTS(SELECT 1 FROM movies WHERE title='Salaar');
INSERT INTO shows(movie_id,theatre_name,show_date,show_time,ticket_price,total_seats)
SELECT movie_id,'Navya Cinemas • Screen 1',DATE_ADD(CURDATE(),INTERVAL 1 DAY),'10:00:00',180,40 FROM movies m WHERE title='RRR' AND NOT EXISTS(SELECT 1 FROM shows s WHERE s.movie_id=m.movie_id AND s.show_date=DATE_ADD(CURDATE(),INTERVAL 1 DAY));
INSERT INTO shows(movie_id,theatre_name,show_date,show_time,ticket_price,total_seats)
SELECT movie_id,'Grand Multiplex • Screen 2',DATE_ADD(CURDATE(),INTERVAL 1 DAY),'18:30:00',220,40 FROM movies m WHERE title='Kalki 2898 AD' AND NOT EXISTS(SELECT 1 FROM shows s WHERE s.movie_id=m.movie_id AND s.show_date=DATE_ADD(CURDATE(),INTERVAL 1 DAY));
INSERT INTO shows(movie_id,theatre_name,show_date,show_time,ticket_price,total_seats)
SELECT movie_id,'Navya Cinemas • Screen 2',DATE_ADD(CURDATE(),INTERVAL 1 DAY),'13:00:00',160,40 FROM movies m WHERE title='Pushpa 2: The Rule' AND NOT EXISTS(SELECT 1 FROM shows s WHERE s.movie_id=m.movie_id AND s.show_date=DATE_ADD(CURDATE(),INTERVAL 1 DAY));
INSERT INTO shows(movie_id,theatre_name,show_date,show_time,ticket_price,total_seats)
SELECT movie_id,'Grand Multiplex • Screen 1',DATE_ADD(CURDATE(),INTERVAL 1 DAY),'16:00:00',200,40 FROM movies m WHERE title='KGF Chapter 2' AND NOT EXISTS(SELECT 1 FROM shows s WHERE s.movie_id=m.movie_id AND s.show_date=DATE_ADD(CURDATE(),INTERVAL 1 DAY));
INSERT INTO shows(movie_id,theatre_name,show_date,show_time,ticket_price,total_seats)
SELECT movie_id,'Navya Cinemas • Screen 3',DATE_ADD(CURDATE(),INTERVAL 1 DAY),'20:00:00',190,40 FROM movies m WHERE title='Salaar' AND NOT EXISTS(SELECT 1 FROM shows s WHERE s.movie_id=m.movie_id AND s.show_date=DATE_ADD(CURDATE(),INTERVAL 1 DAY));