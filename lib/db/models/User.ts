import { Schema, model, models, type Document as MongoDocument } from "mongoose";

export interface IUser extends MongoDocument {
  clerkId: string;
  email: string;
  name?: string;
  firmName?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String },
  firmName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model<IUser>("User", UserSchema);
