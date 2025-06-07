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
    method: 'GET',
    path: '/',
    handler: () => {
      return { message: 'Halo dari backend di Railway!' };
    }
  }
];

module.exports = routes;
