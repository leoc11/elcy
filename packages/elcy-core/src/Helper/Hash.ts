const PRIME32_1 = 0x9E3779B1 >>> 0;
const PRIME32_2 = 0x85EBCA77 >>> 0;
const PRIME32_3 = 0xC2B2AE3D >>> 0;
const PRIME32_4 = 0x27D4EB2F >>> 0;
const PRIME32_5 = 0x165667B1 >>> 0;
const rotl = (x: number, r: number) => ((x << r) | (x >>> (32 - r))) >>> 0;
const get32 = (str: string, i: number) => str.charCodeAt(i)
    | (str.charCodeAt(i + 1) << 8)
    | (str.charCodeAt(i + 2) << 16)
    | (str.charCodeAt(i + 3) << 24);
/**
 * Use xxHash-like algo for string hash
 * @param str
 */
export const hashCode = (str: string, seed: number = 0) => {
    if (!str || str.length === 0) {
        return seed;
    }

    const len = str.length;
    let h32: number;
    let p = 0;

    if (len >= 16) {
        let v1 = (seed + PRIME32_1 + PRIME32_2) >>> 0;
        let v2 = (seed + PRIME32_2) >>> 0;
        let v3 = (seed + 0) >>> 0;
        let v4 = (seed - PRIME32_1) >>> 0;

        const limit = len - 16;
        while (p <= limit) {
            v1 = Math.imul(rotl(v1 + Math.imul(get32(str, p), PRIME32_2), 13), PRIME32_1) >>> 0;
            v2 = Math.imul(rotl(v2 + Math.imul(get32(str, p + 4), PRIME32_2), 13), PRIME32_1) >>> 0;
            v3 = Math.imul(rotl(v3 + Math.imul(get32(str, p + 8), PRIME32_2), 13), PRIME32_1) >>> 0;
            v4 = Math.imul(rotl(v4 + Math.imul(get32(str, p + 12), PRIME32_2), 13), PRIME32_1) >>> 0;
            p += 16;
        }

        h32 = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
    } else {
        h32 = (seed + PRIME32_5) >>> 0;
    }

    h32 = (h32 + len) >>> 0;

    // Tail: 4-byte chunks
    const limit = len - 4;
    while (p <= limit) {
        h32 = Math.imul(rotl(h32 + Math.imul(get32(str, p), PRIME32_3), 17), PRIME32_4) >>> 0;
        p += 4;
    }

    // Remaining 1–3 chars
    while (p < len) {
        h32 = Math.imul(rotl(h32 + Math.imul(str.charCodeAt(p++), PRIME32_5), 11), PRIME32_1) >>> 0;
    }

    // Final avalanche
    h32 ^= h32 >>> 15;
    h32 = Math.imul(h32, PRIME32_2) >>> 0;
    h32 ^= h32 >>> 13;
    h32 = Math.imul(h32, PRIME32_3) >>> 0;
    h32 ^= h32 >>> 16;

    return h32 >>> 0;
};
export const hashCodeAdd = (hash1: number, hash2: number) => {
    if (!hash1) return hash2;
    if (!hash2) return hash1;

    let h32 = Math.imul(rotl(hash1 + Math.imul(hash2, PRIME32_5) >>> 0, 13), PRIME32_1) >>> 0;

    // Final avalanche
    h32 ^= h32 >>> 15;
    h32 = Math.imul(h32, PRIME32_2) >>> 0;
    h32 ^= h32 >>> 13;
    h32 = Math.imul(h32, PRIME32_3) >>> 0;
    h32 ^= h32 >>> 16;

    return h32 >>> 0;
};