export interface IExpression<T = any> {
    ToString(): string;
    Execute(): T | any;
}

export abstract class ExpressionBase<T> implements IExpression<T> {
    // tslint:disable-next-line:ban-types
    public abstract ToString(): string;
    // tslint:disable-next-line:no-shadowed-variable
    public abstract Execute(): T | any;
}
