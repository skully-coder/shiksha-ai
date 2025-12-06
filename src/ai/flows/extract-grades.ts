'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractGradesInputSchema = z.object({
    rawRows: z.array(z.record(z.string(), z.any())).describe('The raw rows parsed from the Excel file.'),
});

export type ExtractGradesInput = z.infer<typeof ExtractGradesInputSchema>;

const GradeEntrySchema = z.object({
    studentName: z.string().optional().describe('The name of the student found in the row.'),
    rollNumber: z.string().optional().describe('The roll number of the student found in the row.'),
    marksObtained: z.number().describe('The marks obtained by the student.'),
});

const ExtractGradesOutputSchema = z.object({
    grades: z.array(GradeEntrySchema).describe('The list of extracted grades.'),
});

export type ExtractGradesOutput = z.infer<typeof ExtractGradesOutputSchema>;

export async function extractGrades(input: ExtractGradesInput): Promise<ExtractGradesOutput> {
    return extractGradesFlow(input);
}

const prompt = ai.definePrompt({
    name: 'extractGradesPrompt',
    input: { schema: ExtractGradesInputSchema },
    output: { schema: ExtractGradesOutputSchema },
    prompt: `You are an assistant that extracts student grades from raw Excel data.
The user has uploaded an Excel file, and we have converted it to a list of JSON objects (rows).
Your job is to intelligently identify which columns correspond to the Student's Identity (Name or Roll Number) and which column corresponds to the Marks/Score.

Here is the raw data:
{{json rawRows}}

Please analyze the data and extract a list of students and their marks.
- If a row does not look like a student record (e.g., header, footer, empty), ignore it.
- Try to find "Name", "Student Name", "Roll No", "ID" for identity.
- Try to find "Marks", "Score", "Total", "Obtained" for marks.
- Return a standardized list.
`,
});

export const extractGradesFlow = ai.defineFlow({
    name: 'extractGradesFlow',
    inputSchema: ExtractGradesInputSchema,
    outputSchema: ExtractGradesOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error('Failed to extract grades from AI.');
    }
    return output;
});
