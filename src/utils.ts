import { FlexJsonObject, JsonOptions } from "./json_utils";
import fs from "fs";

export type UnionDiff<T, U> = T extends U ? never : T; // "a"|"b", "b"|"c" => "a"
export type UnionXOR<T, U> = UnionDiff<T, U> | UnionDiff<U, T>; // "a"|"b", "b"|"c" => "a"|"c"
export type UnionAND<T, U> = T extends U ? T : never; // "a"|"b", "b"|"c" => "b"

export type PureObject = { [key: string]: unknown };
export type Merged<T, U> = { [P in UnionXOR<keyof T, keyof U>]: P extends keyof U ? U[P] : P extends keyof T ? T[P] : never } & { [P in UnionAND<keyof T, keyof U>]-?: MergeUndefinable<T[P], U[P]> };
export type MergeUndefinable<T, U> = U extends undefined ? T extends undefined ? undefined : T : T extends undefined ? U : U extends PureObject ? T extends PureObject ? Merged<T, U> : U : U;

export type PartialSome<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
export type RequiredSome<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * the type which will be M when merged with T
 * Merged<T, Complement<T, M>> = M
 */
export type Complement<T, M, ShowMatchedProps extends boolean = true> = { [P in UnionDiff<keyof M, keyof T>]: M[P] } & { [P in UnionAND<keyof T, keyof M> as T[P] extends M[P] ? never : P]: T[P] extends PureObject ? M[P] extends PureObject ? Complement<T[P], M[P]> : M[P] : M[P] } & (ShowMatchedProps extends true ? { [P in UnionAND<keyof T, keyof M> as T[P] extends M[P] ? P : never]?: M[P] } : object);

/**
 * @param defaultOptions
 * @param options
 */
export function bindOptions<T extends PureObject, U extends PureObject>(defaultOptions: T, options: U): Merged<T, U> {
    // TODO: use structuredClone
    const result = deepCopy(defaultOptions) as PureObject;

    const defaultKeys = new Set(Object.keys(result));

    for (const key in options) {
        const value = options[key];
        if (!defaultKeys.has(key)) {
            // since the key is not in the default options, just add it
            result[key] = value;
            continue;
        }
        // check if the value is an pure object
        const defaultValue = result[key];
        if (isPureObject(value) && isPureObject(defaultValue)) {
            result[key] = bindOptions(defaultValue, value);
        } else {
            result[key] = value;
        }
    }


    return result as Merged<T, U>;
}

/**
 * @param obj
 */
export function isPureObject(obj: unknown): obj is PureObject {
    return typeof obj === "object" && !Array.isArray(obj) && obj !== null && obj !== undefined && obj.constructor.name === "Object";
}

/**
 * @param obj
 */
export function deepCopy<T>(obj: T): T {
    if (isPureObject(obj)) {
        const result: PureObject = {};
        for (const key in obj) {
            const value = obj[key];
            if (isPureObject(value)) {
                result[key] = deepCopy(value);
            } else {
                result[key] = value;
            }
        }
        return result as T;
    } else {
        return obj;
    }
}

/** Generates random uuid v4 */
export function generateUuid(): string {
    const chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0; i < chars.length; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}

/**
 * @param array
 * @param callback
 */
export function separateByValue<T>(array: T[], callback: (element: T) => string): { [s: string]: T[] } {
    const result: { [s: string]: T[] } = {};
    for (const element of array) {
        const value = callback(element);
        if (!result[value]) result[value] = [];
        result[value].push(element);
    }
    return result;
}

/**
 * @param obj
 * @param newKeys
 */
export function renameKeys<O extends JsonOptions>(obj: FlexJsonObject<O>, newKeys: { [from: string]: string }) {
    const keyValues = Object.keys(obj).map(key => {
        const newKey = newKeys[key] || key;
        return { [newKey]: obj[key] };
    });
    return Object.assign({}, ...keyValues);
}

/**
 * @param dirFrom
 * @param dirTo
 */
export function move(dirFrom: string, dirTo: string) {
    const files = fs.readdirSync(dirFrom);
    for (const file of files) {
        const loadedFile = fs.lstatSync(`${dirFrom}/${file}`);
        if (loadedFile.isDirectory()) {
            if (!fs.existsSync(`${dirTo}/${file}`)) fs.mkdirSync(`${dirTo}/${file}`);
            move(`${dirFrom}/${file}`, `${dirTo}/${file}`);
            fs.rmdirSync(`${dirFrom}/${file}`, { maxRetries: 3 });
        } else {
            moveFile(`${dirFrom}/${file}`, `${dirTo}/${file}`);
        }
    }
}

/**
 * @param fileFrom
 * @param fileTo
 */
export function moveFile(fileFrom: string, fileTo: string) {
    fs.renameSync(fileFrom, fileTo);
}