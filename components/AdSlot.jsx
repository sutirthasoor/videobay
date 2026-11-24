'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
export default function AdSlot({ slot }) {
  const [ad, setAd] = useState(null);
  useEffect(() => { getDoc(doc(db, 'ads', slot)).then(s => s.exists() && setAd(s.data())).catch(() => {}); }, [slot]);
  useEffect(() => { if (ad?.enabled && ad.adsenseSlotId) try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} }, [ad]);
  if (!ad?.enabled) return null;
  const pub = process.env.NEXT_PUBLIC_ADSENSE_ID;
  return (<div className="my-6 flex justify-center overflow-hidden text-center">
    {ad.adsenseSlotId && pub
      ? <ins className="adsbygoogle block w-full" style={{ display: 'block' }} data-ad-client={pub} data-ad-slot={ad.adsenseSlotId} data-ad-format="auto" data-full-width-responsive="true" />
      : <div dangerouslySetInnerHTML={{ __html: ad.html || '' }} />}
  </div>);
}
