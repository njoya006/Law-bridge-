import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url) => fetch(url).then(r=>r.json())

export default function Analyses(){
  const {data,error} = useSWR('/api/analyzer/list', fetcher, {refreshInterval:5000})
  if(error) return <div>Failed to load analyses</div>
  if(!data) return <div>Loading...</div>
  return (
    <div style={{padding:20}}>
      <h2>Your Analyses</h2>
      <ul>
        {data.map(a=> (
          <li key={a.id}>
            <Link href={`/analysis/${a.id}`}><a>{a.title || a.id} - {a.status}</a></Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
