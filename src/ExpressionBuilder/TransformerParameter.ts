export class TransformerParameter {
    public get keys() {
        return Object.keys(this.parameters);
    }
    private parameters: { [key: string]: any[] } = {};
    public add(key: string, value: any) {
        let vales = this.parameters[key];
        if (!vales) {
            vales = this.parameters[key] = [];
        }
        vales.unshift(value);
    }
    public clear() {
        this.parameters = {};
    }
    public get(key: string) {
        const vales = this.parameters[key] || [];
        return vales[0];
    }
    public remove(key: string) {
        const vales = this.parameters[key] || [];
        return vales.shift();
    }
    public set(param: { [key: string]: any }) {
        for (const prop in param) {
            const value = param[prop];
            this.add(prop, value);
        }
    }
}
