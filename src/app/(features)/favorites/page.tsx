'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Heart, BookText, Sheet, ImageIcon, Calendar, User } from 'lucide-react';
// @ts-ignore
import Link from 'next/link';

interface FavoriteItem {
  id: string;
  type: 'lessonPlan' | 'worksheet' | 'visualAid';
  title: string;
  description: string;
  content: string;
  createdAt: any;
  authorName: string;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
}

export default function FavoritesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !user || !db) {
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const allFavorites: FavoriteItem[] = [];

        // Fetch favorite lesson plans
        const lessonPlansQuery = query(
          collection(db!, 'lessonPlans'),
          where('authorId', '==', user.uid),
          where('isFavorite', '==', true),
          orderBy('createdAt', 'desc')
        );
        const lessonPlansSnapshot = await getDocs(lessonPlansQuery);
        lessonPlansSnapshot.forEach((doc: any) => {
          const data = doc.data();
          if (data) {
            allFavorites.push({
              id: doc.id,
              type: 'lessonPlan',
              title: `${data.subject} - ${data.topic}`,
              description: `Grade ${data.gradeLevel}`,
              content: data.weeklyPlan,
              createdAt: data.createdAt,
              authorName: data.authorName,
              subject: data.subject,
              topic: data.topic,
              gradeLevel: data.gradeLevel,
            });
          }
        });

        // Fetch favorite worksheets
        const worksheetsQuery = query(
          collection(db!, 'worksheets'),
          where('authorId', '==', user.uid),
          where('isFavorite', '==', true),
          orderBy('createdAt', 'desc')
        );
        const worksheetsSnapshot = await getDocs(worksheetsQuery);
        worksheetsSnapshot.forEach((doc: any) => {
          const data = doc.data();
          if (data) {
            allFavorites.push({
              id: doc.id,
              type: 'worksheet',
              title: `Worksheet - Grade ${data.gradeLevel}`,
              description: `Grade ${data.gradeLevel} Worksheet`,
              content: data.worksheetContent,
              createdAt: data.createdAt,
              authorName: data.authorName,
              gradeLevel: data.gradeLevel,
            });
          }
        });

        // Fetch favorite visual aids
        const visualAidsQuery = query(
          collection(db!, 'visualAids'),
          where('authorId', '==', user.uid),
          where('isFavorite', '==', true),
          orderBy('createdAt', 'desc')
        );
        const visualAidsSnapshot = await getDocs(visualAidsQuery);
        visualAidsSnapshot.forEach((doc: any) => {
          const data = doc.data();
          if (data) {
            allFavorites.push({
              id: doc.id,
              type: 'visualAid',
              title: data.title || 'Visual Aid',
              description: data.description || 'Generated visual aid',
              content: data.visualAidDataUri,
              createdAt: data.createdAt,
              authorName: data.authorName,
            });
          }
        });

        // Sort all favorites by creation date
        allFavorites.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });

        setFavorites(allFavorites);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load favorites. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [authLoading, user, toast]);

  const handleRemoveFavorite = async (itemId: string, itemType: string) => {
    if (!user || !db) return;

    try {
      const collectionName = itemType === 'lessonPlan' ? 'lessonPlans' : 
                           itemType === 'worksheet' ? 'worksheets' : 'visualAids';
      
      const docRef = doc(db, collectionName, itemId);
      await updateDoc(docRef, { isFavorite: false });
      
      setFavorites((prev: FavoriteItem[]) => prev.filter((item: FavoriteItem) => item.id !== itemId));
      
      toast({
        title: 'Success',
        description: 'Removed from favorites.',
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove from favorites.',
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lessonPlan':
        return <BookText className="h-5 w-5" />;
      case 'worksheet':
        return <Sheet className="h-5 w-5" />;
      case 'visualAid':
        return <ImageIcon className="h-5 w-5" />;
      default:
        return <Heart className="h-5 w-5" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-headline text-xl font-bold text-primary">Favorites</h1>
        <SidebarTrigger />
      </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="font-headline text-3xl font-bold text-primary mb-2">My Favorites</h1>
            <p className="text-muted-foreground">
              Your saved lesson plans, worksheets, and visual aids.
            </p>
          </div>

          {favorites.length === 0 ? (
            <Card className="flex items-center justify-center h-96 border-dashed bg-secondary/20">
              <CardContent className="text-center text-muted-foreground p-6">
                <Heart className="mx-auto h-12 w-12 mb-4" />
                <p className="font-medium">No favorites yet</p>
                <p className="text-sm">Start favoriting your content to see it here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item: FavoriteItem) => (
                <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(item.type)}
                        <div>
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFavorite(item.id, item.type)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{item.authorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      
                      {item.type === 'lessonPlan' && (
                        <div className="mt-3">
                          <Link href={`/lesson-plans/${item.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Lesson Plan
                            </Button>
                          </Link>
                        </div>
                      )}
                      
                      {item.type === 'worksheet' && (
                        <div className="mt-3">
                          <Link href={`/worksheets/${item.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Worksheet
                            </Button>
                          </Link>
                        </div>
                      )}
                      
                      {item.type === 'visualAid' && (
                        <div className="mt-3">
                          <Link href={`/visual-aids/${item.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Visual Aid
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}