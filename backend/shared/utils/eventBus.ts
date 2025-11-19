import { EventEmitter } from 'events';

export type EventPayload = Record<string, unknown>;

export class DomainEventBus {
  private readonly emitter = new EventEmitter();

  emit<T extends EventPayload>(event: string, payload: T): void {
    this.emitter.emit(event, payload);
  }

  on<T extends EventPayload>(event: string, handler: (payload: T) => void): void {
    this.emitter.on(event, handler);
  }
}
