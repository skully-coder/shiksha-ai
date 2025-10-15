
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateDifferentiatedWorksheets, GenerateDifferentiatedWorksheetsOutput } from '@/ai/flows/generate-differentiated-worksheets';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Download, Share2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import PageSkeleton from '@/components/skeletons/PageSkeleton';


const worksheetsSchema = z.object({
  textbookPageImage: z.string().min(1, 'Please upload an image.'),
  gradeLevels: z.string().min(1, 'Please enter grade levels.').regex(/^\d+(,\s*\d+)*$/, 'Please enter comma-separated numbers (e.g., 3, 4, 5)'),
  additionalDetails: z.string().optional(),
});

type Worksheet = GenerateDifferentiatedWorksheetsOutput['worksheets'][0];

export default function DifferentiatedWorksheetsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile, loading: authLoading, classrooms } = useAuth();
  const router = useRouter();
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'teacher') {
        router.replace('/profile');
    }
  }, [authLoading, profile, router]);

  const form = useForm<z.infer<typeof worksheetsSchema>>({
    resolver: zodResolver(worksheetsSchema),
    defaultValues: {
      textbookPageImage: '',
      gradeLevels: '',
      additionalDetails: '',
    },
  });

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      const base64 = await toBase64(file);
      form.setValue('textbookPageImage', base64);
    }
  }

  async function onSubmit(values: z.infer<typeof worksheetsSchema>) {
    setIsLoading(true);
    setWorksheets([]);
    contentRefs.current = [];
    try {
      const result = await generateDifferentiatedWorksheets(values);
      setWorksheets(result.worksheets);
      contentRefs.current = result.worksheets.map(() => null);
    } catch (error) {
      console.error('Error generating worksheets:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate worksheets. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleExportToPdf = (index: number) => {
    const input = contentRefs.current[index];
    const gradeLevel = worksheets[index].gradeLevel;
    if (!input) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find the worksheet content to export.' });
      return;
    }
    setIsPdfLoading(gradeLevel);
    html2canvas(input, { scale: 2, useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
        pdf.addImage(imgData, 'PNG', 0, 0, imgProps.width * ratio, imgProps.height * ratio);
        pdf.save(`worksheet-grade-${gradeLevel}.pdf`);
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        toast({ variant: 'destructive', title: 'PDF Error', description: 'Failed to export as PDF.' });
      })
      .finally(() => setIsPdfLoading(null));
  };
  
  const handleShare = async () => {
    if (!user || !profile || !selectedClassroom || !selectedWorksheet) return;

    setIsSharing(true);
    try {
      const worksheetData = {
        authorId: user.uid,
        authorName: profile.name,
        createdAt: serverTimestamp(),
        gradeLevel: selectedWorksheet.gradeLevel,
        worksheetContent: selectedWorksheet.worksheetContent,
      };
      const worksheetRef = await addDoc(collection(db, 'worksheets'), worksheetData);

      const postData = {
        authorId: user.uid,
        authorName: profile.name,
        createdAt: serverTimestamp(),
        type: 'worksheet',
        worksheetId: worksheetRef.id,
        gradeLevel: selectedWorksheet.gradeLevel,
      };
      await addDoc(collection(db, 'schools', profile.school!, 'classrooms', selectedClassroom, 'posts'), postData);
      
      const classroom = classrooms.find(c => c.id === selectedClassroom);
      toast({ title: 'Success', description: `Worksheet shared with Grade ${classroom?.grade} - Section ${classroom?.section}.` });
      setIsShareDialogOpen(false);
      setSelectedWorksheet(null);
      setSelectedClassroom('');
    } catch (error) {
      console.error("Error sharing worksheet:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not share the worksheet.' });
    } finally {
      setIsSharing(false);
    }
  };

  if (authLoading || !profile || profile.role !== 'teacher') {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
            <h1 className="font-headline text-xl font-bold text-primary">Worksheets</h1>
            <SidebarTrigger />
        </header>
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Differentiated Worksheets Generator</CardTitle>
          <CardDescription>Upload a textbook page to create worksheets for different grade levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="textbookPageImage" render={() => (
                  <FormItem>
                    <FormLabel>Textbook Page Image</FormLabel>
                    <FormControl><Input type="file" accept="image/*" onChange={handleFileChange} /></FormControl>
                    <FormMessage />
                    {preview && <Image src={preview} alt="Textbook page preview" width={200} height={200} className="mt-4 rounded-md object-contain" />}
                  </FormItem>
              )}/>
              <FormField control={form.control} name="gradeLevels" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Levels</FormLabel>
                    <FormControl><Input placeholder="e.g., 3, 4, 5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField
                control={form.control}
                name="additionalDetails"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Additional Details (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="e.g., Create mostly fill-in-the-blank questions based on the text."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                Generate Worksheets
              </Button>
            </form>
          </Form>
        </CardContent>
        {worksheets.length > 0 && (
          <CardFooter>
             <Card className="w-full bg-secondary/50">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Generated Worksheets</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {worksheets.map((ws, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <div className="flex items-center w-full">
                            <AccordionTrigger className="flex-1">Grade Level: {ws.gradeLevel}</AccordionTrigger>
                            <div className="flex items-center gap-2 pr-4">
                               <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); handleExportToPdf(index); }} 
                                  disabled={isPdfLoading !== null}
                                  aria-label={`Download PDF for Grade ${ws.gradeLevel}`}
                                >
                                    {isPdfLoading === ws.gradeLevel ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                                    PDF
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); setSelectedWorksheet(ws); setIsShareDialogOpen(true); }} 
                                  disabled={classrooms.length === 0}
                                  aria-label={`Share worksheet for Grade ${ws.gradeLevel}`}
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                          </div>
                          <AccordionContent>
                            <div ref={el => contentRefs.current[index] = el} className="p-4 bg-background rounded-md border">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{ws.worksheetContent}</ReactMarkdown>
                                </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                </CardContent>
              </Card>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Share Worksheet</DialogTitle>
                <DialogDescription>
                    Select a classroom to post this worksheet to their feed.
                    {classrooms.length === 0 && <span className="text-destructive block mt-2">You have not joined any classrooms.</span>}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select onValueChange={setSelectedClassroom} defaultValue={selectedClassroom}>
                    <SelectTrigger><SelectValue placeholder="Select a classroom..." /></SelectTrigger>
                    <SelectContent>
                        {classrooms.map(c => (
                            <SelectItem key={c.id} value={c.id}>Grade {c.grade} - Section {c.section}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleShare} disabled={!selectedClassroom || isSharing}>
                    {isSharing && <LoadingSpinner className="mr-2 h-4 w-4" />}
                    Share
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
