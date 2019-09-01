const toHex = (u: number) => {
    const a = (u).toString(16);
    return a.length < 2 ? "0" + a : a;
};
export const RandomGenerator = (res: Uuid) => {
    for (let i = 0, len = res.length; i < len; i++) {
        res[i] = Math.floor(Math.random() * 256);
    }
};
export const CryptoGenerator = (res: Uuid) => globalThis.crypto.getRandomValues(res);
export class Uuid extends Uint8Array {
    constructor(uuid?: string) {
        super(16);
        if (uuid) {
            this.parse(uuid);
        }
    }
    public static readonly empty = new Uuid();
    public static randomGenerator: (uuid: Uuid) => void;
    public static new() {
        const res = new Uuid();
        this.randomGenerator(res);

        res[6] &= 0x0F;
        res[6] |= 0x40;

        res[8] &= 0x3F;
        res[8] |= 0x80;
        return res;
    }
    public [Symbol.toPrimitive]() {
        return this.toString();
    }
    public toJSON() {
        return this.toString();
    }
    public toString() {
        let res = "";
        let i = 0;
        let stopper = 4;
        while (i < 16) {
            while (i < stopper) {
                res += toHex(this[i++]);
            }
            if (stopper <= 12) {
                stopper += 2;
                res += "-";
                if (stopper === 12) {
                    stopper = 16;
                }
            }
        }
        return res;
    }
    public valueOf() {
        return this.toString();
    }
    protected parse(uuid: string) {
        const l = uuid.length;
        for (let i = 0, j = 0; j < 16 && i < l; i += 2) {
            if (uuid[i] === "-") {
                i++;
            }
            this[j++] = parseInt(uuid.slice(i, i + 2), 16);
        }
    }
}

Uuid.randomGenerator = globalThis && globalThis.crypto && globalThis.crypto.getRandomValues ? CryptoGenerator : RandomGenerator;
