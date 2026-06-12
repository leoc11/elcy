export { };

export const ProviderDbType = "mssql";
export type ProviderDbType = typeof ProviderDbType;

declare global {
    interface DbTypeRegistry {
        mssql: ProviderDbType;
    }
}