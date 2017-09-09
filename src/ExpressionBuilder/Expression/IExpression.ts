export interface IExpression<T = any> {
    ToString(): string;
    Execute(): T | any;
}

export class ExpressionBase<T = any> implements IExpression<T> {
    // tslint:disable-next-line:ban-types
    public ToString() {
        return "";
    }
    // tslint:disable-next-line:no-shadowed-variable
    public Execute(): T | any {
        return "";
    }
}
