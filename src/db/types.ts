import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Attempts = {
    attempt: Generated<number>;
    helixId: string;
    difference: number;
    timestamp: number;
    value: number;
};
export type DB = {
    Attempts: Attempts;
};
