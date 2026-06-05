"use client"
import React, { useEffect, useState } from 'react'

export default function AnalysisDetail({ params }: { params: { id: string } }){
  const { id } = params
  const [analysis,setAnalysis]=useState<any>(null)
  useEffect(()=>{
    let mounted=true
    const fetchOne = async ()=>{
      try{ const base = process.env.NEXT_PUBLIC_API_BASE || ''; const res = await fetch(`${base}/api/v1/analysis/${id}/`); const j = await res.json(); if (mounted) setAnalysis(j) }catch(e){}
    }
    fetchOne(); const iv = setInterval(fetchOne,5000); return ()=>{ mounted=false; clearInterval(iv) }
  },[id])
  if (!analysis) return <div>Loading...</div>
  return (
    <div className="space-y-4">
      <h2 className="font-display text-display-md">Analysis {analysis.id}</h2>
      <div className="p-4 bg-primary-800 rounded">Status: {analysis.status}</div>
      <div className="p-4 bg-primary-800 rounded"><pre className="whitespace-pre-wrap">{analysis.summary}</pre></div>
    </div>
  )
}
