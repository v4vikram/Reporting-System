import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomPage {
  _id: mongoose.Types.ObjectId;
  content: string; // JSON serialized canvas state
  image: string; // Data URL of the rendered image
  order: number;
}

export interface IReport extends Document {
  projectId?: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  title: string;
  month: string;
  date?: string;
  time?: string;
  category?: string;
  status: 'draft' | 'published';
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  coverPages?: Array<{
    content: string;
    image: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  month: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  category: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  coverPages: [{
    content: { type: String },
    image: { type: String }
  }]
}, { timestamps: true });

reportSchema.index({ clientId: 1 });
reportSchema.index({ projectId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdBy: 1 });

export default mongoose.model<IReport>('Report', reportSchema);
