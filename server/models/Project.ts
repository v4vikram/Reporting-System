import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  clientId: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  clientId: { type: String, required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed'], 
    default: 'pending',
    index: true
  },
}, { timestamps: true });

// Index for search and sorting
ProjectSchema.index({ clientId: 1, createdAt: -1 });
ProjectSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IProject>('Project', ProjectSchema);
