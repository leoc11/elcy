export interface IExpression<T = any> {
    // tslint:disable-next-line:ban-types
    Type: undefined | null | Function;
    ToString(): string;
    Execute(): T | any;
}

export abstract class ExpressionBase<T> implements IExpression<T> {
    // tslint:disable-next-line:ban-types
    public Type: undefined | null | Function;
    constructor(returnType: T) {
        if (returnType === undefined)
            this.Type = undefined;
        else if (returnType === null)
            this.Type = null;
        else
            this.Type = returnType.constructor;
    }
    public ToString(): string {
        throw new Error("Method not implemented.");
    }
    public Execute() {
        throw new Error("Method not implemented.");
    }
}
