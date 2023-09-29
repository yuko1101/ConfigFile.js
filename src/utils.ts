import { JsonObject } from "./json_utils";
import fs from "fs";

/**
 * @param defaultOptions
 * @param options
 */
export function bindOptions(defaultOptions: { [s: string]: unknown }, options: { [s: string]: unknown }): { [s: string]: unknown } {
    if (!options) return defaultOptions;
    if (!defaultOptions) return options;
    // TODO: use structuredClone
    const result = { ...defaultOptions };

    const defaultKeys = Object.keys(result);

    for (const key in options) {
        const value = options[key];
        console.log(key, value);
        if (!defaultKeys.includes(key)) {
            // since the key is not in the default options, just add it
            result[key] = value;
            continue;
        }
        // check if the value is an pure object
        if (typeof value === "object" && !Array.isArray(value) && value !== null && value !== undefined && value.constructor.name === "Object") {
            result[key] = bindOptions(result[key] as { [s: string]: unknown }, value as { [s: string]: unknown });
        } else {
            result[key] = value;
        }
    }


    return result;
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
export function renameKeys(obj: JsonObject, newKeys: { [from: string]: string }) {
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