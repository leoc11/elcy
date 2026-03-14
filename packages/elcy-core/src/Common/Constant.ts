import { GenericType } from "./Type";

export const ClassBase = Object.getPrototypeOf(Function) as GenericType;
export const NullConstructor: () => null = () => null;
