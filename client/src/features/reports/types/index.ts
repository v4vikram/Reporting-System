import { BaseEntity, Project, User } from '../../../types';

export interface Report extends BaseEntity {
  projectId?: Project | string;
  clientId: User | string;
  title: string;
  month: string;
  date?: string; // New date field
  time?: string; // New time field
  category?: string; // New category field
  status: 'draft' | 'published';
  assignedTo?: User | string;
  coverPage?: any; // Deprecated, kept for migration
  coverPages?: Array<{
    _id?: string;
    content: string;
    image: string;
  }>;
  sections?: Section[];
  aggregatedCategories?: string[];
}

export interface Section {
  _id: string;
  reportId: string;
  name: string;
  title?: string;
  type: 'standard' | 'custom';
  content?: string;
  image?: string;
  order: number;
  tables?: CoverageTable[];
}

export interface CoverageTable {
  _id: string;
  reportId: string;
  sectionId: string;
  title?: string;
  category?: string; // Add category property
  order: number;
  rows: Row[];
  screenshots: Screenshot[];
  hiddenColumns?: string[];
}

export interface Row {
  _id?: string;
  srNo: number;
  headline: string;
  publication: string;
  edition: string;
  pageNo: string;
  date: string;
  link?: string;
  image?: string;
  isTopCoverage?: boolean;
}

export interface Screenshot {
  _id?: string;
  url: string;
  caption?: string;
  order: number;
}

export interface CoverageItem {
  id?: string;
  _id?: string;
  type: string;
  headline: string;
  createdAt: string;
  link?: string;
  isTopCoverage?: boolean;
}

