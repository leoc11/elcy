import { RelationshipType } from "../../Common/StringType";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { isColumnExp, resolveClone, visitExpression } from "../../Helper/Util";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";
import { ISelectRelation } from "./ISelectRelation";

export class IncludeRelation<T extends object = object, TChild extends object = object> implements ISelectRelation<T, TChild> {
    public get childColumns() {
        if (!this._childColumns) {
            this.analyzeRelation();
        }
        return this._childColumns;
    }
    public get isManyToManyRelation() {
        if (typeof this._isManyManyRelation !== "boolean") {
            this.analyzeRelation();
        }
        return this._isManyManyRelation;
    }
    public get parentColumns() {
        if (!this._parentColumns) {
            this.analyzeRelation();
        }
        return this._parentColumns;
    }
    constructor();
    constructor(parent: SelectExpression<T, any>, child: SelectExpression<TChild, any>, name: string, type: RelationshipType, relations?: IExpression<boolean>);
    constructor(parent?: SelectExpression<T, any>, child?: SelectExpression<TChild, any>, name?: string, type?: RelationshipType, relations?: IExpression<boolean>) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relation = relations;
            this.type = type;
            this.name = name;
        }
    }
    public child: SelectExpression<TChild>;
    public isEmbedded: boolean;
    public name: string;
    //#endregion

    //#region Properties
    public parent: SelectExpression<T>;
    public relation: IExpression<boolean>;
    public type: RelationshipType;
    private _childColumns: IColumnExpression<TChild>[];
    private _isManyManyRelation: boolean;

    private _parentColumns: IColumnExpression<T>[];
    //#endregion

    //#region Methods
    public addRelation(parentColumn: IColumnExpression, childColumn: IColumnExpression) {
        const logicalExp = new StrictEqualExpression(parentColumn, childColumn);
        this.relation = this.relation ? new AndExpression(this.relation, logicalExp) : logicalExp;
    }
    public clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new IncludeRelation(parent, child, this.name, this.type, relation);
        if (child !== this.child) {
            child.parentRelation = clone;
        }
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    public * relationMap() {
        for (let i = 0, len = this.parentColumns.length; i < len; i++) {
            yield [this.parentColumns[i], this.childColumns[i]];
        }
    }

    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        this._isManyManyRelation = false;
        visitExpression(this.relation, (exp: IExpression) => {
            if (isColumnExp(exp)) {
                const colExp = exp as IColumnExpression<T | TChild>;
                if (this.child.entity === colExp.entity) {
                    this._childColumns.push(colExp as IColumnExpression<TChild>);
                }
                else if (this.parent.entity === colExp.entity) {
                    this._parentColumns.push(colExp as IColumnExpression<T>);
                }
                else if (this.child.allSelects.select((o) => o.entity).contains(colExp.entity)) {
                    this._childColumns.push(colExp as IColumnExpression<TChild>);
                }
                else if (this.parent.allSelects.select((o) => o.entity).contains(colExp.entity)) {
                    this._parentColumns.push(colExp as IColumnExpression<T>);
                }
            }
            else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                this._isManyManyRelation = true;
            }
        });

        if (!this._isManyManyRelation) {
            const childPks = this.child.allSelects.selectMany((o) => o.primaryKeys);
            const parentPks = this.parent.allSelects.selectMany((o) => o.primaryKeys);
            childPks.enableCache = parentPks.enableCache = true;
            this._isManyManyRelation = this._childColumns.any((o) => !childPks.contains(o)) && this._parentColumns.any((o) => !parentPks.contains(o));
        }
    }
    //#endregion
}
