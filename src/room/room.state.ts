import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import { boolean } from 'joi';
export class Possion extends Schema {
  @type('number') x: number;
  @type('number') y: number;
  @type('string') xy: string; // search cho de
  @type('string') sessionId: string;
}

export class RoomState extends Schema {
  @type('string') currentTurn: string;
  @type('number') ready: number = 0;
  @type({ map: 'boolean' }) clients = new MapSchema<boolean>();
  @type('string') winner: string;
  @type([Possion]) map = new ArraySchema<Possion>();
  @type(Possion) lastPossition: Possion;
}
