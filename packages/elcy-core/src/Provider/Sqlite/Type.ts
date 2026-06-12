export { };

export const ProviderDbType = "sqlite";
export type ProviderDbType = typeof ProviderDbType;

declare global {
    interface DbTypeRegistry {
        sqlite: ProviderDbType;
    }
}