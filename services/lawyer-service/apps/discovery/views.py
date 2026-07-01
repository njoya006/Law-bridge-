import logging
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.lawyers.models import LawyerProfile
from .serializers import (
    LawyerDiscoverySerializer,
    LawyerMatchingRequestSerializer,
    LawyerMatchingResponseSerializer
)

logger = logging.getLogger(__name__)


class LawyerBrowseView(APIView):
    """Public endpoint to browse and filter active lawyers"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """
        GET /api/v1/lawyers/ - Browse all active lawyers
        Query params:
          - specialization: filter by specialization
          - circuit: anglophone/francophone/both
          - page: pagination
        """
        queryset = LawyerProfile.objects.exclude(
            availability_status='inactive'
        ).order_by('-average_rating')

        # Filter by specialization if provided
        specialization = request.query_params.get('specialization')
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)

        # Filter by circuit if provided
        circuit = request.query_params.get('circuit')
        if circuit:
            if circuit == 'anglophone':
                queryset = queryset.filter(
                    Q(bijural_flag='common_law') | Q(bijural_flag='both')
                )
            elif circuit == 'francophone':
                queryset = queryset.filter(
                    Q(bijural_flag='civil_law') | Q(bijural_flag='both')
                )

        try:
            serializer = LawyerDiscoverySerializer(queryset, many=True)
            return Response({'count': queryset.count(), 'results': serializer.data})
        except Exception as exc:
            logger.exception('LawyerBrowseView error')
            return Response({'count': 0, 'results': [], 'error': str(exc)},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)


class LawyerSearchView(APIView):
    """Full-text search endpoint (bilingual)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        GET /api/v1/lawyers/search/ - Search lawyers by name, specialization, bio
        Query params:
          - q: search query (required)
        """
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({'results': []})

        queryset = LawyerProfile.objects.filter(
            Q(full_name__icontains=query) |
            Q(specialization__icontains=query) |
            Q(bio__icontains=query),
        ).exclude(availability_status='inactive').order_by('-average_rating')

        try:
            serializer = LawyerDiscoverySerializer(queryset, many=True)
            return Response({'query': query, 'count': queryset.count(), 'results': serializer.data})
        except Exception as exc:
            logger.exception('LawyerSearchView error')
            return Response({'results': []}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class LawyerMatchingView(APIView):
    """Smart lawyer matching algorithm"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        POST /api/v1/lawyers/match/ - Smart matching algorithm
        
        Scoring: 0-100 based on:
        - Specialization match: 40 points
        - Caseload (fewer active cases): 30 points
        - Years of experience: 20 points
        - Circuit match: 10 points
        
        Returns top 3 ranked lawyers with scores
        """
        serializer = LawyerMatchingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        case_type = serializer.validated_data['case_type'].lower()
        circuit = serializer.validated_data['circuit']
        language = serializer.validated_data['language_preference']
        urgency = serializer.validated_data['urgency']
        
        # Get all available lawyers
        lawyers = LawyerProfile.objects.filter(
            availability_status='available',
        )
        
        # Filter by circuit
        if circuit == 'anglophone':
            lawyers = lawyers.filter(
                Q(bijural_flag='common_law') | Q(bijural_flag='both')
            )
        elif circuit == 'francophone':
            lawyers = lawyers.filter(
                Q(bijural_flag='civil_law') | Q(bijural_flag='both')
            )
        
        # Score each lawyer
        scored_lawyers = []
        for lawyer in lawyers:
            score = self._calculate_match_score(lawyer, case_type, circuit, urgency)
            scored_lawyers.append({
                'lawyer': lawyer,
                'score': score,
                'match_factors': {
                    'specialization_match': score >= 60,
                    'caseload_score': self._caseload_score(lawyer),
                    'experience_score': self._experience_score(lawyer),
                    'circuit_match': circuit in [lawyer.bijural_flag, 'both']
                }
            })
        
        # Sort by score (descending) and take top 3
        scored_lawyers = sorted(scored_lawyers, key=lambda x: x['score'], reverse=True)[:3]
        
        # Serialize response
        response_data = []
        for item in scored_lawyers:
            response_data.append({
                'lawyer': LawyerDiscoverySerializer(item['lawyer']).data,
                'score': item['score'],
                'match_factors': item['match_factors']
            })
        
        return Response({
            'matches': response_data,
            'count': len(response_data)
        })
    
    def _calculate_match_score(self, lawyer, case_type, circuit, urgency):
        """Calculate match score (0-100)"""
        score = 0
        
        # Specialization match (40 points)
        if case_type.lower() in lawyer.specialization.lower():
            score += 40
        else:
            score += 20
        
        # Caseload score (30 points)
        score += self._caseload_score(lawyer)
        
        # Experience score (20 points)
        score += self._experience_score(lawyer)
        
        # Circuit match (10 points)
        if circuit in [lawyer.bijural_flag, 'both']:
            score += 10
        
        # Urgency boost (active cases matter more for urgent cases)
        if urgency == 'high' and lawyer.active_cases < 5:
            score += 5
        
        return min(score, 100)  # Cap at 100
    
    def _caseload_score(self, lawyer):
        """Score based on active cases (0-30)"""
        # Fewer active cases = higher score
        if lawyer.active_cases == 0:
            return 30
        elif lawyer.active_cases <= 5:
            return 25
        elif lawyer.active_cases <= 10:
            return 15
        else:
            return 5
    
    def _experience_score(self, lawyer):
        """Score based on years of experience (0-20)"""
        if lawyer.years_of_experience >= 20:
            return 20
        elif lawyer.years_of_experience >= 10:
            return 15
        elif lawyer.years_of_experience >= 5:
            return 10
        else:
            return 5
