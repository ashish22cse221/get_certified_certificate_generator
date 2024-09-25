"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Header component with background image
function Header() {
  return (
    <header className="relative h-64 mb-8">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/path/to/your/image.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-black opacity-50 z-10" />
      <div className="relative z-20 h-full flex items-center justify-center">
        <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
      </div>
    </header>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  status: 'pending' | 'verified' | 'rejected';
}

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalStatus, setTotalStatus] = useState({
    verified: 0,
    rejected: 0,
    pending: 0,
  });
  
  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    updateTotalStatus();
  }, [students]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const updateTotalStatus = () => {
    const verified = students.filter((s) => s.status === "verified").length;
    const rejected = students.filter((s) => s.status === "rejected").length;
    const pending = students.filter((s) => s.status === "pending").length;
    setTotalStatus({ verified, rejected, pending });
  };

  const handleStatusChange = async (id: string, newStatus: 'verified' | 'rejected') => {
    try {
      const response = await fetch('/api/students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      setStudents(students.map((student) =>
        student._id === id ? { ...student, status: newStatus } : student
      ));
    } catch (error) {
      console.error('Error updating student status:', error);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pieChartData = [
    { name: 'Verified', value: totalStatus.verified },
    { name: 'Rejected', value: totalStatus.rejected },
    { name: 'Pending', value: totalStatus.pending },
  ];

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Student Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.map((student) => (
              <div key={student._id} className="flex items-center justify-between mb-2">
                <span>
                  {student.name} ({student.rollNumber}) - {student.status}
                </span>
                <div>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => handleStatusChange(student._id, "verified")}
                  >
                    Verify
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusChange(student._id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Search</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by roll number or name..."
                className="mb-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div>
                {filteredStudents.map((student) => (
                  <div key={student._id}>
                    {student.name} ({student.rollNumber}) - {student.status}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}