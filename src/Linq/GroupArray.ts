export class GroupArray<TGKey, TType> extends Array<TType> {
    constructor(public Key?: TGKey) {
        super();
    }
}
