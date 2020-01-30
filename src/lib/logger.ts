import {isInteractive} from '@/lib/helpers';
import * as fs from 'fs';
import * as tracer from 'tracer';

import {getViewConsole} from '@/lib/view';

const viewConsole = getViewConsole();

export type Logger = tracer.Tracer.Logger;

let loggerInstance: Logger;

export let logfilePath: string | null = null;

let logfileDescriptor: number | null = null;

process.on('beforeExit', function exitHandler(): void {
    if (logfileDescriptor) {
        loggerInstance.info('exitHandler call');
        fs.closeSync(logfileDescriptor);
    }
});

export const createLogger = (level: string = 'trace') => {
    const loggerCreator = isInteractive() ? tracer.colorConsole : tracer.console;

    return loggerCreator({
        level,
        format: [
            '{{timestamp}} <{{title}}> {{message}}',
            {
                error: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}',
            },
        ],
        dateformat: 'HH:MM:ss.L',
        transport(data) {
            viewConsole.info(data.output);

            if (logfilePath) {

                if (!logfileDescriptor) {
                    logfileDescriptor = fs.openSync(logfilePath, 'a');
                }

                fs.write(logfileDescriptor, data.rawoutput + '\n', (err) => {
                    if (err) { throw err; }
                });
            }

        },
    });
};

export function setLogfilePath(filepath: string) {
    logfilePath = filepath;
}

export function setLogger(logger: Logger) {
    loggerInstance = logger;
}

export function getLogger() {
    if (!loggerInstance) {
        throw new Error('no global logger');
    }
    return loggerInstance;
}

export function setLevel(level: string) {
    tracer.setLevel(level);
}