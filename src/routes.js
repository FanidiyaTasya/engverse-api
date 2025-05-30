const usersHandler = require('./handlers/users');

const routes = [
  {
    method: 'POST',
    path: '/register',
    handler: usersHandler.register,
  },
  {
    method: 'POST',
    path: '/login',
    handler: usersHandler.login,
  }
];

module.exports = routes;
