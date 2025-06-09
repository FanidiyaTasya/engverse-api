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
  },
  {
    method: 'POST',
    path: '/logout',
    handler: usersHandler.logout,
  },
  {
    method: 'GET',
    path: '/',
    handler: () => ({ message: 'Halo dari backend di Railway!' }),
  },
];

module.exports = routes;
