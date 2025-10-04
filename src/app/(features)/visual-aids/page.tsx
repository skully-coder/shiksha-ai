
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateVisualAid } from '@/ai/flows/generate-visual-aids';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Image from 'next/image';
import { Download, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const visualAidSchema = z.object({
  description: z.string().min(10, 'Please provide a more detailed description.'),
});

export default function VisualAidsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [visualAid, setVisualAid] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [visualAidId, setVisualAidId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();


  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'teacher') {
        router.replace('/profile');
    }
  }, [authLoading, profile, router]);

  const form = useForm<z.infer<typeof visualAidSchema>>({
    resolver: zodResolver(visualAidSchema),
    defaultValues: {
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof visualAidSchema>) {
    setIsLoading(true);
    setVisualAid(null);
    setIsFavorite(false);
    setVisualAidId(null);
    try {
      const result = await generateVisualAid(values);
      setVisualAid(result.visualAidDataUri);
      
      // Save to Firestore
      if (user && db) {
        const visualAidData = {
          authorId: user.uid,
          authorName: profile?.name || 'Unknown',
          createdAt: serverTimestamp(),
          description: values.description,
          visualAidDataUri: result.visualAidDataUri,
          isFavorite: false,
        };
        const visualAidRef = await addDoc(collection(db, 'visualAids'), visualAidData);
        setVisualAidId(visualAidRef.id);
      }
    } catch (error) {
      console.error('Error generating visual aid:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate visual aid. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleExport = () => {
    if (!visualAid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No visual aid to export.',
      });
      return;
    }
    const link = document.createElement('a');
    link.href = visualAid;

    const mimeType = visualAid.match(/data:image\/([a-zA-Z+]+);/);
    const extension = mimeType ? mimeType[1] : 'png';
    link.download = `visual-aid.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
        title: "Success",
        description: "Visual aid has been downloaded."
    });
  };

  const handleToggleFavorite = async () => {
    if (!user || !db || !visualAidId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot favorite visual aid. Please generate it first."
      });
      return;
    }

    try {
      const visualAidRef = doc(db, 'visualAids', visualAidId);
      await updateDoc(visualAidRef, { isFavorite: !isFavorite });
      setIsFavorite(!isFavorite);
      
      toast({
        title: isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
        description: isFavorite ? 'Visual aid removed from your favorites.' : 'Visual aid added to your favorites.',
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update favorite status. Please try again.',
      });
    }
  };

  if (authLoading || !profile || profile.role !== 'teacher') {
    return (
        <div className="flex items-center justify-center h-full">
            <LoadingSpinner className="h-12 w-12" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-headline text-xl font-bold text-primary">Visual Aids</h1>
        <SidebarTrigger />
      </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Visual Aid Generator</CardTitle>
          <CardDescription>Describe a simple line drawing or chart to explain a concept.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., A simple diagram of the water cycle showing evaporation, condensation, and precipitation." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                Generate Visual Aid
              </Button>
            </form>
          </Form>
        </CardContent>
        {isLoading && (
            <CardFooter>
              <Skeleton className="w-full h-80 rounded-lg" />
            </CardFooter>
        )}
        {visualAid && (
          <CardFooter>
            <Card className="w-full bg-secondary/50">
              <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-xl">Generated Visual Aid</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleFavorite}
                        disabled={!visualAidId}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        className={isFavorite ? "text-red-500 hover:text-red-700" : "text-gray-500 hover:text-red-500"}
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExport}
                        aria-label="Export Visual Aid"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="flex justify-center p-6">
                <Image src={visualAid} alt="Generated visual aid" width={512} height={512} className="rounded-md" />
              </CardContent>
            </Card>
          </CardFooter>
        )}
      </Card>
      </div>
    </div>
  );
}
