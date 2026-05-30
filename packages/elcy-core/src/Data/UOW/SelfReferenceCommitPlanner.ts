import { IRelationMetaData } from "src/MetaData";
import { EntityEntry } from "../EntityEntry";
import { Enumerable } from "@elcy/enumerable";

export function* planSelfReferenceCommit<TE extends object>(selfReferences: Set<IRelationMetaData<TE>>, addEntries: EntityEntry[]) {
    const entityMap = Enumerable.from(addEntries).toMap(o => o.entity);
    const childMap = new Map<EntityEntry, Set<EntityEntry>>();
    const parentMap = new Map<EntityEntry, Set<EntityEntry>>();

    let batch: EntityEntry[] = [];
    for (const entry of addEntries) {
        let isValid = true;
        for (const rel of selfReferences) {
            const parentEntity = entry.entity[rel.propertyName];
            if (entityMap.has(parentEntity)) {
                const parentEntry = entityMap.get(parentEntity);
                let childSet = childMap.get(parentEntry);
                if (!childSet) {
                    childSet = new Set();
                    childMap.set(parentEntry, childSet);
                }
                childSet.add(entry);
                let parentSet = parentMap.get(entry);
                if (!parentSet) {
                    parentSet = new Set();
                    parentMap.set(entry, parentSet);
                }
                parentSet.add(parentEntry);
                isValid = false;
            }
        }

        if (!isValid) {
            continue;
        }

        batch.push(entry);
    }

    if (batch.length) {
        yield batch;
    }

    while (parentMap.size) {
        for (const entry of batch) {
            childMap.get(entry)?.forEach(o => parentMap.get(o).delete(entry));
        }
        batch = Enumerable.from(parentMap)
            .filter(o => !Boolean(o[1].size))
            .map(o => {
                parentMap.delete(o[0]);
                return o[0];
            })
            .toArray();

        if (!batch.length) {
            throw "circular required self reference detected. cannot be resolved";
        }

        yield batch;
    }

}