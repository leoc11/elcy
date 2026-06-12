export {}

declare global {
    interface ValueTypeRegistry extends DateValueTypeRegistry, TimeValueTypeRegistry, DateTimeValueTypeRegistry, DecimalValueTypeRegistry, IntValueTypeRegistry, BigIntValueTypeRegistry, RealValueTypeRegistry {
        ArrayBufferLike: ArrayBufferLike;
        string: string;
        boolean: boolean;
        ArrayBufferView: ArrayBufferView;
        ArrayBuffer: ArrayBuffer;
    }
    interface DateValueTypeRegistry {
        Date: Date;
    }
    interface TimeValueTypeRegistry {
        string: string;
        Date: Date;
    }
    interface DateTimeValueTypeRegistry {
        Date: Date;
    }
    interface DecimalValueTypeRegistry {
        string: string;
        number: number;
    }
    interface IntValueTypeRegistry {
        number: number;
    }
    interface BigIntValueTypeRegistry {
        bigint: BigInt;
    }
    interface RealValueTypeRegistry {
        number: number;
    }

    interface DbTypeRegistry {}
}