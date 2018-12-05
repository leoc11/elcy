import { SelectExpression } from "../QueryExpression/SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { JoinType } from "../../Common/Type";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { visitExpression, resolveClone, replaceExpression } from "../../Helper/Util";
import { IJoinRelation } from "./IJoinRelation";
import { ComputedColumnExpression } from "../QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../QueryExpression/ColumnExpression";
import { Enumerable } from "../../Enumerable/Enumerable";

export class JoinRelation<T = any, TChild = any> implements IJoinRelation<T, TChild> {
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
    private _isRelationResolved: boolean;
    private _parentColumns: IColumnExpression[];
    private _childColumns: IColumnExpression[];
    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        this._isRelationResolved = true;
        // parent: computed column need to be changed to it's expression as it not yet recognized.
        // child: make sure child column's entity is the direct join relation entity. (column might came from another table joined to child)
        replaceExpression(this.relations, (exp) => {
            if ((exp as IColumnExpression).entity) {
                let colExp = exp as IColumnExpression;
                let isChild: boolean;
                if (this.child.entity === colExp.entity) {
                    isChild = true;
                }
                else if (this.parent.entity === colExp.entity) {
                    isChild = false;
                }
                else if (Enumerable.load(this.child.allJoinedEntities).contains(colExp.entity)) {
                    isChild = true;
                }
                else if (Enumerable.load(this.parent.allJoinedEntities).contains(colExp.entity)) {
                    isChild = false;
                }
                if (typeof isChild === "boolean") {
                    if (isChild) {
                        if (colExp instanceof ComputedColumnExpression) {
                            const resCol = new ColumnExpression(this.child.entity, colExp.type, colExp.propertyName as any, colExp.columnName, colExp.isPrimary, colExp.isNullable, colExp.columnType);
                            resCol.alias = colExp.alias;
                            colExp = resCol;
                        }
                        if (colExp.entity !== this.child.entity) {
                            colExp = colExp.clone(new Map([[colExp.entity, this.child.entity]]));
                        }
                        this._childColumns.push(colExp);
                    }
                    else {
                        // if (col instanceof ComputedColumnExpression) {
                        //         return col.expression;
                        //     }
                        this._parentColumns.push(colExp);
                    }
                }
                return colExp;
            }
            return exp;
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
        if (!this._isRelationResolved) {
            this.analyzeRelation();
        }
        return this.relations;
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