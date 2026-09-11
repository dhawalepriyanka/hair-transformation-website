const createCorsOptions = (env = process.env) => {
  const allowedOrigins = new Set((env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',').map(origin => origin.trim()).filter(Boolean));
  allowedOrigins.add('https://hair-transformation-website.vercel.app');
  allowedOrigins.add('https://hair-transformation-website-git-main-dhawalepriyankas-projects.vercel.app');

  // Trust only this deployment's exact Vercel-provided addresses, never *.vercel.app.
  for (const name of ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    const hostname = env[name];
    if (hostname && /^[a-z0-9-]+\.vercel\.app$/i.test(hostname)) {
      allowedOrigins.add(`https://${hostname}`);
    }
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      const error = new Error('This website address is not supported. Please sign in at https://hair-transformation-website.vercel.app/admin/login');
      error.status = 403;
      return callback(error);
    }
  };
};

module.exports = { createCorsOptions };
