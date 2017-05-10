const _ = require('lodash');
const colors = require('colors');
const config = require('@cheevr/config');
const fs = require('fs');
const path = require('path');
const winston = require('winston');


// TODO File logging does not default to rollingFile logging, and instead just creates one giant file

const cwd = process.cwd();
colors.enabled = true;
const transportDefaults = {
    json: false,
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    tailable: true,
    zippedArchive: true,
    colorize: true,
    timestamp: true,
    humanReadableUnhandledException: true
};

/**
 * @typedef {object} Config
 * @property {boolean} enabled                  Whether the logging system should be enabled or not
 * @property {object<string,LogConfig>} loggers Map of logger names with log config
 * @property {object<string,string>} colors     Map with levels as keys and colors as values that will define the console output
 * @property {object<string,number>} levels     Map with level names and integer priorities ranging from 0 (high) to 4 (low)
 */

/**
 * @typedef {object|string} LogConfig   Either the string indicating the log level or a complex logger definition
 * @property {string} level         The logging level for this logger
 * @property {string[]} transports  The transports for this logger (currently supported is either 'console' or 'file'}
 */

/**
 * The logging singleton that holds all loggers in one place.
 */
class Logger {
    constructor() {
        config.addDefaultConfig(path.join(__dirname, 'config'));
        Object.getPrototypeOf(this)._loggers = [];
        Object.getPrototypeOf(this)._levelColors = {};
        this.dir = config.paths.logs || process.env.NODE_LOG_DIR;
        this.configure(config.logging);
        config.on('change', () => this.configure(config.logging));
    }

    /**
     * Resets the configuration (if there was one) to the new given configuration
     * @param {Config} config
     */
    configure(config) {
        for (let logger of this._loggers) {
            delete this[logger];
        }
        Object.getPrototypeOf(this)._loggers = [];
        if (!config.enabled) {
            return;
        }

        // Set up a map with colorized levels for quick lookup during console log
        for (let level in config.colors) {
            let color = config.colors[level];
            if (typeof colors[color] == 'function') {
                this._levelColors[level] = colors[color](' [' + level + ']');
            }
        }

        // Configure transports and log for each log configuration
        for (let name in config.loggers) {
            if (!config.loggers.hasOwnProperty(name)) {
                continue;
            }
            let logConfig = config.loggers[name];
            if (typeof logConfig == 'string') {
                logConfig = {
                    name,
                    level: logConfig,
                    transports: ['console', 'file']
                }
            }

            logConfig = Object.assign({}, transportDefaults, logConfig);

            let transports = [];
            for (let type of logConfig.transports) {
                transports.push(this._getTransport(type, logConfig));
            }

            this._loggers.push(name);
            this[name] = new winston.Logger({
                level: logConfig.level,
                transports,
                levels: config.levels,
                colors: config.colors
            });
        }
    }

    /**
     * Allows to set the logging directory
     * @param {string} dir  Either an absolute or relative to the program directory path.
     */
    set dir(dir) {
        Object.getPrototypeOf(this)._dir = path.isAbsolute(dir) ? dir :  path.join(cwd, dir);
        fs.existsSync(this._dir) || fs.mkdirSync(this._dir);
    }

    _getTransport(type, logConfig) {
        let logPrefix = ' [' + logConfig.name.substr(0,4).toUpperCase() + ']';
        switch(type) {
            case 'console':
                return new winston.transports.Console({
                    colorize: logConfig.colorize,
                    timestamp: logConfig.timestamp,
                    humanReadableUnhandledException: logConfig.humanReadableUnhandledException,
                    formatter: event => new Date().toISOString() + this._levelColors[event.level] + logPrefix + ' ' + event.message
                });
            case 'file':
                return new winston.transports.File({
                    filename: path.join(this._dir, logConfig.name + '.log'),
                    json: logConfig.json,
                    maxFiles: logConfig.maxFiles,
                    maxSize: logConfig.maxSize,
                    tailable: logConfig.tailable,
                    zippedArchive: logConfig.zippedArchive
                });
            default:
                throw new Error('Unknown transport configured: ' + type);
            }
    }

    /**
     * @param {ClientRequest} req
     * @param {ServerResponse} res
     * @param {function} next
     */
    middleware(req, res, next) {
        res.on('finish', () => {
            module.exports.requests.info(
                '%s %s id:%s in:%s out:%s time:%s %s (%s/%s)',
                res.statusCode,
                _.padEnd(req.method, 4),
                _.padEnd(req.id, 10),
                _.padEnd(req.socket.bytesRead, 5),
                _.padEnd(req.socket.bytesWritten, 5),
                _.padEnd(req.metrics ? req.metrics.response.time : 'n/a', 3),
                req.originalUrl,
                req.user && req.user.id ? req.user.id : '-',
                req.ip
            );
        });
        next();
    }

    /**
     * Allows to enable or disable the logger temporarily. Note that when disabling the logger that it is not possible
     * to change the logging configuration. This means that this function should usually only be called once
     * configuration has been completed
     * @param {boolean} [enabled=true] Set the flag whether logging is enabled or not
     */
    enabled(enabled = true) {
        if (enabled) {
            if (this._backup) {
                for (let prop in this._backup) {
                    this[prop] = this._backup[prop];
                }
                delete Object.getPrototypeOf(this)._backup;
            }
        } else {
            if (!this._backup) {
                Object.getPrototypeOf(this)._backup = {};
                for (let prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        let sink = {};
                        for (let level in this[prop].levels) {
                            sink[level] = () => {
                            };
                        }
                        Object.getPrototypeOf(this)._backup[prop] = this[prop];
                        this[prop] = sink;
                    }
                }
            }
        }
    }
}

module.exports = new Logger();
