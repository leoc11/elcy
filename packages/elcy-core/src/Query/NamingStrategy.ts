
export type AliasType = "entity" | "column" | "param";
/**
 * Naming strategy to be used to name tables and columns in the database.
 */
export class NamingStrategy {
    public aliasPrefix: { [key in AliasType]?: string } = {};
    public enableEscape: boolean = true;
    public getAlias(type: AliasType) {
        return this.aliasPrefix[type] || type;
    }
}
