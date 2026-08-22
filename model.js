// model.js – In‑memory OAuth 2.0 data model
const codes = [];
const accessTokens = []; // Store Access Tokens here cleanly
const refreshTokens = []; // Store Refresh Tokens here cleanly

const clients = [
  {
    id: "osc-client",
    clientSecret: "osc-secret-123",
    grants: ["authorization_code"],
    redirectUris: ["http://localhost:8888/callback"],
  },
];

module.exports = {
  getClient: async (clientId, clientSecret) => {
    return clients.find(
      (c) =>
        c.id === clientId && (!clientSecret || c.clientSecret === clientSecret)
    );
  },

  saveAuthorizationCode: async (code, client, user) => {
    const authCode = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      client: { id: client.id },
      user: user,
    };
    codes.push(authCode);
    return authCode;
  },

  getAuthorizationCode: async (authorizationCode) => {
    return codes.find((c) => c.authorizationCode === authorizationCode);
  },

  revokeAuthorizationCode: async (code) => {
    const index = codes.findIndex(
      (c) => c.authorizationCode === code.authorizationCode
    );
    if (index !== -1) codes.splice(index, 1);
    return true;
  },

  saveToken: async (token, client, user) => {
    const activeClient = client || token.client || { id: "osc-client" };
    const activeUser = user || token.user || { id: 1, name: "admin" };

    // 1. Save the Access Token
    const accessTokenRecord = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt || new Date(Date.now() + 7200000),
      client: { id: activeClient.id },
      user: activeUser,
    };
    accessTokens.push(accessTokenRecord);

    // 2. Save the Refresh Token separately if it exists
    if (token.refreshToken) {
      const refreshTokenRecord = {
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt || new Date(Date.now() + 1209600000),
        client: { id: activeClient.id },
        user: activeUser,
      };
      refreshTokens.push(refreshTokenRecord);
    }

    // 3. Return the composite object layout the framework expects
    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: accessTokenRecord.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      client: { id: activeClient.id },
      user: activeUser,
    };
  },

  getAccessToken: async (accessToken) => {
    const found = accessTokens.find((t) => t.accessToken === accessToken);
    if (!found) return false;

    return {
      accessToken: found.accessToken,
      accessTokenExpiresAt: found.accessTokenExpiresAt instanceof Date 
        ? found.accessTokenExpiresAt 
        : new Date(found.accessTokenExpiresAt),
      client: { id: found.client?.id || "osc-client" },
      user: found.user || { id: 1, name: "admin" }
    };
  },

  getRefreshToken: async (refreshToken) => {
    const found = refreshTokens.find((t) => t.refreshToken === refreshToken);
    if (!found) return false;

    return {
      refreshToken: found.refreshToken,
      refreshTokenExpiresAt: found.refreshTokenExpiresAt instanceof Date 
        ? found.refreshTokenExpiresAt 
        : new Date(found.refreshTokenExpiresAt),
      client: { id: found.client?.id || "osc-client" },
      user: found.user || { id: 1, name: "admin" }
    };
  },
};
