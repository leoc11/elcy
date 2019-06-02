import { DbType } from "../../Common/StringType";
import { DbContext } from "../../Data/DbContext";
import { EntityState } from "../../Data/EntityState";
import { RelationEntry } from "../../Data/RelationEntry";
import { RelationState } from "../../Data/RelationState";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryVisitor } from "../../Query/IQueryVisitor";

export abstract class RelationalDbContext<TDB extends DbType> extends DbContext<TDB> {
    protected getRelationAddQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: IEnumerable<RelationEntry<T, T2, TData>>, visitor?: IQueryVisitor, param?: IQueryOption) {
        // Filter out new relation with Added slave entity,
        // coz relation has been set at insert query.
        relationEntries = relationEntries.where((o) => !(o.slaveRelation.relationType === "one" && o.slaveEntry.state === EntityState.Added));
        return super.getRelationAddQueries(slaveRelationMetaData, relationEntries, visitor, param);
    }
    protected getRelationDeleteQueries<T, T2, TData>(slaveRelationMetaData: IRelationMetaData<T, T2>, relationEntries: IEnumerable<RelationEntry<T, T2, TData>>, visitor?: IQueryVisitor, param?: IQueryOption) {
        // Filter out deleted relation that have related new relation,
        // coz relation have been replaced.
        relationEntries = relationEntries.where((o) => {
            if (o.slaveRelation.completeRelationType !== "many-many") {
                const relGroup = o.slaveEntry.relationMap[o.slaveRelation.propertyName];
                if (relGroup != null) {
                    return !Enumerable.from(relGroup).any(([, relEntry]) => relEntry.state === RelationState.Added);
                }
            }

            return true;
        });

        return super.getRelationDeleteQueries(slaveRelationMetaData, relationEntries, visitor, param);
    }
}
