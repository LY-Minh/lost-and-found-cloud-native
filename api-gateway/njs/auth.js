/**
 * njs script — API Gateway token validation + Role-Based Access Control (RBAC).
 *
 * Deployed in Kubernetes as the AUTH VALIDATOR. The Ingress calls GET /auth-check
 * (via its `auth-url` annotation) BEFORE forwarding any protected request to a
 * backend. This script answers:
 *   200 -> allow  (Ingress forwards the request; X-User-* headers are copied up)
 *   401 -> deny   (missing / invalid / expired token)
 *   403 -> deny   (valid token, wrong role)
 *
 * Uses only njs-compatible APIs (nginx-mod-http-js on Alpine).
 *
 * ROLE MODEL — matches the consolidated /<service>/<role>/... path scheme:
 *   /health                 -> open (probes)
 *   /<service>/admin/...    -> valid token + role === 'admin'
 *   /<service>/student/...  -> valid token + role === 'student'
 *   everything else         -> valid token, any role
 * i.e. the 2nd path segment names the required role.
 * (Login/register are NOT special-cased here: the PUBLIC Ingress object routes
 *  them without an auth-url subrequest, so they never hit this validator.)
 */

// Decode a base64url segment (JWT parts are base64url, not standard base64).
function base64UrlDecode(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (b64.length % 4) {
        case 2: b64 += '=='; break;
        case 3: b64 += '='; break;
    }
    return Buffer.from(b64, 'base64').toString();
}

// Verify an HS256 JWT signature + expiry and return the decoded payload.
function verify(token, secret) {
    var parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }

    var signatureInput = parts[0] + '.' + parts[1];
    var signature = parts[2];

    var crypto = require('crypto');
    var hmac = crypto.createHmac('sha256', secret);
    hmac.update(signatureInput);
    var expectedSignature = hmac.digest('base64url');

    if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
    }

    var payload = JSON.parse(base64UrlDecode(parts[1]));

    // Reject expired tokens.
    var now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
    }

    return payload;
}

// Recover the ORIGINAL request path. ingress-nginx sends the full original URL
// in X-Original-URL (e.g. "http://lostfound.com/catalog/admin/items"); some
// setups use X-Original-URI (path only). Strip scheme+host and any query string.
function originalPath(r) {
    var raw = r.headersIn['X-Original-URL'] ||
              r.headersIn['X-Original-URI'] ||
              r.uri || '';
    var path = raw;
    var scheme = path.indexOf('://');
    if (scheme !== -1) {
        var afterHost = path.substring(scheme + 3);
        var slash = afterHost.indexOf('/');
        path = slash === -1 ? '/' : afterHost.substring(slash);
    }
    var q = path.indexOf('?');
    if (q !== -1) path = path.substring(0, q);
    return path;
}

function authenticate(r) {
    var uri = originalPath(r);

    // /health stays open (direct probe calls). NOTE: login/register never reach
    // this validator at all — the PUBLIC Ingress object routes them with no
    // auth-url annotation. Anything that DOES arrive here (including non-login
    // /auth/* routes on the protected Ingress) must present a valid token.
    if (uri === '/health') {
        r.return(200);
        return;
    }

    // Everything else requires a valid Bearer token.
    var authHeader = r.headersIn['Authorization'];
    if (!authHeader || authHeader.indexOf('Bearer ') !== 0) {
        r.return(401, JSON.stringify({ message: 'Access denied. No token provided.' }));
        return;
    }

    var token = authHeader.split(' ')[1];
    var secret = process.env.JWT_SECRET || 'lost-and-found-secret-key';

    var payload;
    try {
        payload = verify(token, secret);
    } catch (e) {
        r.return(401, JSON.stringify({ message: 'Invalid or expired token', error: e.message }));
        return;
    }

    // RBAC by the 2nd path segment: /<service>/<role>/...
    // segments: ['', '<service>', '<roleOrAction>', ...]
    var segments = uri.split('/');
    var roleSegment = segments[2];
    if (roleSegment === 'admin' && payload.role !== 'admin') {
        r.return(403, JSON.stringify({ message: 'Access denied. Admin only.' }));
        return;
    }
    if (roleSegment === 'student' && payload.role !== 'student') {
        r.return(403, JSON.stringify({ message: 'Access denied. Student only.' }));
        return;
    }

    // Allowed — expose identity to backends. The Ingress copies these onto the
    // upstream request via auth-response-headers (X-User-Id, X-User-Email, X-User-Role).
    r.headersOut['X-User-Id'] = payload.id || '';
    r.headersOut['X-User-Email'] = payload.email || '';
    r.headersOut['X-User-Role'] = payload.role || '';

    r.return(200);
}

export default { authenticate };
