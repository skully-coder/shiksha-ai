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
import { explainConcept } from '@/ai/flows/ai-knowledge-base';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';

const knowledgeBaseSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters.'),
  language: z.string().min(1, 'Language is required.'),
});

export default function KnowledgeBasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof knowledgeBaseSchema>>({
    resolver: zodResolver(knowledgeBaseSchema),
    defaultValues: {
      question: '',
      language: 'English',
    },
  });

  async function onSubmit(values: z.infer<typeof knowledgeBaseSchema>) {
    setIsLoading(true);
    setExplanation('');
    try {
      const result = await explainConcept(values);
      setExplanation(result.explanation);
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to get an explanation. Please try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-headline text-xl font-bold text-primary">{t('Knowledge Base')}</h1>
        <SidebarTrigger />
      </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{t('AI Knowledge Base')}</CardTitle>
          <CardDescription>{t('Get simple, accurate explanations for complex questions.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Your Question')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('e.g., Why is the sky blue?')} {...field} />
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
                {t('Explain')}
              </Button>
            </form>
          </Form>
        </CardContent>
        {explanation && (
          <CardFooter>
            <Card className="w-full bg-secondary/50">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{t('Explanation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{explanation}</p>
              </CardContent>
            </Card>
          </CardFooter>
        )}
      </Card>
      </div>
    </div>
  );
}
