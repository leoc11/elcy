
/**
 * Naming strategy to be used to name tables and columns in the database.
 */
export class NamingStrategy {
    public enableEscape: boolean = true;
    public AliasPrefix: { [key: string]: string } = {};

    public getAlias(type: string) {
        return this.AliasPrefix[type] || type;
    }
}
