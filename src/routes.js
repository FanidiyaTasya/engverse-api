const practiceHandler = require('./handlers/practice');
const usersHandler = require('./handlers/users');
const authMiddleware = require('./middlewares/authorization');

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
    method: 'POST',
    path: '/practice/{section}',
    handler: practiceHandler.startPracticeSession,
    options: {
      pre: [authMiddleware],
    }
  },
  {
    method: 'GET',
    path: '/practice/{sessionId}',
    handler: practiceHandler.getPracticeSession,
    options: {
      pre: [authMiddleware],
    }
  },
  {
    method: 'POST',
    path: '/answer',
    options: {
      pre: [authMiddleware],
    },
    handler: practiceHandler.submitAnswer,
  },
  {
    method: 'POST',
    path: '/submit',
    options: {
      pre: [authMiddleware],
    },
    handler: practiceHandler.submitSession,
  }
];

module.exports = routes;
