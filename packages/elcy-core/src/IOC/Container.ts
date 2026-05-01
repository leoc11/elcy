import { GenericType, IObjectType } from "../Common/Type";

interface IContainerItem<T = any> {
    factory?: (...args: any[]) => T;
    instance?: T;
    isLifeTime?: boolean;
    type?: IObjectType<T>;
}
const containerKey = Symbol("container");
class Container {
    private [containerKey] = new Map<string | symbol | GenericType, IContainerItem>();
    public register<T>(key: string | symbol | GenericType<T>, instance: T) {
        this[containerKey].set(key, {
            instance
        });
    }
    public registerFactory<T>(key: string | symbol | GenericType<T>, factory: (...args: any[]) => T, isLifeTime: false) {
        this[containerKey].set(key, {
            factory,
            isLifeTime
        });
    }
    public registerType<T>(key: string | symbol | GenericType<T>, type: IObjectType<T>, isLifeTime: false) {
        this[containerKey].set(key, {
            type,
            isLifeTime
        });
    }
    public resolve<T>(key: string | symbol | GenericType<T>, ...args: any[]): T {
        const item = this[containerKey].get(key);
        let res: T = null;
        if (item) {
            if (item.instance) {
                res = item.instance;
            }
            if (item.factory) {
                res = item.factory(...args);
                if (item.isLifeTime) {
                    item.instance = res;
                }
            }
            if (item.type) {
                res = new item.type(...args);
                if (item.isLifeTime) {
                    item.instance = res;
                }
            }
        }
        return res;
    }
    public resolveType<T>(type: IObjectType<T>): T {
        const res = this.resolve(type);
        return res ? res : new type();
    }
}

export const container = new Container();
