import { genericType } from "../../../Common/Type";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { ICommandQueryExpression } from "./ICommandQueryExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";

export class SelectExpression<T = any> implements ICommandQueryExpression<T> {
    [prop: string]: any;
    public columns: IColumnExpression[] = [];
    public entity: IEntityExpression;
    public distinct: boolean = false;
    public get type(): genericType<T> {
        return this.entity.type;
    }
    public paging: { skip?: number, take?: number } = {};
    public where: IExpression<boolean>;
    public orders: IOrderExpression[] = [];
    constructor(entity: IEntityExpression<T> | SelectExpression<T>) {
        if (entity instanceof SelectExpression)
            this.copy(entity);
        else
            this.entity = entity;

    }
    public copy(source: SelectExpression<T>) {
        if (source) {
            // tslint:disable-next-line:forin
            for (const prop in source) {
                this[prop] = source[prop];
            }
        }
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): SelectExpression {

        return this;
    }
    public replaceEntity(source: IEntityExpression<any>, target: IEntityExpression<any>): void {
        throw new Error("Method not implemented.");
    }
}
