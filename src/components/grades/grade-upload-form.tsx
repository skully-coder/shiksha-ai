'use client';

import { useState, useEffect } from 'react';
import { useAuth, Classroom } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Save, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { extractGrades, ExtractGradesInput } from '@/ai/flows/extract-grades';
import { collection, addDoc, setDoc, query, where, getDocs, Timestamp, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Student {
    uid: string;
    name: string;
    rollNumber?: string;
}

interface GradeEntry {
    studentId: string;
    studentName: string;
    marksObtained: number;
}

export function GradeUploadForm() {
    const { classrooms, user } = useAuth();
    const { toast } = useToast();

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [examType, setExamType] = useState('');
    const [totalMarks, setTotalMarks] = useState<number | ''>('');

    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Manual Entry State
    const [manualGrades, setManualGrades] = useState<Record<string, number>>({});

    // Excel Upload State
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState<GradeEntry[]>([]);

    // Fetch students when class changes
    useEffect(() => {
        if (!selectedClassId || !db) return;

        async function fetchStudents() {
            setLoadingStudents(true);
            try {
                // Query students where classroomId == selectedClassId
                // Note: Check your firestore rules/indexes if this query is allowed.
                // Alternatively, if we store studentIds in classroom doc, we can fetch that.

                // Option A: Query 'students' collection (needs index)
                const q = query(collection(db!, 'students'), where('classroomId', '==', selectedClassId));
                const snapshot = await getDocs(q);
                const fetchedStudents: Student[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    fetchedStudents.push({
                        uid: doc.id,
                        name: data.name,
                        rollNumber: data.rollNumber
                    });
                });

                // Option B: If empty, try fetching from classroom doc -> studentIds
                if (fetchedStudents.length === 0) {
                    const classDoc = await getDoc(doc(db!, 'classrooms', selectedClassId));
                    if (classDoc.exists() && classDoc.data().studentIds) {
                        const ids = classDoc.data().studentIds as string[];
                        for (const id of ids) {
                            const sDoc = await getDoc(doc(db!, 'students', id));
                            if (sDoc.exists()) {
                                fetchedStudents.push({ uid: sDoc.id, name: sDoc.data().name, rollNumber: sDoc.data().rollNumber });
                            }
                        }
                    }
                }

                // Sort by Roll Number or Name
                fetchedStudents.sort((a, b) => {
                    if (a.rollNumber && b.rollNumber) return a.rollNumber.localeCompare(b.rollNumber);
                    return a.name.localeCompare(b.name);
                });

                setStudents(fetchedStudents);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast({ title: "Error", description: "Failed to load students.", variant: "destructive" });
            } finally {
                setLoadingStudents(false);
            }
        }

        fetchStudents();
    }, [selectedClassId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const aiResponse = await extractGrades({ rawRows: jsonData as Record<string, any>[] });

            // Match extracted grades to students
            const matched: GradeEntry[] = [];

            aiResponse.grades.forEach(extracted => {
                // Try to find student by Roll Number first
                let found = students.find(s => s.rollNumber && extracted.rollNumber && s.rollNumber.toString() === extracted.rollNumber.toString());

                // If not found, try by Name (fuzzy/exact)
                if (!found && extracted.studentName) {
                    found = students.find(s => s.name.toLowerCase() === extracted.studentName!.toLowerCase());
                }

                if (found) {
                    matched.push({
                        studentId: found.uid,
                        studentName: found.name,
                        marksObtained: extracted.marksObtained
                    });
                }
                // TODO: distinct handling for unmatched for MVP just skip
            });

            setPreviewData(matched);
            if (matched.length === 0) {
                toast({ title: "No Matches", description: "Could not match any students. Please check Roll Numbers/Names." });
            } else {
                toast({ title: "Success", description: `Matched ${matched.length} students.` });
            }

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to parse Excel file.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualSave = async () => {
        if (!selectedClassId || !subject || !examType) {
            toast({ title: "Missing Fields", description: "Please select Class, Subject and Exam Type", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const batchAttempts = [];
            for (const student of students) {
                const marks = manualGrades[student.uid];
                if (marks !== undefined && marks !== null) {
                    // Add to student_academic_records using setDoc and arrayUnion
                    const recordRef = doc(db!, 'student_academic_records', student.uid);
                    batchAttempts.push(setDoc(recordRef, {
                        studentId: student.uid,
                        studentName: student.name,
                        classroomId: selectedClassId, // Assuming student belongs to one class for now
                        grades: arrayUnion({
                            subject,
                            examType,
                            marksObtained: Number(marks),
                            totalMarks: Number(totalMarks),
                            date: Timestamp.now(),
                            teacherId: user?.uid
                        })
                    }, { merge: true }));
                }
            }
            await Promise.all(batchAttempts);
            toast({ title: "Saved", description: "Grades saved successfully." });
            setManualGrades({});
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to save grades.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExcelSave = async () => {
        if (!selectedClassId || !subject || !examType) {
            toast({ title: "Missing Fields", description: "Please select Class, Subject and Exam Type", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const batchAttempts = previewData.map(entry => {
                const student = students.find(s => s.uid === entry.studentId);
                if (!student) return Promise.resolve();

                const recordRef = doc(db!, 'student_academic_records', entry.studentId);
                return setDoc(recordRef, {
                    studentId: entry.studentId,
                    studentName: entry.studentName,
                    classroomId: selectedClassId,
                    grades: arrayUnion({
                        subject,
                        examType,
                        marksObtained: Number(entry.marksObtained),
                        totalMarks: Number(totalMarks),
                        date: Timestamp.now(),
                        teacherId: user?.uid
                    })
                }, { merge: true });
            });

            await Promise.all(batchAttempts);
            toast({ title: "Saved", description: "Grades uploaded  successfully." });
            setPreviewData([]);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to save grades.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (classrooms.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No classrooms found. Please create a classroom first.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Upload Grades</CardTitle>
                <CardDescription>Enter grades manually or upload an Excel sheet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Classroom</Label>
                        <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classrooms.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.grade} - {c.section}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                            placeholder="e.g. Mathematics"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Exam Type</Label>
                        <Input
                            placeholder="e.g. Midterm 1"
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Total Marks</Label>
                        <Input
                            type="number"
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>
                </div>

                {selectedClassId && (
                    <Tabs defaultValue="manual" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                            <TabsTrigger value="excel">Excel Upload</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4">
                            {loadingStudents ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <>
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Roll No</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Marks (Out of {totalMarks})</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map(student => (
                                                    <TableRow key={student.uid}>
                                                        <TableCell>{student.rollNumber || '-'}</TableCell>
                                                        <TableCell>{student.name}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                className="w-24"
                                                                placeholder="0"
                                                                value={manualGrades[student.uid] || ''}
                                                                onChange={(e) => setManualGrades({ ...manualGrades, [student.uid]: Number(e.target.value) })}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <Button onClick={handleManualSave} disabled={isProcessing} className="w-full">
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" /> Save Grades
                                    </Button>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="excel" className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition transition-colors">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <div className="p-4 rounded-full bg-primary/10">
                                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-medium">Upload Excel File</h3>
                                    <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                                    <Input
                                        type="file"
                                        className="max-w-xs mt-4"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                        disabled={isProcessing}
                                    />
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="flex items-center justify-center p-4 text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing with AI...
                                </div>
                            )}

                            {previewData.length > 0 && (
                                <>
                                    <h3 className="font-semibold text-lg">Preview</h3>
                                    <div className="border rounded-md max-h-[300px] overflow-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student Name</TableHead>
                                                    <TableHead>Marks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.map((entry, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{entry.studentName}</TableCell>
                                                        <TableCell>{entry.marksObtained}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <Button onClick={handleExcelSave} disabled={isProcessing} className="w-full">
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" /> Confirm & Save
                                    </Button>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}
