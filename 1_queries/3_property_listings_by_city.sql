-- Shows all property listings by city. Vancouver in this example. 
-- Filtered by 4 stars, 10 results, and ordered from lowest cost to highest

SELECT properties.*, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON properties.id = property_id
WHERE city LIKE '%ancouv%'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;