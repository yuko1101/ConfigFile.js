import { InvalidTypeError } from "./json_manager";
import { FlexJsonArray, FlexJsonElement, FlexJsonObject, JsonOptions, isFlexJsonArray, isFlexJsonObject } from "./json_utils";

/** Readonly but super fast */
export class JsonReader<O extends JsonOptions> {
    readonly jsonOptions: O;
    readonly data: FlexJsonElement<O> | undefined;
    constructor(jsonOptions: O, data: FlexJsonElement<O> | undefined) {
        this.data = data;
        this.jsonOptions = jsonOptions;
    }

    /** @returns undefined if it does not exist */
    getValue(...key: (string | number)[]): FlexJsonElement<O> | undefined {
        return getChild(this.data, ...key);
    }

    get(...keys: (string | number)[]): JsonReader<O> {
        return new JsonReader(this.jsonOptions, getChild(this.data, ...keys));
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

    // bigint
    getAsBigint(...key: (string | number)[]): O["allowBigint"] extends true ? bigint : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        if (typeof value !== "bigint") throw new InvalidTypeError(value);
        return value;
    }

    getAsBigintWithDefault<T>(defaultValue: T, ...key: (string | number)[]): O["allowBigint"] extends true ? bigint | T : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        // TODO: remove casting
        if (value === undefined) return defaultValue as O["allowBigint"] extends true ? bigint | T : never;
        if (typeof value !== "bigint") throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableBigint(...key: (string | number)[]): O["allowBigint"] extends true ? bigint | null : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        if (value !== null && typeof value !== "bigint") throw new InvalidTypeError(value);
        // TODO: remove casting
        return value as O["allowBigint"] extends true ? bigint | null : never;
    }

    getAsNullableBigintWithDefault<T>(defaultValue: T, ...key: (string | number)[]): O["allowBigint"] extends true ? bigint | null | T : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        // TODO: remove casting
        if (value === undefined) return defaultValue as O["allowBigint"] extends true ? bigint | null | T : never;
        if (value !== null && typeof value !== "bigint") throw new InvalidTypeError(value);
        // TODO: remove casting
        return value as O["allowBigint"] extends true ? bigint | null | T : never;
    }

    // number or bigint
    getAsNumberOrBigint(...key: (string | number)[]): O["allowBigint"] extends true ? number | bigint : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        if (typeof value !== "number" && typeof value !== "bigint") throw new InvalidTypeError(value);
        // TODO: remove casting
        return value as O["allowBigint"] extends true ? number | bigint : never;
    }

    getAsNumberOrBigintWithDefault<T>(defaultValue: T, ...key: (string | number)[]): O["allowBigint"] extends true ? number | bigint | T : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        // TODO: remove casting
        if (value === undefined) return defaultValue as O["allowBigint"] extends true ? number | bigint | T : never;
        if (typeof value !== "number" && typeof value !== "bigint") throw new InvalidTypeError(value);
        // TODO: remove casting
        return value as O["allowBigint"] extends true ? number | bigint | T : never;
    }

    getAsNullableNumberOrBigint(...key: (string | number)[]): O["allowBigint"] extends true ? number | bigint | null : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        if (value !== null && typeof value !== "number" && typeof value !== "bigint") throw new InvalidTypeError(value);
        // TODO: remove casting
        return value as O["allowBigint"] extends true ? number | bigint | null : never;
    }

    getAsNullableNumberOrBigintWithDefault<T>(defaultValue: T, ...key: (string | number)[]): O["allowBigint"] extends true ? number | bigint | null | T : never {
        if (!this.jsonOptions.allowBigint) throw new Error("Bigint is not allowed");
        const value = getChild(this.data, ...key);
        // TODO: remove casting
        if (value === undefined) return defaultValue as O["allowBigint"] extends true ? number | bigint | null | T : never;
        if (value !== null && typeof value !== "number" && typeof value !== "bigint") throw new InvalidTypeError(value);
        // TODO: remove casting
        return value as O["allowBigint"] extends true ? number | bigint | null | T : never;
    }

    // JsonObject
    getAsJsonObject(...key: (string | number)[]): FlexJsonObject<O> {
        const value = getChild(this.data, ...key);
        if (!isFlexJsonObject(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsJsonObjectWithDefault<T>(defaultValue: T, ...key: (string | number)[]): FlexJsonObject<O> | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (!isFlexJsonObject(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonObject(...key: (string | number)[]): FlexJsonObject<O> | null {
        const value = getChild(this.data, ...key);
        if (value !== null && !isFlexJsonObject(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonObjectWithDefault<T>(defaultValue: T, ...key: (string | number)[]): FlexJsonObject<O> | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && !isFlexJsonObject(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    // JsonArray
    getAsJsonArray(...key: (string | number)[]): FlexJsonArray<O> {
        const value = getChild(this.data, ...key);
        if (!isFlexJsonArray(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsJsonArrayWithDefault<T>(defaultValue: T, ...key: (string | number)[]): FlexJsonArray<O> | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (!isFlexJsonArray(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonArray(...key: (string | number)[]): FlexJsonArray<O> | null {
        const value = getChild(this.data, ...key);
        if (value !== null && !isFlexJsonArray(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonArrayWithDefault<T>(defaultValue: T, ...key: (string | number)[]): FlexJsonArray<O> | null | T {
        const value = getChild(this.data, ...key);
        if (value === undefined) return defaultValue;
        if (value !== null && !isFlexJsonArray(this.jsonOptions, value)) throw new InvalidTypeError(value);
        return value;
    }

    // map
    mapEntry<T>(callback: (key: string | number, json: JsonReader<O>) => T): T[] {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as FlexJsonArray<O>).map((_, i) => i) : Object.keys(this.data as FlexJsonObject<O>);
        const keyCount = keys.length;
        const result: T[] = [];
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as FlexJsonArray<O>)[key as number] : (this.data as FlexJsonObject<O>)[key as string];
            result.push(callback(key, new JsonReader(this.jsonOptions, value)));
        }
        return result;
    }

    mapArray<T>(callback: (key: number, json: JsonReader<O>) => T): T[] {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        const result: T[] = [];
        for (let i = 0; i < len; i++) {
            result.push(callback(i, new JsonReader(this.jsonOptions, this.data[i])));
        }
        return result;
    }

    mapObject<T>(callback: (key: string, json: JsonReader<O>) => T): T[] {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        const result: T[] = [];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            result.push(callback(key, new JsonReader(this.jsonOptions, this.data[key])));
        }
        return result;
    }

    // find
    findEntry(predicate: (key: string | number, json: JsonReader<O>) => boolean): [string | number, JsonReader<O>] | undefined {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as FlexJsonArray<O>).map((_, i) => i) : Object.keys(this.data as FlexJsonObject<O>);
        const keyCount = keys.length;
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as FlexJsonArray<O>)[key as number] : (this.data as FlexJsonObject<O>)[key as string];
            const json = new JsonReader(this.jsonOptions, value);
            if (predicate(key, json)) return [key, json];
        }
        return undefined;
    }

    findArray(predicate: (key: number, json: JsonReader<O>) => boolean): [number, JsonReader<O>] | undefined {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        for (let i = 0; i < len; i++) {
            const json = new JsonReader(this.jsonOptions, this.data[i]);
            if (predicate(i, json)) return [i, json];
        }
        return undefined;
    }

    findObject(predicate: (key: string, json: JsonReader<O>) => boolean): [string, JsonReader<O>] | undefined {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const json = new JsonReader(this.jsonOptions, this.data[key]);
            if (predicate(key, json)) return ([key, json]);
        }
        return undefined;
    }

    // filter
    filterEntry(predicate: (key: string | number, json: JsonReader<O>) => boolean): [string | number, JsonReader<O>][] {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as FlexJsonArray<O>).map((_, i) => i) : Object.keys(this.data as FlexJsonObject<O>);
        const keyCount = keys.length;
        const result: [string | number, JsonReader<O>][] = [];
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as FlexJsonArray<O>)[key as number] : (this.data as FlexJsonObject<O>)[key as string];
            const json = new JsonReader(this.jsonOptions, value);
            if (predicate(key, json)) {
                result.push([key, json]);
            }
        }
        return result;
    }

    filterArray(predicate: (key: number, json: JsonReader<O>) => boolean): [number, JsonReader<O>][] {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        const result: [number, JsonReader<O>][] = [];
        for (let i = 0; i < len; i++) {
            const json = new JsonReader(this.jsonOptions, this.data[i]);
            if (predicate(i, json)) {
                result.push([i, json]);
            }
        }
        return result;
    }

    filterObject(predicate: (key: string, json: JsonReader<O>) => boolean): [string, JsonReader<O>][] {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        const result: [string, JsonReader<O>][] = [];
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const json = new JsonReader(this.jsonOptions, this.data[key]);
            if (predicate(key, json)) {
                result.push([key, json]);
            }
        }
        return result;
    }

    // forEach
    forEachEntry(callback: (key: string | number, json: JsonReader<O>) => void) {
        if (this.data === null || typeof this.data !== "object") throw new InvalidTypeError(this.data);
        const isArray = Array.isArray(this.data);
        const keys = isArray ? (this.data as FlexJsonArray<O>).map((_, i) => i) : Object.keys(this.data as FlexJsonObject<O>);
        const keyCount = keys.length;
        for (let i = 0; i < keyCount; i++) {
            const key = keys[i];
            const value = isArray ? (this.data as FlexJsonArray<O>)[key as number] : (this.data as FlexJsonObject<O>)[key as string];
            callback(key, new JsonReader(this.jsonOptions, value));
        }
    }

    forEachArray(callback: (key: number, json: JsonReader<O>) => void) {
        if (this.data === null || typeof this.data !== "object" || !Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const len = this.data.length;
        for (let i = 0; i < len; i++) {
            callback(i, new JsonReader(this.jsonOptions, this.data[i]));
        }
    }

    forEachObject(callback: (key: string, json: JsonReader<O>) => void) {
        if (this.data === null || typeof this.data !== "object" || Array.isArray(this.data)) throw new InvalidTypeError(this.data);
        const keys = Object.keys(this.data);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            callback(key, new JsonReader(this.jsonOptions, this.data[key]));
        }
    }

    has(...keys: (string | number)[]): boolean {
        return getChild(this.data, ...keys) !== undefined;
    }
}

function getChild<O extends JsonOptions>(data: FlexJsonElement<O> | undefined, ...keys: (string | number)[]): FlexJsonElement<O> | undefined {
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