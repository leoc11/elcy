export { };

export const ProviderDbType = "mysql";
export type ProviderDbType = typeof ProviderDbType;

declare global {
    interface DbTypeRegistry {
        mysql: ProviderDbType;
    }
}