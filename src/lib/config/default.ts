import {IConfig, SelectWprMethods} from '@/lib/config/types';

export default (): IConfig => ({
    logLevel: 'info',
    workDir: '',
    mode: 'puppeteer',
    iterations: 70,
    workers: 1,
    pageTimeout: 20, // in seconds
    silent: false,
    puppeteerOptions: {
        headless: true,
        ignoreHTTPSErrors: false,
        useWpr: true,
        recordWprCount: 50,
        selectWprCount: 10,
        selectWprMethod: SelectWprMethods.closestByHtmlSize,
        cacheEnabled: true,
        imagesEnabled: true,
        javascriptEnabled: true,
        cssFilesEnabled: true,
        cpuThrottling: null,
        networkThrottling: null,
        pageNavigationTimeout: 60000,
    },
    webdriverOptions: {
        host: 'localhost',
        port: 4444,
        user : '',
        key: '',
        desiredCapabilities: {
            browserName: 'chrome',
            version: '65.0',
        },
    },
    browserProfile: {
        mobile: false,
        userAgent: null,
        height: 0,
        width: 0,
    },
    comparisons: [],
    stages: {
        recordWpr: true,
        compareMetrics: true,
        compareLighthouse: false,
    },
    metrics: [
        {name: 'requestStart', showInTable: true},
        {name: 'responseStart', title: 'TTFB', showInTable: true},
        {name: 'responseEnd', title: 'TTLB', showInTable: true},
        {name: 'first-paint', showInTable: false},
        {name: 'first-contentful-paint', title: 'FCP', showInTable: true},
        {name: 'domContentLoadedEventEnd', title: 'DCL', showInTable: true},
        {name: 'loadEventEnd', title: 'loaded', showInTable: true},
        {name: 'domInteractive', showInTable: false},
        {name: 'domComplete', showInTable: false},
        {name: 'transferSize', showInTable: false},
        {name: 'encodedBodySize', showInTable: false},
        {name: 'decodedBodySize', showInTable: false},
    ],
    metricAggregations: [
        {name: 'count', includeMetrics: ['requestStart']},
        {name: 'q50'},
        {name: 'q80'},
        {name: 'q95'},
    ],
    hooks: {},
});