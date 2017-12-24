import { genericType } from "../Common/Type";

export class EmbeddedColumnMetaData<T> {
    constructor(public type: genericType<T>, public prefix: string) {
    }
}
