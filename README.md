# Cheevr-Logging
[![npm version](https://badge.fury.io/js/%40cheevr%2Flogging.svg)](https://badge.fury.io/js/%40cheevr%2Flogging)
[![Build Status](https://travis-ci.org/Cheevr/Logging.svg?branch=master)](https://travis-ci.org/Cheevr/Logging)
[![Coverage Status](https://coveralls.io/repos/Cheevr/Logging/badge.svg?branch=master&service=github)](https://coveralls.io/github/Cheevr/Logging?branch=master)
[![Dependency Status](https://david-dm.org/Cheevr/Logging.svg)](https://david-dm.org/Cheevr/Logging)

# About

The logging library is designed to make logging in projects easy by automatically instantiating logs
based on a simple configuration file. Your can specify log transports, directories and names all in
one central location and let the module take care of the rest.

Internally the module is using winston for logging purposes with a rolling file appender that will
create daily log files by default. Note though the logging library may change in the future, but
shouldn't have an impact on the API.

# Installation

```Bash
npm i @cheevr/logging
```

# Basic Example

You want to start by writing a configuration file. This module uses [@cheevr/config](https://github.com/cheevr/config)
for its configuration. For more details on how to customize your configuration check out that project.
Create a file in **config/default.js** and write this content to it:

```JSON
{
    "logging": {
        "loggers": {
            "example": "info"
        }
    }
}
```

You have no configured one logger with a log level of "info". To access the logger is pretty simlpe:

```JavaScript
const Logger = require('@cheevr/logging');

Logger.example.info('This is my first log message');
```

And you're ready to go.

The logging system uses [Winston](https://github.com/winstonjs/winston) to handle logs and you can
configure most settings that are accessible to the standard package. For more details check out the
[Configuration](#Configuration) section of this document.


# Express Example

If you're using express and want to log incoming requests there's a helper method that will do that
for you with useful defaults in terms of what to log.

Setting it up is just as easy as using the logger directly:

```JavaScript
const express = require('express');
const Logger = require('@cheevr/logger');

const app = express();
app.use(logger.middleware);
```

All incoming request should now be logged to **logs/requests.log** (relative to the project
directory). This works because the library defined a request logger out of the box, that you
can customize if you want, by simply configuring your own **request** logger instance.

Should you want to change the loggers name, you will have to use your own middleware function
(which shouldn't be hard to do)


# API

The majority of interaction you will have with this module is through the configuration file.
There are a few methods and properties that you can access on the logger directly. Note that
if you define a logger with the same name as one of these fields you will effectively overwrite
them. That means you will no longer be able to access them (and potentialy break functionality)
so be careful when doing so.


## Logger.enabled({boolean = true})

Allows to enable/disable all logging.

## Logger.configure({object} config)

This method allows to set the configuration at runtime. The configuration object follows the same
structure as the standard configuration, except that it shouldn't be nested, so a valid configuration
would something like this:

```JSON
{
    "enabled": true,
    "loggers": {
        "server": "info"
    }
}
```

For more info check out the [Configuration](#Configuration) section.

## Logger.dir {string}

Sets the directory in which to store log files. If the directory does not exist it will be created
when the first log message is written (assuming you've configured loggers to use file transports).
The path can be both absolute or relative. If the a relative path is given it will be resolved
relative to the project root (Can be overwritten by specifying the ```NODE_CWD``` environment variable).

## Logger.middleware({ClientRequest} req, {ServerResponse} res, {function} next)

A helper method for express that will log any incoming parameters that would be interesting for
request logging. A **request** logger is predefined that is used as the log location. You can
customize this logger using the [Configuration](#Configuration).


# Configuration

Most of your interaction with this module will be via the configuration file which uses
[@cheevr/config](https://github.com/cheevr/config) as its configuration system. There are many
ways how you can specify your configuration and even separate it for individual environments or tiers.
By default you want to create a file named **config/default.json** relative to your project root
(You can modify the config location. For more information check out the docs for **@cheevr/config**).
Within the file all configuration should be nested under a property called ```loggers```. If you're
unsure how it should look take a look at the simple example.

## enabled {boolean}

Same as the runtime option this allows to just disable the entire logging system.

## loggers {Map<string, string>|Map<string, object>}

There are 2 ways you can configure your loggers - simply using a string to specify the log level
or by using an object that specifies the logger details:

### Simple Configuration

When specifying loggers you map the logger name to a log level. All loggers specified like this will
log to both console and rollingFile appender and use all the optional defaults from the complex
configuration. This is a convenience shortcut method of specifying loggers. Not that the log levels
need to correspond to the configured available log levels (see the **levels** configuration section)

```JavaScript
{
    "loggers": {
        "traceLogger": "trace",
        "debugLogger": "debug",
        "infoLogger": "info",
        "warnLogger": "warn",
        "errorLogger": "error"
    }
}
```

### Detailed Configuration

If you need to specify more details for your configuration you can pass in a configuration file. The
passed in configuration will be populated with default values if don't specify them that look like
this:

```JavaScript
{
    "json": false,
    "maxFiles": 10,
    "maxSize": 10 * 1024 * 1024,
    "tailable": true,
    "zippedArchive": true,
    "colorize": true,
    "timestamp": true,
    "humanReadableUnhandledException": true
}
```

For more details on the configuration options check out the documentation for
[Winston](https://github.com/winstonjs/winston/blob/master/docs/transports.md#console-transport)
and the [rollingFileAppender](https://github.com/mallocator/Winston-Rolling-File-Appender).

If for example you would want to customize the number of files to be kept for a logger you could
configure it like this:

```JSON
{
    "loggers": {
        "myCustomLogger": {
            "level": "info",
            "transports": [ "console", "rollingFile" ],
            "maxFiles": 5
        }
    }
}
```

Note that you need to specify at least a level and the transports you want to use. Currently the
logging system supports 3 loggers out of the box:

* ```console```: The standard Winston console logger
* ```file```: The standard Winston file logger
* ```rollingFile```: A daily rolling file logger based on Winstons file logger


## levels {Map<string, number>}

Winston allows you to specify custom log level names and order. The configuration is pretty straight
forward and the default is set up like this:

```JSON
{
    "levels": {
        "trace": 4,
        "verbose": 4,
        "debug": 3,
        "info": 2,
        "warn": 1,
        "warning": 1,
        "err": 0,
        "error": 0
    }
}
```

If you're unfamiliar with Winston: each level you specify maps to a method you can call on a logger.
The value assigned to each level specifies the priority when filtering.

## colors {Map<string, string>}

Winston supports printing log messages to console using colors. Similar to logging levels you can
customize which log level gets which color assigned:

```JSON
{
    "colors": {
        "trace": "gray",
        "verbose": "gray",
        "debug": "blue",
        "info": "green",
        "warn": "yellow",
        "warning": "yellow",
        "err": "red",
        "error": "red"
    }
}
```

If you do specify your own colors make sure that you map them to the log levels you specified (or
the default values seen here if you haven't).

## paths.logs {string}

Your logs have to be stored somewhere. This tells the system where. Both absolute and relative paths
work. Relative paths will be resolved relative to the project root directory (which can be overridden
by specifying the environment variable ```NODE_CWD```)


# Future Features for Consideration

* Allow to use different logger implementations
* Allow to add more appenders
