-- reveals average length of stay from 

 SELECT avg(end_date - start_date) AS average_duration
 FROM reservations;