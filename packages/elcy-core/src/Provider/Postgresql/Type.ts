export { };

export const ProviderDbType = "postgresql";
export type ProviderDbType = typeof ProviderDbType;

declare global {
    interface DbTypeRegistry {
        postgresql: ProviderDbType;
    }
}