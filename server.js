// server.js – OAuth 2.0 Express Server
const express = require("express");
const OAuthServer = require("@node-oauth/express-oauth-server");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');

const app = express();

const oauth = new OAuthServer({
  model: require("./model"),
  grants: ["authorization_code"],
  accessTokenLifetime: 7200,
  refreshTokenLifetime: 14 * 24 * 60 * 60,
  allowEmptyState: false,
  allowExtendedTokenAttributes: false,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

app.post('/login', (req, res) => {
  const token = jwt.sign(
    {
      sub: 'guest',
      role: 'guest'
    },
    JWT_SECRET,
    {
      expiresIn: '1h'
    }
  );

  res.json({
    token,
    token_type: 'Bearer',
    expires_in: 3600
  });
});

app.get('/api/admin', (req, res) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ message: 'Welcome, admin' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 1. Authorization Endpoint – get authorization code
app.all(
  "/oauth/authorize",
  oauth.authorize({
    authenticateHandler: {
      handle: (req) => {
        const userId = req.query?.userId || req.body?.userId || 1;
        return {
          id: userId,
          name: `User ${userId}`,
        };
      },
    },
  })
);

// 2. Token Exchange Endpoint – exchange code for token
app.all("/oauth/token", oauth.token());

// 3. Protected Resource – requires valid access token
app.get("/api/profile", oauth.authenticate(), (req, res) => {
  const tokenRecord = res.locals.oauth.token;
  
  return res.json({ 
    user: tokenRecord.user, 
    issued_to: tokenRecord.client.id 
  });
});

app.listen(3002, () =>
  console.log("Auth server running on http://localhost:3002")
);
