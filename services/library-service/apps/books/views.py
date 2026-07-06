from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Book, BookVersion, Category
from .serializers import BookListSerializer, BookDetailSerializer, BookVersionSerializer, CategorySerializer
from .permissions import (
    get_caller, can_create_book, can_view_book,
    can_edit_book, can_submit_book, can_review_book,
)


class BookListCreateView(APIView):
    def get(self, request):
        caller_id, caller_role, caller_firm_id = get_caller(request)

        qs = Book.objects.filter(status=Book.STATUS_PUBLISHED)

        # Filter by tier — general books visible to all; firm books only to same firm
        tier = request.query_params.get('tier')
        if tier == Book.TIER_FIRM:
            if not caller_firm_id:
                return Response({'error': 'firm_id required for firm library'}, status=400)
            qs = qs.filter(tier=Book.TIER_FIRM, firm_id=caller_firm_id)
        elif tier == Book.TIER_GENERAL:
            qs = qs.filter(tier=Book.TIER_GENERAL)
        else:
            # Return general + caller's firm books
            from django.db.models import Q
            q = Q(tier=Book.TIER_GENERAL)
            if caller_firm_id:
                q |= Q(tier=Book.TIER_FIRM, firm_id=caller_firm_id)
            qs = qs.filter(q)

        # Text search
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(abstract__icontains=search) |
                Q(author_name__icontains=search)
            )

        # Legal area filter
        legal_area = request.query_params.get('legal_area', '').strip()
        if legal_area:
            qs = qs.filter(legal_areas__contains=[legal_area])

        serializer = BookListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        if not can_create_book(caller_role):
            return Response({'error': 'only lawyers may publish to the library'}, status=403)

        data = request.data.copy()
        # Set author from JWT — not from request body
        data['author_id'] = caller_id
        # If tier is firm, require firm_id
        tier = data.get('tier', Book.TIER_GENERAL)
        if tier == Book.TIER_FIRM:
            firm_id = data.get('firm_id') or caller_firm_id
            if not firm_id:
                return Response({'error': 'firm_id is required for firm-tier books'}, status=400)
            data['firm_id'] = firm_id

        serializer = BookDetailSerializer(data=data)
        if serializer.is_valid():
            book = serializer.save()
            return Response(BookDetailSerializer(book).data, status=201)
        return Response(serializer.errors, status=400)


class BookDetailView(APIView):
    def _get_book(self, pk, caller_id, caller_role, caller_firm_id):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return None, Response({'error': 'not found'}, status=404)
        if not can_view_book(book, caller_id, caller_role, caller_firm_id):
            return None, Response({'error': 'forbidden'}, status=403)
        return book, None

    def get(self, request, pk):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        book, err = self._get_book(pk, caller_id, caller_role, caller_firm_id)
        if err:
            return err
        return Response(BookDetailSerializer(book).data)

    def put(self, request, pk):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        book, err = self._get_book(pk, caller_id, caller_role, caller_firm_id)
        if err:
            return err
        if not can_edit_book(book, caller_id, caller_role):
            return Response({'error': 'only the author may edit a draft'}, status=403)
        serializer = BookDetailSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def patch(self, request, pk):
        return self.put(request, pk)


class BookSubmitView(APIView):
    def post(self, request, pk):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        if not can_submit_book(book, caller_id):
            return Response({'error': 'only the author may submit a draft for review'}, status=403)
        book.status = Book.STATUS_UNDER_REVIEW
        book.submitted_at = timezone.now()
        book.save(update_fields=['status', 'submitted_at'])
        return Response(BookDetailSerializer(book).data)


class BookPublishView(APIView):
    def post(self, request, pk):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        if book.status != Book.STATUS_UNDER_REVIEW:
            return Response({'error': 'book must be under review to publish'}, status=400)
        if not can_review_book(book, caller_role, caller_firm_id):
            return Response({'error': 'insufficient permissions to publish'}, status=403)

        now = timezone.now()
        book.status = Book.STATUS_PUBLISHED
        book.published_at = now
        book.reviewed_by_id = caller_id
        book.reviewed_at = now
        book.version_number += 1
        book.save()

        # Snapshot for citation stability
        BookVersion.objects.create(
            book=book,
            version_number=book.version_number,
            content=book.content,
            change_summary=request.data.get('change_summary', ''),
            created_by_id=caller_id,
        )

        return Response(BookDetailSerializer(book).data)


class BookRejectView(APIView):
    def post(self, request, pk):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        if book.status != Book.STATUS_UNDER_REVIEW:
            return Response({'error': 'book must be under review to reject'}, status=400)
        if not can_review_book(book, caller_role, caller_firm_id):
            return Response({'error': 'insufficient permissions to reject'}, status=403)

        reason = request.data.get('reason', '').strip()
        now = timezone.now()
        book.status = Book.STATUS_REJECTED
        book.rejection_reason = reason
        book.reviewed_by_id = caller_id
        book.reviewed_at = now
        book.save(update_fields=['status', 'rejection_reason', 'reviewed_by_id', 'reviewed_at'])

        return Response(BookDetailSerializer(book).data)


class BookVersionListView(APIView):
    def get(self, request, pk):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        if not can_view_book(book, caller_id, caller_role, caller_firm_id):
            return Response({'error': 'forbidden'}, status=403)
        versions = book.versions.all()
        return Response(BookVersionSerializer(versions, many=True).data)


class MyBooksView(APIView):
    def get(self, request):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        qs = Book.objects.filter(author_id=caller_id)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = BookListSerializer(qs, many=True)
        return Response(serializer.data)


class ReviewQueueView(APIView):
    def get(self, request):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        if caller_role == 'admin':
            qs = Book.objects.filter(status=Book.STATUS_UNDER_REVIEW)
        elif caller_role in ('partner', 'firm_admin', 'owner') and caller_firm_id:
            qs = Book.objects.filter(
                status=Book.STATUS_UNDER_REVIEW,
                tier=Book.TIER_FIRM,
                firm_id=caller_firm_id,
            )
        else:
            return Response({'error': 'insufficient permissions'}, status=403)
        serializer = BookListSerializer(qs, many=True)
        return Response(serializer.data)


class CategoryListView(APIView):
    permission_classes = []  # public endpoint

    def get(self, request):
        from rest_framework.permissions import AllowAny
        categories = Category.objects.all()
        return Response(CategorySerializer(categories, many=True).data)
