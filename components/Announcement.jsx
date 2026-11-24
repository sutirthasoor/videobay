'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
export default function Announcement() {
  const [t, setT] = useState('');
  useEffect(() => { getDoc(doc(db, 'content', 'site')).then(s => s.exists() && setT(s.data().announcement || '')).catch(() => {}); }, []);
  if (!t) return null;
  return <div className="bg-[#2f4cf5] px-4 py-2 text-center text-sm font-medium text-white">{t}</div>;
}