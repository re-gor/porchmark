#!/usr/bin/env node
import 'source-map-support/register';

import program, {Command} from 'commander';

import {createLogger, setLogger} from '@/lib/logger';

// setLogger should be before resolveConfig import
setLogger(createLogger());

import {resolveConfig} from '@/lib/config';
import {DataProcessor} from '@/lib/dataProcessor';

import * as view from '@/lib/view';
import {emergencyShutdown, shutdown} from '@/lib/view';
import startWorking from '@/lib/workerFarm';

program
    .description('realtime compare websites')
    .option('-i, --iterations <n>', 'stop after n iterations; defaults to 300', parseInt)
    .option('-P, --parallel <n>', 'run checks in n workers; defaults to 1', parseInt)
    .option('-m, --mobile', 'chrome mobile UA, iphone 6-like screen, touch events, etc.')
    .option('-k, --insecure', 'ignore HTTPS errors')
    .option('-t, --timeout <n>', 'timeout in seconds for each check; defaults to 20s', parseInt)
    .option('-c  --config [configfile.js]', 'path to config; default is `porchmark.conf.js` in current dir')
    .action(async function(cmd: Command) {
        const config = await resolveConfig(cmd);

        // take only first comparision, TODO iterate over all comparisions
        const comparison = config.comparisons[0];

        const dataProcessor = new DataProcessor(config, comparison);

        const renderTableInterval = setInterval(() => {
            view.renderTable(dataProcessor.calculateResults());
        }, 200);

        await startWorking(comparison, dataProcessor, config).catch(emergencyShutdown);

        clearInterval(renderTableInterval);

        shutdown(false);
    })
    .parse(process.argv);
