
export type AliasType = "entity" | "column" | "param";
/**
 * Naming strategy to be used to name tables and columns in the database.
 */
export class NamingStrategy {
    public enableEscape: boolean = true;
    public aliasPrefix: { [key in AliasType]?: string } = {};

    public getAlias(type: AliasType) {
        return this.aliasPrefix[type] || type;
    }
}
