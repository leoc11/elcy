export class TransformerParameter {
    public get keys() {
        return Object.keys(this.parameters);
    }
    private parameters: { [key: string]: unknown[] } = {};
    public add(key: string, value: unknown) {
        let vales = this.parameters[key];
        if (!vales) {
            vales = this.parameters[key] = [];
        }
        vales.unshift(value);
    }
    public clear() {
        this.parameters = {};
    }
    public get<T = unknown>(key: string): T {
        const vales = this.parameters[key] || [];
        return vales[0] as T;
    }
    public remove(key: string) {
        const vales = this.parameters[key] || [];
        return vales.shift();
    }
    public set(param: { [key: string]: unknown }) {
        for (const prop in param) {
            const value = param[prop];
            this.add(prop, value);
        }
    }
}
