import { Document, Types } from 'mongoose';

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export type IBaseLocation<TParentRefs = {}> = Document & {
  name: string;
  isActive?: boolean;
  loc: IGeoLocation;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
} & TParentRefs;

export type ICountry = IBaseLocation;

export type IState = IBaseLocation<{
  country: Types.ObjectId;
}>;

export type ICity = IBaseLocation<{
  country: Types.ObjectId;
  state: Types.ObjectId;
}>;

export type IArea = IBaseLocation<{
  country: Types.ObjectId;
  state: Types.ObjectId;
  city: Types.ObjectId;
}>;
