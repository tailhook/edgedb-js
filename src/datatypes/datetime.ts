/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2019-present MagicStack Inc. and the EdgeDB authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as util from "util";

import {daysInMonth, ymd2ord, ord2ymd} from "./dateutil";

export const DATE_PRIVATE = Symbol.for("edgedb.datetime");

export class LocalDateTime {
  private readonly _date: Date;

  constructor(
    year: number,
    month: number = 0,
    day: number = 0,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
    millisecond: number = 0
  ) {
    if (
      (month as unknown) === DATE_PRIVATE &&
      (year as unknown) instanceof Date
    ) {
      this._date = (year as unknown) as Date;
    } else {
      this._date = new Date(
        Date.UTC(year, month, day, hour, minute, second, millisecond)
      );
    }
  }

  getTime(): number {
    return this._date.getTime();
  }

  getDate(): number {
    return this._date.getUTCDate();
  }

  getDay(): number {
    return this._date.getUTCDay();
  }

  getFullYear(): number {
    return this._date.getUTCFullYear();
  }

  getHours(): number {
    return this._date.getUTCHours();
  }

  getMilliseconds(): number {
    return this._date.getUTCMilliseconds();
  }

  getMinutes(): number {
    return this._date.getUTCMinutes();
  }

  getMonth(): number {
    return this._date.getUTCMonth();
  }

  getSeconds(): number {
    return this._date.getUTCSeconds();
  }

  toDateString(): string {
    return this.toString(); // cut off " GMT"
  }

  toISOString(): string {
    const result = this._date.toISOString();
    if (result[result.length - 1] !== "Z") {
      throw new Error(`unexpected ISO format: ${result}`);
    }
    return result.slice(0, -1); // cut off "Z"
  }

  toJSON(): string {
    return this.toISOString();
  }

  valueOf(): any {
    return this._date.valueOf();
  }

  toString(): string {
    const result = this._date.toUTCString();
    if (result.slice(-4) !== " GMT") {
      throw new Error(`unexpected UTC format: ${result}`);
    }
    return result.slice(0, -4); // cut off " GMT"
  }

  toDateTime(): Date {
    return new Date(
      this.getFullYear(),
      this.getMonth(),
      this.getDate(),
      this.getHours(),
      this.getMinutes(),
      this.getSeconds(),
      this.getMilliseconds()
    );
  }

  [util.inspect.custom](
    _depth: number,
    _options: util.InspectOptions
  ): string {
    return `LocalDateTime [ ${this.toISOString()} ]`;
  }
}

export class LocalTime {
  private readonly _hours: number;
  private readonly _minutes: number;
  private readonly _seconds: number;
  private readonly _milliseconds: number;

  constructor(
    hours: number,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0
  ) {
    if (hours < 0 || hours > 23) {
      throw new Error(
        `invalid number of hours ${hours}: expected a value in 0-23 range`
      );
    }
    if (minutes < 0 || minutes > 59) {
      throw new Error(
        `invalid number of minutes ${minutes}: expected a value in 0-59 range`
      );
    }
    if (seconds < 0 || seconds > 59) {
      throw new Error(
        `invalid number of seconds ${seconds}: expected a value in 0-59 range`
      );
    }
    if (milliseconds < 0 || milliseconds > 999) {
      throw new Error(
        `invalid number of milliseconds ${milliseconds}: ` +
          `expected a value in 0-999 range`
      );
    }
    this._hours = hours;
    this._minutes = minutes;
    this._seconds = seconds;
    this._milliseconds = milliseconds;
  }

  getHours(): number {
    return this._hours;
  }

  getSeconds(): number {
    return this._seconds;
  }

  getMilliseconds(): number {
    return this._milliseconds;
  }

  getMinutes(): number {
    return this._minutes;
  }

  valueOf(): string {
    return this.toString();
  }

  toString(): string {
    const hh = this._hours.toString().padStart(2, "0");
    const mm = this._minutes.toString().padStart(2, "0");
    const ss = this._seconds.toString().padStart(2, "0");
    let repr = `${hh}:${mm}:${ss}`;
    if (this._milliseconds) {
      repr += `.${this._milliseconds}`.replace(/(?:0+)$/, "");
    }
    return repr;
  }

  [util.inspect.custom](
    _depth: number,
    _options: util.InspectOptions
  ): string {
    return `LocalTime [ ${this.toString()} ]`;
  }
}

export class LocalDate {
  private readonly _year: number;
  private readonly _month: number;
  private readonly _day: number;

  constructor(year: number, monthIndex: number = 0, day: number = 1) {
    if (monthIndex < 0 || monthIndex >= 12) {
      throw new Error(
        `invalid monthIndex ${monthIndex}: expected a value in 0-11 range`
      );
    }

    const maxDays = daysInMonth(year, monthIndex + 1);
    if (monthIndex < 0 || monthIndex >= 12 || day < 1 || day > maxDays) {
      throw new Error(
        `invalid number of days ${day}: ` +
          `expected a value in 1..${maxDays} range`
      );
    }

    this._year = year;
    this._month = monthIndex;
    this._day = day;
  }

  getFullYear(): number {
    return this._year;
  }

  getMonth(): number {
    return this._month;
  }

  getDate(): number {
    return this._day;
  }

  valueOf(): string {
    return this.toString();
  }

  toString(): string {
    const mm = (this._month + 1).toString().padStart(2, "0");
    const dd = this._day.toString().padStart(2, "0");
    return `${this._year}-${mm}-${dd}`;
  }

  [util.inspect.custom](
    _depth: number,
    _options: util.InspectOptions
  ): string {
    return `LocalDate [ ${this.toString()} ]`;
  }

  toOrdinal(): number {
    return ymd2ord(this._year, this._month + 1, this._day);
  }

  static fromOrdinal(ord: number): LocalDate {
    const [year, month, day] = ord2ymd(ord);
    return new this(year, month - 1, day);
  }
}

export class Duration {
  private readonly _months: number;
  private readonly _days: number;
  private readonly _milliseconds: number;

  constructor(months: number = 0, days: number = 0, milliseconds: number = 0) {
    this._months = months;
    this._days = days;
    this._milliseconds = milliseconds;
  }

  getMonths(): number {
    return this._months;
  }

  getDays(): number {
    return this._days;
  }

  getMilliseconds(): number {
    return this._milliseconds;
  }

  toString(): string {
    const buf = [];

    const year = Math.trunc(this._months / 12);
    const mon = Math.trunc(this._months % 12);
    let time = this._milliseconds;

    let tfrac = Math.trunc(time / 3600_000);
    time -= tfrac * 3600_000;
    const hour = tfrac;

    if (hour < 0 !== tfrac < 0) {
      throw new Error("interval out of range");
    }

    tfrac = Math.trunc(time / 60000);
    time -= tfrac * 60000;
    const min = tfrac;
    const sec = Math.trunc(time / 1000);
    let fsec = time - sec * 1000;

    let isFirst = true;
    let isBefore = false;

    if (year) {
      buf.push(
        `${isFirst ? "" : " "}` +
          `${isBefore && year > 0 ? "+" : ""}` +
          `${year} year${year === 1 ? "" : "s"}`
      );

      isFirst = false;
      isBefore = year < 0;
    }

    if (mon) {
      buf.push(
        `${isFirst ? "" : " "}${isBefore && mon > 0 ? "+" : ""}` +
          `${mon} month${mon === 1 ? "" : "s"}`
      );

      isFirst = false;
      isBefore = mon < 0;
    }

    if (this._days) {
      buf.push(
        `${isFirst ? "" : " "}${isBefore && this._days > 0 ? "+" : ""}` +
          `${this._days} day${this._days === 1 ? "" : "s"}`
      );

      isFirst = false;
      isBefore = this._days < 0;
    }

    if (isFirst || hour !== 0 || min !== 0 || sec !== 0 || fsec !== 0) {
      const neg = hour < 0 || min < 0 || sec < 0 || fsec < 0;
      buf.push(
        `${isFirst ? "" : " "}${neg ? "-" : isBefore ? "+" : ""}` +
          `${Math.abs(hour)
            .toString()
            .padStart(2, "0")}:` +
          `${Math.abs(min)
            .toString()
            .padStart(2, "0")}:` +
          `${Math.abs(sec)
            .toString()
            .padStart(2, "0")}`
      );

      fsec = Math.abs(fsec);
      if (fsec) {
        fsec = Math.round((fsec *= 1000));
        buf.push(`.${fsec.toString().padStart(6, "0")}`.replace(/(0+)$/, ""));
      }
    }

    return buf.join("");
  }

  [util.inspect.custom](
    _depth: number,
    _options: util.InspectOptions
  ): string {
    return `Duration [ ${this.toString()} ]`;
  }
}
