import mongoose, { Schema, Document } from 'mongoose';

export interface IRow {
  srNo: number;
  headline: string;
  publication: string;
  edition: string;
  pageNo: string;
  date: Date;
  link?: string;
  image?: string;
  isTopCoverage?: boolean;
}

export interface IScreenshot {
  url: string;
  caption?: string;
  order: number;
}

export interface ICoverageTable extends Document {
  reportId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  title?: string;
  category?: string;
  order: number;
  rows: IRow[];
  screenshots: IScreenshot[];
  hiddenColumns?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const rowSchema = new Schema({
  srNo: { type: Number },
  headline: { type: String },
  publication: { type: String },
  edition: { type: String },
  pageNo: { type: String },
  date: { type: Date },
  link: { type: String },
  image: { type: String },
  isTopCoverage: { type: Boolean, default: false }
});

const screenshotSchema = new Schema({
  url: { type: String, required: true },
  caption: { type: String },
  order: { type: Number, default: 0 }
});

const coverageTableSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String },
  category: { type: String },
  order: { type: Number, required: true, default: 0 },
  rows: [rowSchema],
  screenshots: [screenshotSchema],
  hiddenColumns: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<ICoverageTable>('CoverageTable', coverageTableSchema);
