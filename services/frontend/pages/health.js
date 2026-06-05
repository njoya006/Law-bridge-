import useSWR from 'swr'

const fetcher = (url)=>fetch(url).then(r=>r.json())

export default function Health(){
  const {data, error} = useSWR('/api/health-ready', fetcher, {refreshInterval:5000})
  if(error) return <div>Health check failed</div>
  if(!data) return <div>Loading...</div>
  return (
    <div style={{padding:20}}>
      <h2>Backend Readiness</h2>
      <pre>{JSON.stringify(data,null,2)}</pre>
    </div>
  )
}
