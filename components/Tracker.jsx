'use client';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
export default function Tracker() {
  useEffect(() => {
    try { if (sessionStorage.getItem('vb_v')) return; sessionStorage.setItem('vb_v', '1'); } catch {}
    const day = new Date().toISOString().slice(0, 10);
    setDoc(doc(db, 'stats', 'v-' + day), { day, count: increment(1) }, { merge: true }).catch(() => {});
  }, []);
  return null;
}
