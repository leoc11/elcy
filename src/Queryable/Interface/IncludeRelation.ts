import { IIncludeRelation } from "./IIncludeRelation";
import { SelectExpression } from "../QueryExpression/SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { RelationshipType } from "../../Common/Type";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { visitExpression, resolveClone, replaceExpression } from "../../Helper/Util";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ComputedColumnExpression } from "../QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../QueryExpression/ColumnExpression";
import { Enumerable } from "../../Enumerable/Enumerable";

export class IncludeRelation<T = any, TChild = any> implements IIncludeRelation<T, TChild> {
    constructor();
    constructor(parent: SelectExpression<T>, child: SelectExpression<TChild>, name: string, type: RelationshipType, relations?: IExpression<boolean>);
    constructor(parent?: SelectExpression<T>, child?: SelectExpression<TChild>, name?: string, type?: RelationshipType, relations?: IExpression<boolean>) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relations = relations;
            this.type = type;
            this.name = name;
        }
    }

    //#region Private Member
    private _isRelationResolved: boolean;
    private _parentColumns: IColumnExpression[];
    private _childColumns: IColumnExpression[];
    private _isManyManyRelation: boolean;

    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        this._isManyManyRelation = false;
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
            else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                this._isManyManyRelation = true;
            }
        });

        if (!this._isManyManyRelation) {
            this._isManyManyRelation = this._childColumns.any(o => !o.isPrimary) && this._parentColumns.any(o => !o.isPrimary);
        }
    }
    //#endregion

    //#region Properties
    public parent: SelectExpression<T>;
    public child: SelectExpression<TChild>;
    public relations: IExpression<boolean>;
    public type: RelationshipType;
    public name: string;
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
    public * relationMap() {
        for (let i = 0, len = this.parentColumns.length; i < len; i++) {
            yield [this.parentColumns[i], this.childColumns[i]];
        }
    }
    public get isManyToManyRelation() {
        if (typeof this._isManyManyRelation !== "boolean") {
            this.analyzeRelation();
        }
        return this._isManyManyRelation;
    }
    public get resolvedRelations(): IExpression<boolean> {
        if (!this._isRelationResolved) {
            // child: computed column need to be changed to it's expression as it not yet recognized.
            // parent: make sure child column's entity is the direct join relation entity. (column might came from another table joined to child)
            replaceExpression(this.relations, (exp) => {
                const col = exp as IColumnExpression;
                if (Enumerable.load(this.child.projectedColumns).contains(col)) {
                    if (col instanceof ComputedColumnExpression) {
                        return col.expression;
                    }
                    return col;
                }
                else if (Enumerable.load(this.parent.projectedColumns).contains(col)) {
                    if (col instanceof ComputedColumnExpression) {
                        return new ColumnExpression(this.parent.entity, col.type, col.propertyName as any, col.columnName, col.isPrimary, col.isNullable, col.columnType);
                    }
                    if (col.entity !== this.parent.entity) {
                        return col.clone(new Map([[col.entity, this.parent.entity]]));
                    }
                }
                return exp;
            });
        }
        return this.relations;
    }
    //#endregion

    //#region Methods
    public addRelation(parentColumn: IColumnExpression, childColumn: IColumnExpression) {
        const logicalExp = new StrictEqualExpression(parentColumn, childColumn);
        this.relations = this.relations ? new AndExpression(this.relations, logicalExp) : logicalExp;
    }
    public clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relations, replaceMap);
        const clone = new IncludeRelation(parent, child, this.name, this.type, relation);
        if (child !== this.child) child.parentRelation = clone;
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    //#endregion
}