import { GenericType } from "../Common/Type";

export class EmbeddedColumnMetaData<T> {
    constructor(public type: GenericType<T>, public prefix: string) {
    }
}
