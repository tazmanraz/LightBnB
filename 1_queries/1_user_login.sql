-- reveals user login info from email

SELECT id, name, email, password
FROM users
WHERE email = 'tristanjacobs@gmail.com';
