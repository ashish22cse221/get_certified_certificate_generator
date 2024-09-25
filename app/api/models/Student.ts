import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  registrationNumber: string;
  internshipCourse: string;
  studyProgram: string;
  researchTopic: string;
  researchDomain: string;
  researchDescription: string;
  courseName: string;
  fromDate: string;
  toDate: string;
  projectTitle: string;
  projectDescription: string;
  projectReport: string | null;
  projectPPT: string | null;
  selectedTemplate: string;
  applicationStatus: string;
  submissionDate: Date;
}

const StudentSchema: Schema = new Schema({
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  internshipCourse: { type: String, default: "" },
  studyProgram: { type: String, default: "" },
  researchTopic: { type: String, default: "" },
  researchDomain: { type: String, default: "" },
  researchDescription: { type: String, default: "" },
  courseName: { type: String, default: "" },
  fromDate: { type: String, default: "" },
  toDate: { type: String, default: "" },
  projectTitle: { type: String, default: "" },
  projectDescription: { type: String, default: "" },
  projectReport: { type: String, default: null },
  projectPPT: { type: String, default: null },
  selectedTemplate: { type: String, required: true },
  applicationStatus: { type: String, required: true },
  submissionDate: { type: Date, required: true }
});

export default mongoose.model<IStudent>('Student', StudentSchema);