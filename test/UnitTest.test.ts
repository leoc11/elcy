import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import xxhash from 'xxhash-wasm';
import xxhjs from "xxhashjs";
import { MyDb } from "./Common/MyDb";
import { mockContext } from "./Mock/MockContext";
import { DefaultQueryCacheManager } from "../src/Cache/DefaultQueryCacheManager";

const db = new MyDb();
mockContext(db);
afterEach(() => {
    db.clear();
});

// import {getHasher, HashType} from 'bigint-hash';
// import { MssqlDriver } from "elcy-tedious/MssqlDriver";
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
function xxHash32(str, seed = 0) {
    const len = str.length;
    let h32;
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

    h32 = (h32 + len) >>> 0; // charCodeAt = 2 bytes per char

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
}
const get32i = (buf: Uint8Array, offset: number): number =>
  (buf[offset]) |
  (buf[offset + 1] << 8) |
  (buf[offset + 2] << 16) |
  (buf[offset + 3] << 24);

function rxxHash32(input: string | Uint8Array, seed: number = 0): number {
  const buf = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = buf.length;
  let p = 0;
  let h32: number;

  if (len >= 16) {
    let v1 = (seed + PRIME32_1 + PRIME32_2) >>> 0;
    let v2 = (seed + PRIME32_2) >>> 0;
    let v3 = (seed + 0) >>> 0;
    let v4 = (seed - PRIME32_1) >>> 0;

    const limit = len - 16;
    while (p <= limit) {
      v1 = Math.imul(rotl(v1 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
      v2 = Math.imul(rotl(v2 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
      v3 = Math.imul(rotl(v3 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
      v4 = Math.imul(rotl(v4 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
    }

    h32 = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
  } else {
    h32 = (seed + PRIME32_5) >>> 0;
  }

  h32 = (h32 + len) >>> 0;

  const limit = len - 4;
  while (p <= limit) {
    h32 = Math.imul(rotl(h32 + Math.imul(get32i(buf, p), PRIME32_3), 17), PRIME32_4) >>> 0;
    p += 4;
  }

  while (p < len) {
    h32 = Math.imul(rotl(h32 + Math.imul(buf[p++], PRIME32_5), 11), PRIME32_1) >>> 0;
  }

  // Final avalanche
  h32 ^= h32 >>> 15;
  h32 = Math.imul(h32, PRIME32_2) >>> 0;
  h32 ^= h32 >>> 13;
  h32 = Math.imul(h32, PRIME32_3) >>> 0;
  h32 ^= h32 >>> 16;

  return h32 >>> 0;
}
function* encodeUTF8Lazy(str) {
  for (const ch of str) {
    const cp = ch.codePointAt(0); // full Unicode code point

    if (cp <= 0x7F) {
      yield cp;
    } else if (cp <= 0x7FF) {
      yield 0xC0 | (cp >> 6);
      yield 0x80 | (cp & 0x3F);
    } else if (cp <= 0xFFFF) {
      yield 0xE0 | (cp >> 12);
      yield 0x80 | ((cp >> 6) & 0x3F);
      yield 0x80 | (cp & 0x3F);
    } else {
      yield 0xF0 | (cp >> 18);
      yield 0x80 | ((cp >> 12) & 0x3F);
      yield 0x80 | ((cp >> 6) & 0x3F);
      yield 0x80 | (cp & 0x3F);
    }
  }
}
function sxxHash32(input: string, seed: number = 0): number {
  const buf = Array.from(encodeUTF8Lazy(input)) as unknown as Uint8Array;
  const len = buf.length;
  let p = 0;
  let h32: number;

  if (len >= 16) {
    let v1 = (seed + PRIME32_1 + PRIME32_2) >>> 0;
    let v2 = (seed + PRIME32_2) >>> 0;
    let v3 = (seed + 0) >>> 0;
    let v4 = (seed - PRIME32_1) >>> 0;

    const limit = len - 16;
    while (p <= limit) {
      v1 = Math.imul(rotl(v1 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
      v2 = Math.imul(rotl(v2 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
      v3 = Math.imul(rotl(v3 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
      v4 = Math.imul(rotl(v4 + Math.imul(get32i(buf, p), PRIME32_2), 13), PRIME32_1) >>> 0;
      p += 4;
    }

    h32 = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) >>> 0;
  } else {
    h32 = (seed + PRIME32_5) >>> 0;
  }

  h32 = (h32 + len) >>> 0;

  const limit = len - 4;
  while (p <= limit) {
    h32 = Math.imul(rotl(h32 + Math.imul(get32i(buf, p), PRIME32_3), 17), PRIME32_4) >>> 0;
    p += 4;
  }

  while (p < len) {
    h32 = Math.imul(rotl(h32 + Math.imul(buf[p++], PRIME32_5), 11), PRIME32_1) >>> 0;
  }

  // Final avalanche
  h32 ^= h32 >>> 15;
  h32 = Math.imul(h32, PRIME32_2) >>> 0;
  h32 ^= h32 >>> 13;
  h32 = Math.imul(h32, PRIME32_3) >>> 0;
  h32 ^= h32 >>> 16;

  return h32 >>> 0;
}

function javaHash(str: string, hash: number = 0) {
  if (!str || str.length === 0) {
      return hash;
  }
  for (let i = 0, len = str.length; i < len; i++) {
      hash = hashCodeAdd(hash, str.charCodeAt(i));
  }
  return hash;
};
function hashCodeAdd(hash: number, add: number) {
    hash = ((hash << 5) - hash) + add;
    hash |= 0;
    return hash;
};

describe("xhash", async () => {
  beforeAll(async () => {
      db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
  });
  afterAll(async () => {
      db.queryCacheManagerFactory = null;
  });
  it("should use same query cache for diff take skip value", async () => {
      // build string with it's query cache
      db.orders.take(10).skip(4).toString();
      const take = db.orders.take(1).skip(2);
      const param = take.flatQueryParameter({ index: 0 });
      const hashKey = (take as any).cacheKey(param);
      const cache = db.queryCacheManager.get(hashKey);

      expect(cache).not.null;
      expect(cache).not.undefined;
  });
    // it("test perf", async () => {
    //     const loop = 100_000;
    //     function getRandomChar() {
    //         const min = 33; // '!' character
    //         const max = 126; // '~' character
    //         return String.fromCharCode(Math.floor(Math.random() * (max - min + 1)) + min);
    //       }
    //     let smallStr = "";
    //     for (let i=0; i < 50; i++) {
    //       smallStr += getRandomChar();
    //     }
    //     let largeStr = "";
    //     for (let i=0; i < 1000; i++) {
    //         largeStr += getRandomChar();
    //     }
        
    //     const wasmHash = await xxhash();

    //     const a2 = rxxHash32(largeStr, 0);
    //     const a = xxHash32(largeStr, 0);
    //     const a3 = sxxHash32(largeStr, 0);
    //     const b = wasmHash.h32(largeStr, 0);
    //     const c = xxhjs.h32(largeStr, 0);

    //     const res = new Map();
    //     const f = (type, str, action: (str: string, seed?: number) => number) => {
    //         const start = performance.now();
    //         for (let i=0; i < loop; i++) {
    //             action(str, 0);
    //         }
    //         const end = performance.now();
    //         res.set(type, (end - start).toFixed(3));
    //     };

    //     f("small:javaHash", smallStr, javaHash);
    //     f("small:xxHash32", smallStr, xxHash32);
    //     f("small:rxxHash32", smallStr, rxxHash32);
    //     f("small:sxxHash32", smallStr, sxxHash32);
    //     f("small:xxhash-wasm", smallStr, wasmHash.h32);
    //     f("small:xxhashjs", smallStr, xxhjs.h32);
    //     f("large:javaHash", largeStr, javaHash);
    //     f("large:xxHash32", largeStr, xxHash32);
    //     f("large:rxxHash32", largeStr, rxxHash32);
    //     f("large:sxxHash32", largeStr, sxxHash32);
    //     f("large:xxhash-wasm", largeStr, wasmHash.h32);
    //     f("large:xxhashjs", largeStr, xxhjs.h32);
        
    //     // f("bigint-hash", smallStr, (str: string, seed?: number) => {
    //     //     return getHasher(HashType.xxHash32).update(str).digestBigInt() as unknown as number;
    //     // });
    // });
});
