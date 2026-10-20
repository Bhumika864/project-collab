const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    const isLocalDevelopmentOrigin =
      origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (!origin || configuredOrigins.includes(origin) || isLocalDevelopmentOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

module.exports = corsOptions;
