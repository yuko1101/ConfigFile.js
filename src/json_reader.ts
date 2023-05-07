import { InvalidTypeError } from "./json_manager";
import { JsonArray, JsonElement, JsonObject, isJsonArray, isJsonObject } from "./json_utils";

/** Readonly but super fast */
export class JsonReader {
    readonly data: JsonElement | undefined;
    constructor(data: JsonElement | undefined) {
        this.data = data;
    }

    /** @returns undefined if it does not exist */
    getValue(...key: (string | number)[]): JsonElement | undefined {
        return getChild(this.data, ...key);
    }

    get(...keys: (string | number)[]): JsonReader {
        return new JsonReader(getChild(this.data, ...keys));
    }

    // number
    getAsNumber(...key: (string | number)[]): number {
        const value = getChild(this.data, ...key);
        if (typeof value !== "number") throw new InvalidTypeError(value);
        return value;
    }

    getAsNumberWithDefault<T>(defaultValue: T, ...key: (string | number)[]): number | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (typeof value !== "number") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableNumber(...key: (string | number)[]): number | null {
        const value = getChild(this.data, ...key);
        if (value !== null && typeof value !== "number") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableNumberWithDefault<T>(defaultValue: T, ...key: (string | number)[]): number | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && typeof value !== "number") throw new InvalidTypeError(value);
        return value;
    }

    // string
    getAsString(...key: (string | number)[]): string {
        const value = getChild(this.data, ...key);
        if (typeof value !== "string") throw new InvalidTypeError(value);
        return value;
    }
    getAsStringWithDefault<T>(defaultValue: T, ...key: (string | number)[]): string | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (typeof value !== "string") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableString(...key: (string | number)[]): string | null {
        const value = getChild(this.data, ...key);
        if (value !== null && typeof value !== "string") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableStringWithDefault<T>(defaultValue: T, ...key: (string | number)[]): string | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && typeof value !== "string") throw new InvalidTypeError(value);
        return value;
    }

    // boolean
    getAsBoolean(...key: (string | number)[]): boolean {
        const value = getChild(this.data, ...key);
        if (typeof value !== "boolean") throw new InvalidTypeError(value);
        return value;
    }

    getAsBooleanWithDefault<T>(defaultValue: T, ...key: (string | number)[]): boolean | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (typeof value !== "boolean") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableBoolean(...key: (string | number)[]): boolean | null {
        const value = getChild(this.data, ...key);
        if (value !== null && typeof value !== "boolean") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableBooleanWithDefault<T>(defaultValue: T, ...key: (string | number)[]): boolean | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && typeof value !== "boolean") throw new InvalidTypeError(value);
        return value;
    }

    // JsonObject
    getAsJsonObject(...key: (string | number)[]): JsonObject {
        const value = getChild(this.data, ...key);
        if (!isJsonObject(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsJsonObjectWithDefault<T>(defaultValue: T, ...key: (string | number)[]): JsonObject | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (!isJsonObject(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonObject(...key: (string | number)[]): JsonObject | null {
        const value = getChild(this.data, ...key);
        if (value !== null && !isJsonObject(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonObjectWithDefault<T>(defaultValue: T, ...key: (string | number)[]): JsonObject | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && !isJsonObject(value)) throw new InvalidTypeError(value);
        return value;
    }

    // JsonArray
    getAsJsonArray(...key: (string | number)[]): JsonArray {
        const value = getChild(this.data, ...key);
        if (!isJsonArray(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsJsonArrayWithDefault<T>(defaultValue: T, ...key: (string | number)[]): JsonArray | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (!isJsonArray(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonArray(...key: (string | number)[]): JsonArray | null {
        const value = getChild(this.data, ...key);
        if (value !== null && !isJsonArray(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonArrayWithDefault<T>(defaultValue: T, ...key: (string | number)[]): JsonArray | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && !isJsonArray(value)) throw new InvalidTypeError(value);
        return value;
    }

    // map
    map<T>(callback: (key: string | number, json: JsonReader) => T): T[] {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as JsonArray).map((_, i) => i) : Object.keys(this.data as JsonObject);
        const keyCount = keys.length;
        const result: T[] = [];
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as JsonArray)[key as number] : (this.data as JsonObject)[key as string];
            result.push(callback(key, new JsonReader(value)));
        }
        return result;
    }

    mapArray<T>(callback: (key: number, json: JsonReader) => T): T[] {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        const result: T[] = [];
        for (let i = 0; i < len; i++) {
            result.push(callback(i, new JsonReader(this.data[i])));
        }
        return result;
    }

    mapObject<T>(callback: (key: string, json: JsonReader) => T): T[] {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        const result: T[] = [];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            result.push(callback(key, new JsonReader(this.data[key])));
        }
        return result;
    }

    // find
    find(predicate: (key: string | number, json: JsonReader) => boolean): [string | number, JsonReader] | undefined {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as JsonArray).map((_, i) => i) : Object.keys(this.data as JsonObject);
        const keyCount = keys.length;
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as JsonArray)[key as number] : (this.data as JsonObject)[key as string];
            const json = new JsonReader(value);
            if (predicate(key, json)) return [key, json];
        }
        return undefined;
    }

    findArray(predicate: (key: number, json: JsonReader) => boolean): [number, JsonReader] | undefined {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        for (let i = 0; i < len; i++) {
            const json = new JsonReader(this.data[i]);
            if (predicate(i, json)) return [i, json];
        }
        return undefined;
    }

    findObject(predicate: (key: string, json: JsonReader) => boolean): [string, JsonReader] | undefined {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const json = new JsonReader(this.data[key]);
            if (predicate(key, json)) return ([key, json]);
        }
        return undefined;
    }

    // filter
    filter(predicate: (key: string | number, json: JsonReader) => boolean): [string | number, JsonReader][] {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as JsonArray).map((_, i) => i) : Object.keys(this.data as JsonObject);
        const keyCount = keys.length;
        const result: [string | number, JsonReader][] = [];
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as JsonArray)[key as number] : (this.data as JsonObject)[key as string];
            const json = new JsonReader(value);
            if (predicate(key, json)) {
                result.push([key, json]);
            }
        }
        return result;
    }

    filterArray(predicate: (key: number, json: JsonReader) => boolean): [number, JsonReader][] {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        const result: [number, JsonReader][] = [];
        for (let i = 0; i < len; i++) {
            const json = new JsonReader(this.data[i]);
            if (predicate(i, json)) {
                result.push([i, json]);
            }
        }
        return result;
    }

    filterObject(predicate: (key: string, json: JsonReader) => boolean): [string, JsonReader][] {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        const result: [string, JsonReader][] = [];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const json = new JsonReader(this.data[key]);
            if (predicate(key, json)) {
                result.push([key, json]);
            }
        }
        return result;
    }

    // forEach
    forEach(callback: (key: string | number, json: JsonReader) => void) {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as JsonArray).map((_, i) => i) : Object.keys(this.data as JsonObject);
        const keyCount = keys.length;
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as JsonArray)[key as number] : (this.data as JsonObject)[key as string];
            callback(key, new JsonReader(value));
        }
    }

    forEachArray(callback: (key: number, json: JsonReader) => void) {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        for (let i = 0; i < len; i++) {
            callback(i, new JsonReader(this.data[i]));
        }
    }

    forEachObject(callback: (key: string, json: JsonReader) => void) {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            callback(key, new JsonReader(this.data[key]));
        }
    }

    has(...keys: (string | number)[]): boolean {
        return getChild(this.data, ...keys) !== undefined;
    }
}

function getChild(data: JsonElement | undefined, ...keys: (string | number)[]): JsonElement | undefined {
    const keyCount = keys.length;
    for (let i = 0; i < keyCount; i++) {
        if (data === null || typeof data !== "object") return undefined;
        const key = keys[i];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data = data[key];
    }
    return data;
}