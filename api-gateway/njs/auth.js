/**
 * njs script for JWT validation and Role-Based Access Control (RBAC).
 *
 * Uses only njs-compatible APIs for maximum compatibility with the
 * nginx-mod-http-js package on Alpine.
 *
 * Access levels (determined by URL prefix):
 *   /auth/*       → Open (no token needed)
 *   /admin/*      → Valid token + role === 'admin'
 *   /student/*    → Valid token + role === 'student'
 *   Everything else → Valid token, any role
 */

function base64UrlDecode(str) {
    // Convert base64url to standard base64
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' if needed
    switch (b64.length % 4) {
        case 2: b64 += '=='; break;
        case 3: b64 += '='; break;
    }
    return Buffer.from(b64, 'base64').toString();
}

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

    // Check expiration
    var now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
    }

    return payload;
}

function authenticate(r) {
    // When called as a subrequest via auth_request, r.uri is
    // "/auth-check".  The original URI is passed in the
    // X-Original-URI header by the /auth-validate proxy block.
    var uri = r.headersIn['X-Original-URI'] || r.uri;
    // /auth/* routes are open — no token needed
    if (uri.startsWith('/auth/')) {
        r.return(200);
        return;
    }

    // /health endpoint is open
    if (uri === '/health') {
        r.return(200);
        return;
    }

    // All other routes require a valid token
    var authHeader = r.headersIn['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    // Role-based access control based on URL prefix
    if (uri.startsWith('/admin/')) {
        if (payload.role !== 'admin') {
            r.return(403, JSON.stringify({ message: 'Access denied. Admin only.' }));
            return;
        }
    } else if (uri.startsWith('/student/')) {
        if (payload.role !== 'student') {
            r.return(403, JSON.stringify({ message: 'Access denied. Student only.' }));
            return;
        }
    }

    // Block external access to internal routes
    if (uri.startsWith('/internal/')) {
        r.return(403, JSON.stringify({ message: 'Access denied. Internal route.' }));
        return;
    }

    // Set user info headers for downstream services
    r.headersOut['X-User-Id'] = payload.id || '';
    r.headersOut['X-User-Email'] = payload.email || '';
    r.headersOut['X-User-Role'] = payload.role || '';

    r.return(200);
}

export default { authenticate };

