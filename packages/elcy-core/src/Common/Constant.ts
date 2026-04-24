import { GenericType, PrimitiveType } from "./Type";

export const ClassBase = Object.getPrototypeOf(Function) as GenericType;
export const Null: PrimitiveType<null> = () => null;
