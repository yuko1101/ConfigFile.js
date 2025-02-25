export type FlexJsonElement<O extends JsonOptions> = number | boolean | string | FlexJsonObject<O> | FlexJsonArray<O> | null | (JsonOptions["allowBigint"] extends true ? bigint : never);
type _FlexJsonObject<O extends JsonOptions, T extends FlexJsonElement<O>> = { [s: string]: T };
type _FlexJsonArray<O extends JsonOptions, T extends FlexJsonElement<O>> = T[];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FlexJsonObject<O extends JsonOptions, T extends FlexJsonElement<O> = FlexJsonElement<O>> extends _FlexJsonObject<O, T> { }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FlexJsonArray<O extends JsonOptions, T extends FlexJsonElement<O> = FlexJsonElement<O>> extends _FlexJsonArray<O, T> { }

export function isFlexJsonElement<O extends JsonOptions>(options: O, value: unknown): value is FlexJsonElement<O> {
    const type = typeof value;
    if (type === "number" || type === "boolean" || type === "string" || value === null) return true;
    if (options.allowBigint && type === "bigint") return true;
    if (type !== "object" || value === undefined) return false;

    if (Array.isArray(value)) {
        return value.every(e => isFlexJsonElement(e, options));
    } else {
        return Object.values(value).every(v => isFlexJsonElement(v, options));
    }
}

export function isFlexJsonObject<O extends JsonOptions>(options: O, value: unknown): value is FlexJsonObject<O> {
    const type = typeof value;
    if (type !== "object" || value === null || value === undefined) return false;

    if (Array.isArray(value)) return false;

    return Object.values(value).every(v => isFlexJsonElement(v, options));
}

export function isFlexJsonArray<O extends JsonOptions>(options: O, value: unknown): value is FlexJsonArray<O> {
    const type = typeof value;
    if (type !== "object" || value === null || value === undefined) return false;

    if (!Array.isArray(value)) return false;

    return value.every(e => isFlexJsonElement(e, options));
}

export interface JsonOptions {
    allowBigint: boolean;
}

export const defaultJsonOptions = {
    allowBigint: false,
} as const satisfies Partial<JsonOptions>;


export type JsonElement = FlexJsonElement<typeof defaultJsonOptions>
export type JsonObject<T extends JsonElement = JsonElement> = FlexJsonObject<typeof defaultJsonOptions, T>
export type JsonArray<T extends JsonElement = JsonElement> = FlexJsonArray<typeof defaultJsonOptions, T>

export function isJsonObject(value: unknown): value is JsonObject {
    return isFlexJsonObject(defaultJsonOptions, value);
}

export function isJsonArray(value: unknown): value is JsonArray {
    return isFlexJsonArray(defaultJsonOptions, value);
}

export function isJsonElement(value: unknown): value is JsonElement {
    return isFlexJsonElement(defaultJsonOptions, value);
}