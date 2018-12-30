export class TransformerParameter {
    private parameters: { [key: string]: any[] } = {};
    public add(key: string, value: any) {
        let vales = this.parameters[key];
        if (!vales)
            vales = this.parameters[key] = [];
        vales.unshift(value);
    }
    public get(key: string) {
        const vales = this.parameters[key] || [];
        return vales[0];
    }
    public remove(key: string) {
        const vales = this.parameters[key] || [];
        return vales.shift();
    }
    public get keys() {
        return Object.keys(this.parameters);
    }
}
