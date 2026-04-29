import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  reportId: mongoose.Types.ObjectId;
  name: string;
  title?: string;
  type: 'standard' | 'custom';
  content?: string; // canvas state
  image?: string; // canvas thumbnail/image
  order: number;
}

const sectionSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  name: { type: String, required: true },
  title: { type: String },
  type: { type: String, enum: ['standard', 'custom'], default: 'standard' },
  content: { type: String },
  image: { type: String },
  order: { type: Number, required: true, default: 0 }
});

export default mongoose.model<ISection>('Section', sectionSchema);
