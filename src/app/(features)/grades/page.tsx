'use client';

import { useAuth } from '@/hooks/use-auth';
import { GradeUploadForm } from '@/components/grades/grade-upload-form';
import { StudentGradesTable } from '@/components/grades/student-grades-table';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function GradesPage() {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Grades & Performance</h1>
                <p className="text-muted-foreground mt-2">
                    {profile?.role === 'teacher'
                        ? 'Manage and upload student grades.'
                        : 'View your academic progress.'}
                </p>
            </div>

            {profile?.role === 'teacher' ? (
                <GradeUploadForm />
            ) : (
                <StudentGradesTable />
            )}
        </div>
    );
}
