"use client"
import React, { useEffect, useState } from 'react'
import FileUpload from '../../components/ui/FileUpload'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { uploadDocument } from '../../lib/documentsApi'

export default function UploadPage(){
  const [status,setStatus]=useState<string | null>(null)
  const [cases, setCases] = useState<CaseItem[]>([])
  const [caseId, setCaseId] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return
      try {
        const response = await getMyCases(access)
        setCases(response.results)
        setCaseId(response.results[0]?.id ?? '')
      } catch {
        setCases([])
      }
    }
    void run()
  }, [])

  const handleFile = async (file: File) => {
    const access = localStorage.getItem('access')
    if (!access) {
      setStatus('Please sign in before uploading.')
      return
    }

    if (!caseId) {
      setStatus('Create or select a matter first.')
      return
    }

    setStatus('Uploading...')
    try{
      await uploadDocument(caseId, file, 'other', access, password || undefined)
      setStatus(password ? 'Stored and password-protected for the selected matter.' : 'Stored in document service and linked to the selected matter.')
    }catch(err){ setStatus('Error: '+String(err)) }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-display-md">Upload Document</h2>
      <p className="text-sm text-primary-300">Choose the matter first so the upload is stored against the right case.</p>
      <div className="max-w-md rounded bg-primary-800 p-4">
        <label className="block text-sm mb-2">Matter</label>
        <select value={caseId} onChange={e => setCaseId(e.target.value)} className="w-full rounded bg-primary-700 px-3 py-2 text-white">
          <option value="">Select a matter</option>
          {cases.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <label className="mt-4 block text-sm mb-2">Document password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded bg-primary-700 px-3 py-2 text-white"
          placeholder="Optional: set a password for access"
        />
      </div>
      <div className="p-4 bg-primary-800 rounded">
        <FileUpload onFile={handleFile} />
      </div>
      {status && <div className="text-primary-200">{status}</div>}
    </div>
  )
}
