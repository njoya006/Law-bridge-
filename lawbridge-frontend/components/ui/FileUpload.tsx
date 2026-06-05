import React from 'react'

export default function FileUpload({ onFile }: { onFile: (f: File) => void }){
  return (
    <input type="file" onChange={e => { if (e.target.files && e.target.files[0]) onFile(e.target.files[0]) }} />
  )
}
