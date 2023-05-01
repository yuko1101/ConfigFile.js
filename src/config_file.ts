import fs from "fs";
import { JsonElement, JsonManager, PathResolver } from "./json_utils";

interface IConfigFile extends JsonManager {
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;

    get(...keys: (string | number)[]): ConfigPathResolver;

    saveSync(compact: boolean): ConfigFile;

    loadSync(): ConfigFile;

    save(compact: boolean): Promise<ConfigFile>;

    load(): Promise<ConfigFile>;

    resetData(): ConfigFile;
}

export class ConfigFile extends JsonManager implements IConfigFile {
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;

    constructor(filePath: string | null, defaultConfig: JsonElement, route: (string | number)[] = []) {
        super(JSON.parse(JSON.stringify(defaultConfig)), route);
        this.filePath = filePath;
        this.defaultConfig = defaultConfig;
    }

    override get(...keys: (string | number)[]): ConfigPathResolver {
        const newRoute = [...this.route, ...keys];
        return new ConfigPathResolver(this, newRoute);
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
        const text = compact ? JSON.stringify(this.data) : JSON.stringify(this.data, null, 4);
        await new Promise<void>((resolve, reject) => fs.writeFile(filePath, text, { encoding: "utf-8" }, (err) => {
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
        const text = await new Promise<string>((resolve, reject) => fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
            if (err) reject(err);
            resolve(data);
        }));
        try {
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

class ConfigPathResolver extends PathResolver implements IConfigFile {
    readonly configFile: ConfigFile;
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;

    constructor(configFile: ConfigFile, route: (string | number)[]) {
        super(configFile, route);

        this.configFile = configFile;
        this.filePath = configFile.filePath;
        this.defaultConfig = configFile.defaultConfig;
    }

    override get(...keys: (string | number)[]): ConfigPathResolver {
        const newRoute = [...this.route, ...keys];
        return new ConfigPathResolver(this.configFile, newRoute);
    }

    saveSync(compact = false): ConfigFile {
        return this.configFile.saveSync(compact);
    }

    loadSync(): ConfigFile {
        return this.configFile.loadSync();
    }

    async save(compact = false): Promise<ConfigFile> {
        return await this.configFile.save(compact);
    }

    async load(): Promise<ConfigFile> {
        return await this.configFile.load();
    }

    resetData(): ConfigFile {
        return this.configFile.resetData();
    }

}
