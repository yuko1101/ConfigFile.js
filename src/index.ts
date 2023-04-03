import fs from "fs";

export class ConfigFile {
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;
    private _data: JsonElement;
    public get data(): JsonElement {
        return this._data;
    }
    public set data(value: JsonElement) {
        this._data = value;
    }
    readonly route: (string | number)[];

    constructor(filePath: string | null, defaultConfig: JsonElement, route: (string | number)[] = []) {
        this.filePath = filePath;
        this.defaultConfig = defaultConfig;
        this._data = JSON.parse(JSON.stringify(defaultConfig)); // immutable
        this.route = route;
    }

    async save(compact = false): Promise<ConfigFile> {
        if (this.filePath === null) return this;
        const text = compact ? JSON.stringify(this.data) : JSON.stringify(this.data, null, 4);
        fs.writeFileSync(this.filePath, text);
        return this;
    }

    async load(): Promise<ConfigFile> {
        if (this.filePath === null) return this;
        if (!fs.existsSync(this.filePath)) {
            await this.save();
        }
        const text = fs.readFileSync(this.filePath, "utf-8");
        try {
            this.data = JSON.parse(text);
        } catch (e) {
            console.error(e);
        }
        return this;
    }

    set(key: string | number, value: JsonElement): ConfigFile {
        this.get(key).setHere(value);
        return this;
    }

    add(value: JsonElement): ConfigFile {
        if (!Array.isArray(this.getValue())) this.setHere([]);

        (this.getValue() as JsonElement[]).push(value);

        return this;
    }

    getValue(key?: string | number | undefined): JsonElement | undefined {
        if (key === undefined) {
            if (this.route.length === 0) return this.data;

            const parent = this.getObjectByRoute(this.route.slice(0, -1));
            if (parent === null || parent === undefined) return undefined;

            const lastRouteKey = this.route.slice(-1)[0];

            if (Array.isArray(parent)) {
                if (typeof lastRouteKey !== "number") return undefined;
                return parent[lastRouteKey as number];
            } else {
                if (typeof lastRouteKey !== "string") return undefined;
                return (parent as { [s: string]: JsonElement })[lastRouteKey as string];
            }
        } else {
            const currentObject = this.getObjectByRoute(this.route);
            if (currentObject === null || currentObject === undefined) return undefined;

            if (Array.isArray(currentObject)) {
                if (typeof key !== "number") return undefined;
                return currentObject[key as number];
            } else {
                if (typeof key !== "string") return undefined;
                return (currentObject as { [s: string]: JsonElement })[key as string];
            }
        }
    }

    get(...keys: (string | number)[]): PathResolver {
        const newRoute = [...this.route, ...keys];
        return new PathResolver(this, newRoute);
    }

    has(...keys: (string | number)[]): boolean {
        const newRoute = [...this.route, ...keys];
        let obj = this.data;
        for (let i = 0; i < newRoute.length; i++) {
            if (obj === null || typeof obj !== "object") return false;

            if (Array.isArray(obj)) {
                if (typeof keys[i] !== "number") return false;
                obj = obj[keys[i] as number];
            } else {
                if (typeof keys[i] !== "string") return false;
                obj = (obj as { [s: string]: JsonElement })[keys[i] as string];
            }

            if (obj === undefined) {
                return false;
            }
        }
        return true;
    }

    exists(): boolean {
        return this.has(...this.route);
    }

    resetData(): ConfigFile {
        this.data = this.defaultConfig;
        return this;
    }

    resetPath(): ConfigFile {
        this.route.splice(0, this.route.length);
        return this;
    }

    private setHere(value: JsonElement) {
        if (this.route.length === 0) {
            this.data = value;
            return;
        }

        this.createPath(this.route);
        const parent = this.getObjectByRoute(this.route.slice(0, -1));

        const lastRouteKey = this.route.slice(-1)[0];

        if (Array.isArray(parent)) {
            parent[lastRouteKey as number] = value;
        } else {
            (parent as { [s: string]: JsonElement })[lastRouteKey as string] = value;
        }
    }

    /**
     * @param route
     * @returns Returns null if it is not an object and undefined if it does not exist.
     */
    private getObjectByRoute(route: (string | number)[]): object | null | undefined {
        if (this.data === null || typeof this.data !== "object") return undefined;
        let obj: JsonElement = this.data;
        for (let i = 0; i < route.length; i++) {
            if (typeof obj !== "object" || obj === null) return undefined;
            if (Array.isArray(obj)) {
                if (typeof route[i] !== "number") return undefined;
                obj = obj[route[i] as number];
            } else {
                if (typeof route[i] !== "string") return undefined;
                obj = (obj as { [s: string]: JsonElement })[route[i] as string];
            }
            if (obj === undefined) return undefined;
        }
        if (typeof obj !== "object" || obj === null) return null;
        return obj;
    }

    /**
     * @param route
     * @param arrayAtLastPath Whether to create the last path as array. If null provided, this doesn't create any object at the last path.
     * @returns Whether there have been any changes.
     */
    private createPath(route: (string | number)[], arrayAtLastPath: boolean | null = null) {
        let isChanged = false;
        function changed() {
            isChanged = true;
        }

        this.data = this._createPath(this.data, arrayAtLastPath, changed, [...route]);

        return isChanged;
    }

    private _createPath(data: JsonElement, arrayAtLastPath: boolean | null, changed: () => void, remainingRoute: (string | number)[] = []): JsonElement {
        const key = remainingRoute.shift();
        const isArrayKey = typeof key === "number";
        const isObjectKey = !isArrayKey && key !== undefined;
        if (typeof data !== "object" || data === null || data === undefined || (isArrayKey && !Array.isArray(data)) || (isObjectKey && Array.isArray(data))) {
            // probably need fix
            if (isArrayKey || (key === undefined && arrayAtLastPath === true)) {
                const array: JsonElement[] = [];
                if (key !== undefined) array[key] = this._createPath(null, arrayAtLastPath, changed, remainingRoute);
                changed();
                return array;
            } else if (isObjectKey || (key === undefined && arrayAtLastPath === false)) {
                const obj: { [s: string]: JsonElement } = {};
                if (key !== undefined) obj[key] = this._createPath(null, arrayAtLastPath, changed, remainingRoute);
                changed();
                return obj;
            } else if (data === undefined) {
                // key === undefined && arrayAtLastPath === null && data === undefined
                changed();
                return null;
            } else {
                // key === undefined && arrayAtLastPath === null && data !== undefined
                // fix not needed
                return data;
            }
        } else if (key === undefined) {
            // fix not needed
            return data;
        } else {
            // fix not needed

            // Needless if statement but to avoid type errors.
            if (Array.isArray(data)) {

                (data as JsonElement[])[key as number] = this._createPath((data as JsonElement[])[key as number], arrayAtLastPath, changed, remainingRoute);
            } else {
                (data as { [s: string]: JsonElement })[key as string] = this._createPath((data as { [s: string]: JsonElement })[key as string], arrayAtLastPath, changed, remainingRoute);
            }
            return data as { [s: string]: JsonElement } | JsonElement[];
        }
    }
}

class PathResolver extends ConfigFile {
    readonly configFile: ConfigFile;

    constructor(configFile: ConfigFile, route: (string | number)[]) {
        super(configFile.filePath, configFile.defaultConfig, route);

        this.configFile = configFile;
    }

    public override get data(): JsonElement {
        return this.configFile.data;
    }
    public override set data(value: JsonElement) {
        this.configFile.data = value;
    }

    override get(...keys: (string | number)[]): PathResolver {
        const newRoute = [...this.route, ...keys];
        return new PathResolver(this.configFile, newRoute);
    }

}

export type JsonElement = number | boolean | string | { [s: string]: JsonElement } | JsonElement[] | null;

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