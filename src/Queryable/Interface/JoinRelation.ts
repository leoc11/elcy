import { SelectExpression } from "../QueryExpression/SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { JoinType } from "../../Common/Type";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { visitExpression, resolveClone, replaceExpression } from "../../Helper/Util";
import { ComputedColumnExpression } from "../QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../QueryExpression/ColumnExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { ISelectRelation } from "./ISelectRelation";

export class JoinRelation<T = any, TChild = any> implements ISelectRelation<T, TChild> {
    constructor();
    constructor(parent: SelectExpression<T>, child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType);
    constructor(parent?: SelectExpression<T>, child?: SelectExpression<TChild>, relations?: IExpression<boolean>, type?: JoinType) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relations = relations;
            this.type = type;
        }
    }

    //#region Private Member
    private _resolvedRelation: IExpression<boolean>;
    private _parentColumns: IColumnExpression[];
    private _childColumns: IColumnExpression[];
    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        visitExpression(this.relations, (exp: IExpression) => {
            if ((exp as IColumnExpression).entity) {
                const colExp = exp as IColumnExpression;
                if (this.child.entity === colExp.entity) {
                    this._childColumns.push(colExp);
                }
                else if (this.parent.entity === colExp.entity) {
                    this._parentColumns.push(colExp);
                }
                else if (Enumerable.load(this.child.allJoinedEntities).contains(colExp.entity)) {
                    this._childColumns.push(colExp);
                }
                else if (Enumerable.load(this.parent.allJoinedEntities).contains(colExp.entity)) {
                    this._parentColumns.push(colExp);
                }
            }
        });
    }
    //#endregion

    //#region Properties
    public parent: SelectExpression<T>;
    public child: SelectExpression<TChild>;
    public relations: IExpression<boolean>;
    public type: JoinType;
    public isEmbedded: boolean;
    public get parentColumns() {
        if (!this._parentColumns) {
            this.analyzeRelation();
        }
        return this._parentColumns;
    }
    public get childColumns() {
        if (!this._childColumns) {
            this.analyzeRelation();
        }
        return this._childColumns;
    }
    public get resolvedRelations(): IExpression<boolean> {
        if (!this._resolvedRelation) {
            const replaceMap = new Map();
            for (const col of this.childColumns) {
                replaceMap.set(col, col);
            }
            for (const col of this.parentColumns) {
                replaceMap.set(col, col);
            }

            this._resolvedRelation = this.relations.clone(replaceMap);
            // parent: computed column need to be changed to it's expression as it not yet recognized.
            // child: make sure child column's entity is the direct join relation entity. (column might came from another table joined to child)
            replaceExpression(this._resolvedRelation, (exp) => {
                if ((exp as IColumnExpression).entity) {
                    let colExp = exp as IColumnExpression;
                    if (this.childColumns.contains(colExp)) {
                        if (colExp instanceof ComputedColumnExpression || colExp.entity !== this.child.entity) {
                            const resCol = new ColumnExpression(this.child.entity, colExp.type, colExp.propertyName as any, colExp.columnName, colExp.isPrimary, colExp.isNullable, colExp.columnType);
                            resCol.alias = colExp.alias;
                            exp = resCol;
                        }
                    }
                    else if (this.parentColumns.contains(colExp)) {
                        if (colExp instanceof ComputedColumnExpression) {
                            exp = colExp.expression;
                        }
                    }
                }
                return exp;
            });
        }
        return this._resolvedRelation;
    }
    //#endregion

    //#region Methods
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relations, replaceMap);
        const clone = new JoinRelation(parent, child, relation, this.type);
        if (child !== this.child) child.parentRelation = clone;
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    //#endregion
}