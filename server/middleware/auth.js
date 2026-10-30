import crypto from 'crypto';

// Session tokens are HMAC-signed with JWT_SECRET (set it in server/.env and on Render).
// Without it a random secret is used, which signs everyone out when the server restarts.
// Read lazily: ES module imports run before dotenv.config() in index.js
const FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');
let warned = false;
function getSecret() {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (!warned) {
        console.warn('⚠️ [Auth] JWT_SECRET is not set - sessions will reset on every server restart.');
        warned = true;
    }
    return FALLBACK_SECRET;
}
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signToken(userId) {
    const payload = b64url(JSON.stringify({ uid: Number(userId), exp: Date.now() + TOKEN_TTL_MS }));
    const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

export function verifyToken(token = '') {
    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (!data.uid || data.exp < Date.now()) return null;
        return { id: data.uid };
    } catch {
        return null;
    }
}

// Attaches req.user when a valid "Authorization: Bearer <token>" header is present
export function attachUser(req, res, next) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
        req.user = verifyToken(header.slice(7)) || undefined;
    }
    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in again.' } });
    }
    next();
}

// Passwords are stored as "scrypt$<salt>$<hash>"
export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

export function isHashed(stored = '') {
    return String(stored).startsWith('scrypt$');
}

export function verifyPassword(password, stored = '') {
    if (!isHashed(stored)) {
        // Accounts created before hashing was added: compare once, then the caller upgrades the hash
        return String(stored) === String(password);
    }
    const [, salt, hash] = stored.split('$');
    const candidate = crypto.scryptSync(String(password), salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
