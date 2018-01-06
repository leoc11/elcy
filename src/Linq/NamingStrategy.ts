export class NamingStrategy {
    public enableEscape: boolean = true;
    public AliasPrefix: { [key: string]: string } = {};

    public getAlias(type: string) {
        return this.AliasPrefix[type] || type;
    }
}
