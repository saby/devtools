import { DevtoolChannel } from "./_devtool/Channel";
import { LOGGER_CHANNEL_NAME } from "Extension/const";

interface ILogger {
    log(message: string): void;
    warn(message: string): void;
    error(error: Error): void;
}

interface INamedLogger extends ILogger {
    create(name: string): INamedLogger;
}

enum LogType {
    log = 'log',
    warn = 'warn',
    error = 'error'
}

class ChannelLogger implements INamedLogger {
    constructor(private _channel: DevtoolChannel, private _name: string = '') {
    
    }
    log(message: string) {
        this.__dispatch(LogType.log, message);
    }
    warn(message: string) {
        this.__dispatch(LogType.warn, message);
    }
    error(error: Error) {
        this.__dispatch(LogType.error, {
            ...error
        });
    }
    create(name: string): INamedLogger {
        let newName = this._name? `${ this._name }/${ name }`: name;
        return new ChannelLogger(this._channel, newName);
    }
    private __dispatch(type: LogType, data: any) {
        this._channel.dispatch(type, {
           name: this._name,
           data
        });
    }
}

const logger: INamedLogger = new ChannelLogger(new DevtoolChannel(LOGGER_CHANNEL_NAME));
