import { Model } from '../schema/defineModel';
import { ColumnDefinition } from '../schema/types';

type InferColumnType<Col extends ColumnDefinition<any>> =
  Col['nullable'] extends true
    ? Col['_type'] | null
    : Col['_type'];

type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { optional: true } ? K : never
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

export type InferModelType<T extends Model<any>> =
  // Required properties
  { [K in RequiredKeys<T['columns']>]: InferColumnType<T['columns'][K]> } &
  // Optional properties
  { [K in OptionalKeys<T['columns']>]?: InferColumnType<T['columns'][K]> }; 