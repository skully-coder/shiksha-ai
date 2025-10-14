'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function DebugPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testFirebaseConfig = () => {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    setResult(`Firebase Config Check:
isFirebaseConfigured: ${isFirebaseConfigured}
auth object exists: ${!!auth}
db object exists: ${!!db}

Environment Variables:
API_KEY: ${config.apiKey ? 'SET' : 'MISSING'}
AUTH_DOMAIN: ${config.authDomain ? 'SET' : 'MISSING'}
PROJECT_ID: ${config.projectId ? 'SET' : 'MISSING'}
STORAGE_BUCKET: ${config.storageBucket ? 'SET' : 'MISSING'}
MESSAGING_SENDER_ID: ${config.messagingSenderId ? 'SET' : 'MISSING'}
APP_ID: ${config.appId ? 'SET' : 'MISSING'}`);
  };

  const testSignup = async () => {
    setLoading(true);
    try {
      console.log('Starting signup test...');
      console.log('Auth object:', auth);
      console.log('Email:', email);
      console.log('Password length:', password.length);
      
      if (!auth) {
        throw new Error('Auth object is null - Firebase not initialized');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', userCredential.user);
      
      setResult(`✅ SUCCESS: User created with UID: ${userCredential.user.uid}`);
    } catch (error: any) {
      console.error('Signup error:', error);
      setResult(`❌ ERROR: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testFirebaseConfig} className="w-full">
            Test Firebase Configuration
          </Button>
          
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button 
              onClick={testSignup} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? 'Testing Signup...' : 'Test Signup'}
            </Button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Debug Output:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}