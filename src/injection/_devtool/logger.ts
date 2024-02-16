import { DevtoolChannel } from './Channel';
import { LOGGER_CHANNEL_NAME } from 'Extension/const';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { AbstractLogger } from 'Extension/Logger/Abstract';

export enum LogType {
    log = 'log',
    warn = 'warn',
    error = 'error'
}

class ChannelLogger extends AbstractLogger {
    constructor(private _channel: DevtoolChannel, protected _name: string = '') {
        super();
    }
    log(message: string): void {
        this.__dispatch(LogType.log, message);
    }
    warn(message: string): void {
        this.__dispatch(LogType.warn, message);
    }
    error(error: Error): void {
        this.__dispatch(LogType.error, {
            ...error
        });
    }
    protected _create(name: string): ChannelLogger {
        return new ChannelLogger(this._channel, name);
    }
    private __dispatch(type: LogType, data: unknown): void {
        this._channel.dispatch(type, {
           name: this._name,
           data
        });
    }
}

export const logger: INamedLogger = new ChannelLogger(new DevtoolChannel(LOGGER_CHANNEL_NAME));
