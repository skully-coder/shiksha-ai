"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateLocalContent } from '@/ai/flows/generate-local-content';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import FeaturePageSkeleton from "@/components/skeletons/FeaturePageSkeleton";
import { useTranslation } from 'react-i18next';

const localContentSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters.'),
  language: z.string().min(1, 'Language is required.'),
});

export default function LocalContentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const { profile, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof localContentSchema>>({
    resolver: zodResolver(localContentSchema),
    defaultValues: {
      prompt: '',
      language: 'Marathi',
    },
  });

  async function onSubmit(values: z.infer<typeof localContentSchema>) {
    setIsLoading(true);
    setContent('');
    try {
      const result = await generateLocalContent(values);
      setContent(result.content);
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to generate content. Please try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || !profile) {
    return <FeaturePageSkeleton cardCount={6} />;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-headline text-xl font-bold text-primary">{t('Local Content')}</h1>
        <SidebarTrigger />
      </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{t('Hyper-Local Content Generator')}</CardTitle>
            <CardDescription>{t('Generate culturally relevant stories, examples, or explanations.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Your Request')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('e.g., Create a story in Marathi about farmers to explain different soil types')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Language')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select a language')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="English">{t('English')}</SelectItem>
                          <SelectItem value="Hindi">{t('Hindi')}</SelectItem>
                          <SelectItem value="Marathi">{t('Marathi')}</SelectItem>
                          <SelectItem value="Bengali">{t('Bengali')}</SelectItem>
                          <SelectItem value="Tamil">{t('Tamil')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                  {t('Generate Content')}
                </Button>
              </form>
            </Form>
          </CardContent>
          {content && (
            <CardFooter>
              <Card className="w-full bg-secondary/50">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">{t('Generated Content')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap font-body text-sm">{content}</pre>
                </CardContent>
              </Card>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
