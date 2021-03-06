// These are no longer needed as our database is fully connected
// const properties = require('./json/properties.json');
// const users = require('./json/users.json');

// Node-postgres module to work with our SQL database
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  // Our query using node-postgres. The $ sign formatting is to prevent SQL injection which
  // is followed by a second parameter as an array of the query item to actually look for
  // [email] in this case
  return pool
  .query(`
  SELECT * 
  FROM users 
  WHERE email = $1;
  `, [email])
  .then((result) => {
    return result.rows[0] || null;
  })
  .catch((err) => {
    console.log(err.message);
  });


}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool
  .query(`
  SELECT * 
  FROM users 
  WHERE id = $1;
  `, [id])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });

}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  
  // Destructuring user object keys as variables so we can put them in parameterized query 
  const { name, email, password } = user;
  
  return pool
  .query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `, [name, email, password])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  return pool
  .query(`
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `, [guest_id, limit])
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  // 1
  const queryParams = [];

  // Function that appends an AND or WHERE to our database entry dependig if other parts
  // were filled in the form
  const searchParams = function(field) {
    queryParams.push(field);
    if (queryParams.length >= 1) {
      queryString += "AND";
    } else {
      queryString += "WHERE";
    }
  }

  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id 
  `;

  // 3 - Search parameters that get appended if the user adds them in when searching
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  
  if (options.owner_id) {
    searchParams(options.owner_id);
    queryString += ` owner_id = $${queryParams.length} `
  }

  if (options.minimum_price_per_night) {
    searchParams(options.minimum_price_per_night * 100);
    queryString += ` cost_per_night >= $${queryParams.length} `
  }

  if (options.maximum_price_per_night) {
    searchParams(options.maximum_price_per_night * 100);
    queryString += ` cost_per_night <= $${queryParams.length} `
  }

  if (options.minimum_rating) {
    searchParams(options.minimum_rating);
    queryString += ` rating >= $${queryParams.length} `
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  
  // 5
  //console.log(queryString, queryParams);
  
  // 6
  return pool.query(queryString, queryParams)
  .then((res) => res.rows)
  .catch((err) => {
    console.log(err.message);
  });


}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  // Destructuring property object keys as variables so we can put them in parameterized query 
  const { 
    title, 
    description, 
    thumbnail_photo_url,  
    cover_photo_url, cost_per_night, 
    parking_spaces, number_of_bathrooms, 
    number_of_bedrooms, 
    country, 
    street, 
    city, 
    province, 
    post_code 
  } = property;
  
  return pool
  .query(`
  INSERT INTO properties (title, description, thumbnail_photo_url,  cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  RETURNING *;
  `, [
    title, 
    description, 
    thumbnail_photo_url,  
    cover_photo_url, 
    cost_per_night, 
    parking_spaces, 
    number_of_bathrooms, 
    number_of_bedrooms, 
    country, 
    street, 
    city, 
    province, 
    post_code
  ])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.addProperty = addProperty;
