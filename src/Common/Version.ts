export class Version {
    public readonly major: number;
    public readonly minor: number;
    public readonly patch: number;
    public readonly label: string;
    constructor(major: number, minor: number = 0, patch: number = 0, label?: string) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.label = label;
    }
    public toString() {
        return `${this.major}.${this.minor}.${this.patch}` + (this.label ? `-${this.label}` : "");
    }
    public toJSON() {
        return this.toString();
    }
    [Symbol.toPrimitive](hint?: "number" | "string" | "default") {
        if (hint === "number")
            return this.valueOf();
        return this.toString();
    }
    public valueOf() {
        return (this.major * 1000) + this.minor + (this.patch / 1000);
    }
}
