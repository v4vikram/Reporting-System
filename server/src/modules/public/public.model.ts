import mongoose, { Schema, Document } from 'mongoose';

export interface IPublicContent extends Document {
  clientId: string;
  title: string;
  body: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PublicContentSchema: Schema = new Schema({
  clientId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

PublicContentSchema.index({ clientId: 1, isActive: 1 });

export default mongoose.model<IPublicContent>('PublicContent', PublicContentSchema);
