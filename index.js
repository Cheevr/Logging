const _ = require('lodash');
const colors = require('colors');
const config = require('config');
const fs = require('fs');
const path = require('path');
const winston = require('winston');


const cwd = path.dirname(require.main.filename);
const levelColors = {};

colors.enabled = true;
for (let level in config.logging.colors) {
    let color = config.logging.colors[level];
    if (typeof colors[color] == 'function') {
        levelColors[level] = colors[color](' [' + level + ']');
    }
}


class Logger {
    constructor() {
        this.logsDir = path.join(cwd, config.paths.logs);
        fs.existsSync(this.logsDir) || fs.mkdirSync(this.logsDir);

        console.log(config.logging)
        for (let logger in config.logging.loggers) {
            let logConfig = config.logging.loggers[logger];
            if (typeof logConfig == 'string') {
                logConfig = {
                    level: logConfig,
                    transports: ['console', 'file']
                }
            }

            let transports = [];
            for (let type of logConfig.transports) {
                transports.push(this._getTransport(type, logger));
            }

            this[logger] = new winston.Logger({
                level: logConfig.level,
                transports,
                levels: config.levels,
                colors: config.colors
            });
        }
    }

    _getTransport(type, name) {
        let logPrefix = ' [' + name.substr(0,4).toUpperCase() + ']';
        switch(type) {
            case 'console':
                return new winston.transports.Console({
                        colorize: true,
                        timestamp: true,
                        humanReadableUnhandledException: true,
                        formatter: event => new Date().toISOString() + levelColors[event.level] + logPrefix + ' ' + event.message
        });
    case 'file':
        return new winston.transports.File({
            filename: path.join(this.logsDir, name + '.log'),
            json: false,
            maxFiles: 10,
            maxSize: 10 * 1024 * 1024,
            tailable: true,
            zippedArchive: true
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
            req.method,
            _.padEnd(req.id, 10),
            _.padEnd(req.socket.bytesRead, 5),
            _.padEnd(req.socket.bytesWritten, 5),
            _.padEnd(req.metrics.response.time, 3),
            req.originalUrl,
            req.user && req.user.id ? req.user.id : '-',
            req.ip
        );
    });
        next();
    }
}

module.exports = new Logger();
