import fs from "fs";
import { FlexJsonArray, FlexJsonElement, FlexJsonObject, JsonOptions } from "./json_utils";
import { JsonManager, PathResolver } from "./json_manager";

interface IConfigFile<O extends JsonOptions> extends JsonManager<O> {
    readonly filePath: string | null;
    readonly defaultConfig: FlexJsonElement<O>;

    get(...keys: (string | number)[]): ConfigPathResolver<O>;

    map<T>(callback: (entry: ConfigPathResolver<O>) => T): T[]

    find(predicate: (entry: ConfigPathResolver<O>) => boolean): ConfigPathResolver<O> | undefined

    filter(predicate: (entry: ConfigPathResolver<O>) => boolean): ConfigPathResolver<O>[]

    forEach(callback: (entry: ConfigPathResolver<O>) => void): void

    saveSync(compact: boolean): ConfigFile<O>;

    loadSync(): ConfigFile<O>;

    save(compact: boolean): Promise<ConfigFile<O>>;

    load(): Promise<ConfigFile<O>>;

    resetData(): ConfigFile<O>;
}

export class ConfigFile<O extends JsonOptions> extends JsonManager<O> implements IConfigFile<O> {
    readonly filePath: string | null;
    readonly defaultConfig: FlexJsonElement<O>;

    constructor(filePath: string | null, jsonOptions: O, defaultConfig: FlexJsonElement<O>, readonly = false, fastMode = false, route: (string | number)[] = []) {
        // TODO: allow custom json parser
        super(jsonOptions, JSON.parse(JSON.stringify(defaultConfig)), readonly, fastMode, route);
        this.filePath = filePath;
        this.defaultConfig = defaultConfig;
    }

    override get(...keys: (string | number)[]): ConfigPathResolver<O> {
        const newRoute = [...this.route, ...keys];
        let currentData: FlexJsonElement<O> | undefined = undefined;
        if (this.fastMode) {
            currentData = this._currentData;
            const keyCount = keys.length;
            for (let i = 0; i < keyCount; i++) {
                const key = keys[i];
                if (Array.isArray(currentData)) {
                    currentData = currentData[key as number];
                } else {
                    currentData = (currentData as FlexJsonObject<O>)[key as string];
                }
            }
        }
        return new ConfigPathResolver(this, newRoute, currentData);
    }

    override map<T>(callback: (entry: ConfigPathResolver<O>) => T): T[] {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        return pathResolvers.map(callback);
    }

    override find(predicate: (entry: ConfigPathResolver<O>) => boolean): ConfigPathResolver<O> | undefined {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const found = pathResolvers.find(predicate);
        return found;
    }

    override filter(predicate: (entry: ConfigPathResolver<O>) => boolean): ConfigPathResolver<O>[] {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const filtered = pathResolvers.filter(predicate);
        return filtered;
    }

    override forEach(callback: (entry: ConfigPathResolver<O>) => void) {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const len = pathResolvers.length;
        for (let i = 0; i < len; i++) {
            callback(pathResolvers[i]);
        }
    }

    saveSync(compact = false): this {
        if (this.filePath === null) return this;
        const text = compact ? JSON.stringify(this.data) : JSON.stringify(this.data, null, 4);
        fs.writeFileSync(this.filePath, text);
        return this;
    }

    loadSync(): this {
        if (this.filePath === null) return this;
        if (!fs.existsSync(this.filePath)) {
            this.saveSync();
        }
        const text = fs.readFileSync(this.filePath, "utf-8");
        try {
            this.data = JSON.parse(text);
        } catch (e) {
            console.error(e);
        }
        return this;
    }

    async save(compact = false): Promise<this> {
        if (this.filePath === null) return this;
        const filePath: string = this.filePath;
        // TODO: allow custom json parser
        const text = compact ? JSON.stringify(this.data) : JSON.stringify(this.data, null, 4);
        await new Promise<void>((resolve, reject) => fs.writeFile(filePath, text, { encoding: "utf-8" }, (err: any) => {
            if (err) reject(err);
            resolve();
        }));
        return this;
    }

    async load(): Promise<this> {
        if (this.filePath === null) return this;
        const filePath: string = this.filePath;
        if (!fs.existsSync(filePath)) {
            await this.save();
        }
        const text = await new Promise<string>((resolve, reject) => fs.readFile(filePath, { encoding: "utf-8" }, (err: any, data: string | PromiseLike<string>) => {
            if (err) reject(err);
            resolve(data);
        }));
        try {
            // TODO: allow custom json parser
            this.data = JSON.parse(text);
        } catch (e) {
            console.error(e);
        }
        return this;
    }

    resetData(): this {
        this.data = JSON.parse(JSON.stringify(this.defaultConfig));
        return this;
    }
}

class ConfigPathResolver<O extends JsonOptions> extends PathResolver<O> implements IConfigFile<O> {
    readonly configFile: ConfigFile<O>;
    readonly filePath: string | null;
    readonly defaultConfig: FlexJsonElement<O>;

    constructor(configFile: ConfigFile<O>, route: (string | number)[], currentData: FlexJsonElement<O> | undefined) {
        super(configFile, route, currentData);

        this.configFile = configFile;
        this.filePath = configFile.filePath;
        this.defaultConfig = configFile.defaultConfig;
    }

    override get(...keys: (string | number)[]): ConfigPathResolver<O> {
        const newRoute = [...this.route, ...keys];
        let currentData: FlexJsonElement<O> | undefined = undefined;
        if (this.fastMode) {
            currentData = this._currentData;
            const keyCount = keys.length;
            for (let i = 0; i < keyCount; i++) {
                const key = keys[i];
                if (Array.isArray(currentData)) {
                    currentData = currentData[key as number];
                } else {
                    currentData = (currentData as FlexJsonObject<O>)[key as string];
                }
            }
        }
        return new ConfigPathResolver(this.configFile, newRoute, currentData);
    }

    override map<T>(callback: (entry: ConfigPathResolver<O>) => T): T[] {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        return pathResolvers.map(callback);
    }

    override find(predicate: (entry: ConfigPathResolver<O>) => boolean): ConfigPathResolver<O> | undefined {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const found = pathResolvers.find(predicate);
        return found;
    }

    override filter(predicate: (entry: ConfigPathResolver<O>) => boolean): ConfigPathResolver<O>[] {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const filtered = pathResolvers.filter(predicate);
        return filtered;
    }

    override forEach(callback: (entry: ConfigPathResolver<O>) => void) {
        const dataHere = this.getAs<FlexJsonObject<O> | FlexJsonArray<O>>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver<O>[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const len = pathResolvers.length;
        for (let i = 0; i < len; i++) {
            callback(pathResolvers[i]);
        }
    }

    saveSync(compact = false): ConfigFile<O> {
        return this.configFile.saveSync(compact);
    }

    loadSync(): ConfigFile<O> {
        return this.configFile.loadSync();
    }

    async save(compact = false): Promise<ConfigFile<O>> {
        return await this.configFile.save(compact);
    }

    async load(): Promise<ConfigFile<O>> {
        return await this.configFile.load();
    }

    resetData(): ConfigFile<O> {
        return this.configFile.resetData();
    }

}
