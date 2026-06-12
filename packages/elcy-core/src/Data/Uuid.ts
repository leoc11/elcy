import { register } from "src/Registry/GlobalIdentifierRegistry";
import { registerTranslationFunction } from "src/Registry/QueryTranslatorRegistry";

const toHex = (u: number) => {
    const a = (u).toString(16);
    return a.length < 2 ? "0" + a : a;
};
const RandomGenerator = (res: Uuid) => {
    for (let i = 0, len = res.length; i < len; i++) {
        res[i] = Math.floor(Math.random() * 256);
    }
};
const CryptoGenerator = (res: Uuid) => globalThis.crypto.getRandomValues(res);
export class Uuid extends Uint8Array {
    constructor(uuid?: string | Uint8Array) {
        super(16);
        if (typeof uuid === "string") {
            this.parse(uuid);
        }
        if (uuid instanceof Uint8Array) {
            this.set(uuid);
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
    public override toString() {
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
    public override valueOf() {
        return this;
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

declare global {
    interface ValueTypeRegistry {
        Uuid: Uuid;
    }
}
register("Uuid", Uuid);
registerTranslationFunction("default", o => o.registerValueType(Uuid, { columnType: { columnType: "uuid", group: "Identifier" }, hydrate: (value: Uint8Array) => new Uuid(value), persist: value => value, instance: Uuid.empty }));
registerTranslationFunction("mssql", o => {
    o.registerValueType(Uuid, { columnType: { columnType: "uniqueidentifier", group: "Identifier" } });
    o.registerMethod(Uuid, "new", () => "newid()", () => true);
});
registerTranslationFunction("mysql", o => o.registerValueType(Uuid, { columnType: { columnType: "binary", option: { size: 16 } } }));
registerTranslationFunction("postgresql", o => o.registerMethod(Uuid, "new", () => "uuid_generate_v4()"));
registerTranslationFunction("sqlite", o => o.registerValueType(Uuid, { columnType: { columnType: "text", group: "String" } }));
