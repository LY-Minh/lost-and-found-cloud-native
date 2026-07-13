
function base64UrlDecode(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
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

    var now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
    }

    return payload;
}

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

    if (uri === '/health') {
        r.return(200);
        return;
    }

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

    r.headersOut['X-User-Id'] = payload.id || '';
    r.headersOut['X-User-Email'] = payload.email || '';
    r.headersOut['X-User-Role'] = payload.role || '';

    r.return(200);
}

export default { authenticate };
