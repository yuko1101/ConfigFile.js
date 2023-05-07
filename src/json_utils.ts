export type JsonElement = number | boolean | string | JsonObject | JsonArray | null;
type _JsonObject<T extends JsonElement> = { [s: string]: T };
type _JsonArray<T extends JsonElement> = T[];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonObject<T extends JsonElement = JsonElement> extends _JsonObject<T> { }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonArray<T extends JsonElement = JsonElement> extends _JsonArray<T> { }

export function isJsonElement(value: unknown): value is JsonElement {
    const type = typeof value;
    if (type === "number" || type === "boolean" || type === "string" || value === null) return true;
    if (type !== "object" || value === undefined) return false;

    if (Array.isArray(value)) {
        return value.every(e => isJsonElement(e));
    } else {
        return Object.values(value).every(v => isJsonElement(v));
    }
}

export function isJsonObject(value: unknown): value is JsonObject {
    const type = typeof value;
    if (type !== "object" || value === null || value === undefined) return false;

    if (Array.isArray(value)) return false;

    return Object.values(value).every(v => isJsonElement(v));
}

export function isJsonArray(value: unknown): value is JsonArray {
    const type = typeof value;
    if (type !== "object" || value === null || value === undefined) return false;

    if (!Array.isArray(value)) return false;

    return value.every(e => isJsonElement(e));
}