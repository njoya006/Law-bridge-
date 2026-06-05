from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import asyncio
import aiohttp
from langdetect import detect
from django.core.cache import cache
import hashlib

@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.query_params.get('q', '').strip()
    search_type = request.query_params.get('type', 'all')
    limit = int(request.query_params.get('limit', 10))
    offset = int(request.query_params.get('offset', 0))
    
    if not query or len(query) < 2:
        return Response({'error': 'Query must be at least 2 characters'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        language = detect(query)
    except:
        language = 'en'
    
    cache_key = f"search:{hashlib.md5(query.encode()).hexdigest()}:{language}:{search_type}"
    cached_result = cache.get(cache_key)
    if cached_result:
        results = cached_result[offset:offset+limit]
        return Response({
            'results': results,
            'total_count': len(cached_result),
            'limit': limit,
            'offset': offset,
            'from_cache': True
        })
    
    results = asyncio.run(_federated_search(query, search_type, language))
    results.sort(key=lambda x: x.get('relevance', 0), reverse=True)
    cache.set(cache_key, results, 120)
    paginated = results[offset:offset+limit]
    
    return Response({
        'results': paginated,
        'total_count': len(results),
        'limit': limit,
        'offset': offset,
        'language_detected': language,
        'from_cache': False
    })

async def _federated_search(query, search_type, language):
    tasks = []
    
    if search_type in ['case', 'all']:
        tasks.append(_search_service('http://case-service:8004', 'cases', query, language))
    if search_type in ['lawyer', 'all']:
        tasks.append(_search_service('http://lawyer-service:8003', 'lawyers', query, language))
    if search_type in ['document', 'all']:
        tasks.append(_search_service('http://document-service:8005', 'documents', query, language))
    
    all_results = []
    try:
        responses = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=5.0)
        for response in responses:
            if isinstance(response, list):
                all_results.extend(response)
    except asyncio.TimeoutError:
        pass
    
    return all_results

async def _search_service(service_url, resource_type, query, language):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{service_url}/api/v1/{resource_type}/search/",
                params={'q': query, 'language': language},
                timeout=aiohttp.ClientTimeout(total=4)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get('results', [])
    except Exception as e:
        print(f"Search error from {service_url}: {e}")
    
    return []
