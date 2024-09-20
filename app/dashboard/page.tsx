'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { pdfjs } from 'react-pdf';
import { PDFDownloadLink, Document as PDFDocument, Page as PDFPage, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { TbCertificate } from "react-icons/tb";
import { FaUserCircle, FaEye, FaUser } from "react-icons/fa";
import { TiAttachmentOutline } from "react-icons/ti";
import { LuLayoutTemplate } from "react-icons/lu";
import { IoMdDownload } from "react-icons/io";
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });
const readExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        let workbook;
        try {
          workbook = XLSX.read(data, { type: 'array' });
        } catch (error) {
          workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), "Applications");
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
const writeExcelFile = (data, fileName) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applications");
  XLSX.writeFile(wb, fileName);
};
const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    padding: 10,
    borderBottom: '2 solid #3B82F6',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  content: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  text: {
    marginBottom: 10,
    fontSize: 14,
    fontFamily: 'Helvetica',
    color: '#1F2937',
    textAlign: 'justify',
    lineHeight: 1.5,
  },
  highlight: {
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
  },
  footer: {
    marginTop: 20,
    padding: 10,
    borderTop: '2 solid #3B82F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 50,
  },
  signature: {
    width: 150,
    height: 50,
  },
});

interface FormData {
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
  projectReport: File | null;
  projectPPT: File | null;
  selectedTemplate: 'internship' | 'study' | 'research' | 'course';
}
interface CertificateProps {
  data: FormData;
  studyInstructions: string;
}
const Certificate: React.FC<CertificateProps> = ({ data, studyInstructions }) => (
  <PDFDocument>
    <PDFPage size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.selectedTemplate.toUpperCase()} CERTIFICATE</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>
          This is to certify that <Text style={styles.highlight}>{data.studentName}</Text> (Roll No: <Text style={styles.highlight}>{data.rollNumber}</Text>, Reg No: <Text style={styles.highlight}>{data.registrationNumber}</Text>) 
          has successfully completed the <Text style={styles.highlight}>{data.internshipCourse || data.studyProgram || data.researchTopic || data.courseName}</Text>
          {data.fromDate && data.toDate ? ` from ${data.fromDate} to ${data.toDate}` : ''}.
        </Text>
        {data.selectedTemplate === 'study' && (
          <Text style={styles.text}>
            Note: {studyInstructions}
          </Text>
        )}
        <Text style={styles.text}>
          We commend the dedication and hard work demonstrated throughout this {data.selectedTemplate}. This achievement reflects a significant step in the academic and professional development of the certificate holder.
        </Text>
      </View>
      <View style={styles.footer}>
        <Image
          style={styles.logo}
          src="https://example.com/path-to-your-logo.png"
        />
        <Image
          style={styles.signature}
          src="https://example.com/path-to-signature.png"
        />
      </View>
    </PDFPage>
  </PDFDocument>
);
export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    studentName: '',
    rollNumber: '',
    registrationNumber: '',
    internshipCourse: '',
    studyProgram: '',
    researchTopic: '',
    researchDomain: '',
    researchDescription: '',
    courseName: '',
    fromDate: '',
    toDate: '',
    projectTitle: '',
    projectDescription: '',
    projectReport: null,
    projectPPT: null,
    selectedTemplate: 'internship'
  });
  const [studyInstructions, setStudyInstructions] = useState(
    "This certificate is awarded for successful completion of a study program. It verifies the student's participation and achievement in the specified course of study."
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);;

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    if (isFormValid()) {
      const generatePreview = async () => {
        const blob = await pdf(<Certificate data={formData} studyInstructions={studyInstructions} />).toBlob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      };
      generatePreview();
    }
  }, [formData, studyInstructions]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files) {
      setFormData(prevData => ({
        ...prevData,
        [name]: files[0]
      }));
    }
  };
  const handleTemplateChange = (template: FormData['selectedTemplate']) => {
    setFormData(prevData => ({
      ...prevData,
      selectedTemplate: template
    }));
  };
  const isFormValid = (): boolean => {
    const commonValidation = formData.studentName && formData.rollNumber && formData.registrationNumber;
    
    switch (formData.selectedTemplate) {
      case 'internship':
        return Boolean(commonValidation && formData.fromDate && formData.toDate && formData.internshipCourse);
      case 'study':
        return Boolean(commonValidation && formData.studyProgram);
      case 'research':
        return Boolean(commonValidation && formData.researchTopic);
      case 'course':
        return Boolean(commonValidation && formData.courseName);
      default:
        return false;
    }
  };
  const handleSubmit = async () => {
    if (isFormValid()) {
      setIsSubmitting(true);
      try {
        const newApplication = {
          ...formData,
          applicationStatus: 'pending',
          submissionDate: new Date().toISOString()
        };
  
        const response = await fetch('/api/submit-application', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newApplication),
        });
  
        if (response.ok) {
          alert("Application submitted successfully!");
        } else {
          throw new Error('Failed to submit application');
        }
      } catch (error) {
        console.error('Error submitting application:', error);
        alert("Failed to submit application. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert("Please fill in all required fields before submitting.");
    }
  };
  const renderUserInfoInputs = () => {
    const commonInputs = (
      <>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="studentName" className="flex items-center">
             Student Name
          </Label>
          <div className="relative">
            <Input
              type="text"
              id="studentName"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              placeholder="Enter student name"
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="rollNumber" className="flex items-center">
             Roll Number
          </Label>
          <div className="relative">
            <Input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleInputChange}
              placeholder="Enter roll number"
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="registrationNumber" className="flex items-center">
             Registration Number
          </Label>
          <div className="relative">
            <Input
              type="text"
              id="registrationNumber"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleInputChange}
              placeholder="Enter registration number"
              className="pl-10"
            />
          </div>
        </div>
      </>
    );
    const dateInputs = (
      <>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            type="date"
            id="fromDate"
            name="fromDate"
            value={formData.fromDate}
            onChange={handleInputChange}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="toDate">To Date</Label>
          <Input
            type="date"
            id="toDate"
            name="toDate"
            value={formData.toDate}
            onChange={handleInputChange}
          />
        </div>
      </>
    );
    switch (formData.selectedTemplate) {
      case 'internship':
        return (
          <>
            {commonInputs}
            {dateInputs}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="internshipCourse">Internship Course</Label>
              <Input
                type="text"
                id="internshipCourse"
                name="internshipCourse"
                value={formData.internshipCourse}
                onChange={handleInputChange}
                placeholder="Enter internship course"
              />
            </div>
          </>
        );
      case 'study':
        return (
          <>
            {commonInputs}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="studyProgram">Study Program</Label>
              <Input
                type="text"
                id="studyProgram"
                name="studyProgram"
                value={formData.studyProgram}
                onChange={handleInputChange}
                placeholder="Enter study program"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Instructions</h3>
              <p className="text-muted-foreground">{studyInstructions}</p>
            </div>
          </>
        );
      case 'research':
        return (
          <>
            {commonInputs}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="researchTopic">Research Topic</Label>
              <Input
                type="text"
                id="researchTopic"
                name="researchTopic"
                value={formData.researchTopic}
                onChange={handleInputChange}
                placeholder="Enter research topic"
              />
            </div>
          </>
        );
      case 'course':
        return (
          <>
            {commonInputs}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                type="text"
                id="courseName"
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                placeholder="Enter course name"
              />
            </div>
          </>
        );
      default:
        return commonInputs;
    }
  };
  const renderProjectOrResearchSection = () => {
    if (formData.selectedTemplate === 'study') {
      return null;
    }

    if (formData.selectedTemplate === 'research') {
      return (
        <>
          <h2 className="text-xl font-semibold mb-4">Research Documentation</h2>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="researchTopic">Research Topic</Label>
            <Input
              type="text"
              id="researchTopic"
              name="researchTopic"
              value={formData.researchTopic}
              onChange={handleInputChange}
              placeholder="Enter research topic"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="researchDomain">Research Domain</Label>
            <Input
              type="text"
              id="researchDomain"
              name="researchDomain"
              value={formData.researchDomain}
              onChange={handleInputChange}
              placeholder="Enter research domain"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="researchDescription">Research Description</Label>
            <Textarea
              id="researchDescription"
              name="researchDescription"
              value={formData.researchDescription}
              onChange={handleInputChange}
              placeholder="Enter research description"
            />
          </div>
        </>
      );
    }
    return (
      <>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
           Project Documents
        </h2>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="projectTitle">Project Title</Label>
          <Input
            type="text"
            id="projectTitle"
            name="projectTitle"
            value={formData.projectTitle}
            onChange={handleInputChange}
            placeholder="Enter project title"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="projectDescription">Project Description</Label>
          <Textarea
            id="projectDescription"
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleInputChange}
            placeholder="Enter project description"
          />
        </div>
        <div className="grid w-full max-sm items-center gap-1.5">
          <Label htmlFor="projectReport">Project Report</Label>
          <Input
            type="file"
            id="projectReport"
            name="projectReport"
            onChange={handleFileChange}
            accept=".pdf"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="projectPPT">Project PPT</Label>
          <Input
            type="file"
            id="projectPPT"
            name="projectPPT"
            onChange={handleFileChange}
            accept=".pdf"
          />
        </div>
      </>
    );
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div 
        className="relative bg-cover bg-center text-white py-16 mb-8"
        style={{ backgroundImage: "url('/header-bg.jpeg')" }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4">Get Your Certificate</h1>
          <p className="text-xl mb-8">Generate professional certificates for internships, studies, research, and courses.</p>
          <Button className="bg-white text-blue-600 hover:bg-blue-100">Get Started</Button>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8">
        <nav className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center">
            GET-CERTIFIED <TbCertificate className="ml-2" />
          </h1>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* User Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card text-card-foreground overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
                <CardTitle className="flex items-center text-primary text-black">
                  <FaUserCircle className="mr-2 text-2xl text-black" /> User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                {renderUserInfoInputs()}
              </CardContent>
            </Card>
          </motion.div>
          {/* Project Documents Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-card text-card-foreground overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-100 to-blue-100">
                <CardTitle className="flex items-center text-primary text-black">
                  <TiAttachmentOutline className="mr-2 text-2xl text-black" /> Project Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                {renderProjectOrResearchSection()}
              </CardContent>
            </Card>
          </motion.div>
          {/* Certificate Template Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card text-card-foreground overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="flex items-center text-primary text-black">
                  <LuLayoutTemplate className="mr-2 text-2xl text-black" /> Certificate Template
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <Tabs defaultValue="internship" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    {(['internship', 'study', 'research', 'course'] as const).map(template => (
                      <TabsTrigger 
                        key={template} 
                        value={template}
                        onClick={() => handleTemplateChange(template)}
                      >
                        {template.charAt(0).toUpperCase() + template.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {(['internship', 'study', 'research', 'course'] as const).map(template => (
                    <TabsContent key={template} value={template}>
                      <p className="text-sm text-muted-foreground mt-2">
                        {template === 'internship' && "Generate a certificate for completed internships."}
                        {template === 'study' && "Create a certificate for study programs."}
                        {template === 'research' && "Issue a certificate for research projects."}
                        {template === 'course' && "Produce a certificate for completed courses."}
                      </p>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
          {/* Preview Card */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaEye className="mr-2" /> Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewUrl ? (
                  <div className="border border-border rounded p-4 bg-white shadow-lg">
                    <iframe src={previewUrl} width="100%" height="500px" className="border-none" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                    <p className="text-gray-500">Certificate preview will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
           {/* Submit Application Card */}
           {isFormValid() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Submit Application
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleSubmit}>
                    SUBMIT
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}