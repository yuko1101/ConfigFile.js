import { FlexJsonElement, JsonOptions } from "./json_utils";

export abstract class JsonTransformer<O extends JsonOptions, F extends FlexJsonElement<O>, T extends FlexJsonElement<O>> {
    readonly jsonOptions: O;

    constructor(jsonOptions: O) {
        this.jsonOptions = jsonOptions;
    }

    abstract transform(value: F): T;
}

export type JsonTransformChainType<O extends JsonOptions, C extends JsonTransformer<O, FlexJsonElement<O>, FlexJsonElement<O>>[], I extends FlexJsonElement<O>> =
    C extends []
    ? I
    : C extends [JsonTransformer<O, infer F, infer T>]
    ? F extends I
    ? T
    : never
    : C extends [JsonTransformer<O, infer F, infer T>, ...infer R extends (JsonTransformer<O, FlexJsonElement<O>, FlexJsonElement<O>>[] | never)]
    ? F extends I
    ? R extends never
    ? T
    : JsonTransformChainType<O, R, T>
    : never
    : never;

export class JsonTransformerChain<
    O extends JsonOptions,
    const C extends JsonTransformer<O, FlexJsonElement<O>, FlexJsonElement<O>>[],
    F extends (C[0] extends JsonTransformer<O, infer FROM, FlexJsonElement<O>> ? FROM : never),
    T extends JsonTransformChainType<O, C, FlexJsonElement<O>>,
> extends JsonTransformer<O, F, T> {
    readonly transformers: C;

    constructor(jsonOptions: O, transformers: C) {
        super(jsonOptions);
        this.transformers = transformers;
    }

    transform(value: F): T {
        let transformedValue: FlexJsonElement<O> = value;
        for (const transformer of this.transformers) {
            transformedValue = transformer.transform(transformedValue);
        }
        return transformedValue as T;
    }
}