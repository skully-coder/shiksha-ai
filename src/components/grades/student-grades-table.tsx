'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Grade {
    subject: string;
    examType: string;
    marksObtained: number;
    totalMarks: number;
    date: Timestamp;
}

export function StudentGradesTable() {
    const { user } = useAuth();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) return;

        async function fetchGrades() {
            try {
                const docRef = doc(db!, 'student_academic_records', user!.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const fetchedGrades = (data.grades || []) as Grade[];
                    // Sort by date descending
                    fetchedGrades.sort((a, b) => b.date.toMillis() - a.date.toMillis());
                    setGrades(fetchedGrades);
                } else {
                    setGrades([]);
                }
            } catch (error) {
                console.error("Error fetching grades:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchGrades();
    }, [user]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (grades.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Grades</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No grades have been uploaded yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Grades</CardTitle>
                <CardDescription>View your academic performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Exam</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Percentage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grades.map((grade) => {
                            const percentage = ((grade.marksObtained / grade.totalMarks) * 100).toFixed(1);
                            return (
                                <TableRow key={`${grade.subject}-${grade.examType}-${grade.date.toMillis()}`}>
                                    <TableCell>{format(grade.date.toDate(), 'PP')}</TableCell>
                                    <TableCell className="font-medium">{grade.subject}</TableCell>
                                    <TableCell>{grade.examType}</TableCell>
                                    <TableCell>{grade.marksObtained} / {grade.totalMarks}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${Number(percentage) >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                            Number(percentage) >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                            }`}>
                                            {percentage}%
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
