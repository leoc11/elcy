export interface IExpression<T = any> {
    ToString(): string;
    Execute(): T | any;
}

export abstract class ExpressionBase<T> implements IExpression<T> {
    // tslint:disable-next-line:ban-types
    public ToString(): string {
        throw new Error("Method not implemented.");
    }
    // tslint:disable-next-line:no-shadowed-variable
    public Execute(): T | any {
        throw new Error("Method not implemented.");
    }
}
