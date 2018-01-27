import { GenericType } from "../../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T, K> extends SelectExpression<K> {
    public key: K;
    // resolved from keySelector
    public groupBy: IColumnExpression[];
    public get type(): GenericType<K>{
        return this._type;
    }
    // tslint:disable-next-line:variable-name
    private _type: GenericType<K>;
    constructor(public readonly select: SelectExpression<T>, type: GenericType<K> = Object as any) {
        super(select.entity);
        this._type = type;
        this.columns = [];
        this.select = select;
    }
}
