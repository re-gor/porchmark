import {Command} from 'commander';
import path from 'path';

import {IComparison, IConfig, IPartialConfig, mergeWithDefaults, validateConfig} from '@/lib/config';

import {isInteractive} from '@/lib/helpers';
import {getLogger, setLevel} from '@/lib/logger';
import joi from '@hapi/joi';

const logger = getLogger();

export interface ICompareMetricsArgv {
    iterations?: number;
    parallel?: number;
    mobile?: boolean;
    insecure?: boolean;
    timeout?: number;
    config?: string;
    verbose?: number;
}

export const defaultDesktopProfile = {
    height: 768,
    width: 1366,
};

export const defaultMobileProfile = {
    userAgent: 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/76.0.3809.100 Mobile Safari/537.36',
    height: 667,
    width: 375,
};

export function readConfig(configPath: string): IPartialConfig {
    try {
        const config = require(configPath);
        return config as IPartialConfig;
    } catch (e) {
        if (e.code !== 'MODULE_NOT_FOUND') {
            logger.fatal(`invalid config at path ${configPath}: ${e.stack}`);
            return process.exit(1);
        }

        return {};
    }
}

export async function resolveConfig(commanderArgv: Command): Promise<IConfig> {
    const porchmarkConfPath = path.resolve(process.cwd(), 'porchmark.conf.js');

    let configPath = '';

    let rawConfig: IPartialConfig = {};

    if (typeof commanderArgv.config === 'string') {
        // config option
        configPath = path.isAbsolute(commanderArgv.config)
            ? commanderArgv.config
            : path.resolve(process.cwd(), commanderArgv.config);
        rawConfig = readConfig(configPath);
    } else {
        // porchmark.conf.js exists
        configPath = porchmarkConfPath;
        rawConfig = readConfig(configPath);
    }

    logger.debug('raw config', porchmarkConfPath, rawConfig);

    const config = mergeWithDefaults(rawConfig as IConfig);

    if (!config.workDir) {
        config.workDir = process.cwd();
    }

    if (typeof commanderArgv.mobile === 'boolean') {
        config.browserProfile.mobile = commanderArgv.mobile;
    }

    addOptsFromArgv(config, commanderArgv as ICompareMetricsArgv);
    addSitesFromArgv(config, commanderArgv);

    // convert seconds to ms
    config.pageTimeout = config.pageTimeout * 1000;

    initBrowserProfile(config);

    if (!isInteractive()) {
        config.withoutUi = true;
    }

    normalizeMetrics(config);

    logger.debug('config', config);

    try {
        await validateConfig(config);

        setLevel(config.logLevel);
    } catch (error) {
        // @ts-ignore
        if (error instanceof joi.ValidationError) {
            logger.fatal(`invalid config ${configPath ? `file=${configPath}` : ''}`);

            error.details.forEach((e: any) => {
                logger.fatal(`path=${e.path.join('.')}, ${e.message}`);
            });
        } else {
            logger.fatal(error);
        }

        process.exit(1);
    }

    return config;
}

function addOptsFromArgv(config: IConfig, commanderArgv: ICompareMetricsArgv) {
    if (typeof commanderArgv.iterations === 'number') {
        config.iterations = commanderArgv.iterations;
    }

    if (typeof commanderArgv.parallel === 'number') {
        config.workers = commanderArgv.parallel;
    }

    if (typeof commanderArgv.insecure === 'boolean') {
        config.puppeteerOptions.ignoreHTTPSErrors = commanderArgv.insecure;
    }

    if (typeof commanderArgv.timeout === 'number') {
        config.pageTimeout = commanderArgv.timeout;
    }

    if (typeof commanderArgv.verbose === 'number') {
        if (commanderArgv.verbose === 1) {
            config.logLevel = 'debug';
        } else if (commanderArgv.verbose > 1) {
            config.logLevel = 'trace';
        }
    }
}

function addSitesFromArgv(config: IConfig, cmd: Command) {
    const sites: string[] = cmd.args;

    if (sites && sites.length) {
        const comparison: IComparison = {
            name: 'compare',
            sites: sites.map((url, index) => ({
                name: `site${index}`,
                url,
            })),
        };

        config.comparisons = [
            comparison,
        ];
    }
}

function initBrowserProfile(config: IConfig) {
    let browserProfile = config.browserProfile;
    if (browserProfile.mobile) {
        browserProfile = {
            ...browserProfile,
            ...defaultMobileProfile,
        };
    }

    if (!browserProfile.width || !browserProfile.height) {
        browserProfile = {
            ...defaultDesktopProfile,
            ...browserProfile,
        };
    }

    config.browserProfile = browserProfile;
}

function normalizeMetrics(config: IConfig) {
    config.metrics = config.metrics.map((metric) => {
        if (typeof metric.showInTable === 'undefined') {
            metric.showInTable = true;
        }

        return metric;
    });
}
