const toHex = (u: number) => {
    const a = (u).toString(16);
    return a.length < 2 ? "0" + a : a;
};
export class UUID extends Uint8Array {
    constructor(uuid?: string) {
        super(16);
        if (uuid) this.parse(uuid);
    }
    [Symbol.toPrimitive]() {
        return this.toString();
    }
    public valueOf() {
        return this.toString();
    }
    protected parse(uuid: string) {
        const l = uuid.length;
        for (let i = 0, j = 0; j < 16 && i < l; i += 2) {
            if (uuid[i] === "-")
                i++;
            this[j++] = parseInt(uuid.slice(i, i + 2), 16);
        }
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
                if (stopper === 12)
                    stopper = 16;
            }
        }
        return res;
    }
    public toJSON() {
        return this.toString();
    }
    public static new() {
        const res = new UUID();
        for (let i = 0, len = res.length; i < len; i++) {
            res[i] = Math.floor(Math.random() * 256);
        }
        res[6] &= 0x0F;
        res[6] |= 0x40;

        res[8] &= 0x3F;
        res[8] |= 0x80;
        return res;
    }
    public static readonly empty = new UUID();
}