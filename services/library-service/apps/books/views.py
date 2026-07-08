from django.utils import timezone
from django.db.models import F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Book, BookVersion, Category, Article
from .serializers import (
    BookListSerializer, BookDetailSerializer, BookVersionSerializer, CategorySerializer,
    ArticleListSerializer, ArticleDetailSerializer,
)
from .permissions import (
    get_caller, can_create_book, can_view_book,
    can_edit_book, can_submit_book, can_review_book,
)


class BookListCreateView(APIView):
    permission_classes = []  # GET is public; POST self-enforces via can_create_book

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
    permission_classes = []  # access enforced by can_view_book

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
    permission_classes = []  # access enforced by can_view_book

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


# ── Articles ──────────────────────────────────────────────────────────────────

class ArticleListCreateView(APIView):
    permission_classes = []  # GET public; POST self-enforces

    def get(self, request):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        from django.db.models import Q

        qs = Article.objects.filter(status='published')
        tier = request.query_params.get('tier')
        if tier == 'firm':
            if not caller_firm_id:
                return Response({'error': 'firm_id required'}, status=400)
            qs = qs.filter(tier='firm', firm_id=caller_firm_id)
        elif tier == 'general':
            qs = qs.filter(tier='general')
        else:
            q = Q(tier='general')
            if caller_firm_id:
                q |= Q(tier='firm', firm_id=caller_firm_id)
            qs = qs.filter(q)

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(summary__icontains=search) | Q(author_name__icontains=search))

        article_type = request.query_params.get('type', '').strip()
        if article_type:
            qs = qs.filter(article_type=article_type)

        legal_area = request.query_params.get('legal_area', '').strip()
        if legal_area:
            qs = qs.filter(legal_areas__contains=legal_area)

        return Response(ArticleListSerializer(qs, many=True).data)

    def post(self, request):
        caller_id, caller_role, caller_firm_id = get_caller(request)
        if not caller_id:
            return Response({'error': 'Authentication required'}, status=401)
        if caller_role not in ('lawyer', 'associate', 'partner', 'firm_admin', 'owner', 'admin'):
            return Response({'error': 'Only lawyers can publish articles'}, status=403)

        data = request.data.copy()
        data['author_id'] = caller_id
        if 'author_name' not in data or not data['author_name']:
            data['author_name'] = getattr(request, 'auth_payload', {}).get('full_name', '')

        ser = ArticleDetailSerializer(data=data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        article = ser.save()
        if article.status == 'published':
            article.published_at = timezone.now()
            article.save(update_fields=['published_at'])

        return Response(ArticleDetailSerializer(article).data, status=201)


class ArticleDetailView(APIView):
    permission_classes = []

    def _get_article(self, pk):
        try:
            return Article.objects.get(pk=pk)
        except Article.DoesNotExist:
            return None

    def get(self, request, pk):
        article = self._get_article(pk)
        if not article:
            return Response({'error': 'Not found'}, status=404)
        caller_id, _, caller_firm_id = get_caller(request)
        if article.status != 'published':
            if str(article.author_id) != caller_id:
                return Response({'error': 'Not found'}, status=404)
        if article.tier == 'firm' and str(article.firm_id) != str(caller_firm_id):
            if article.status == 'published' and not caller_id:
                return Response({'error': 'Access denied'}, status=403)
        # Increment view count (non-author reads of published articles)
        if article.status == 'published' and str(article.author_id) != caller_id:
            Article.objects.filter(pk=pk).update(views=article.views + 1)
        return Response(ArticleDetailSerializer(article).data)

    def put(self, request, pk):
        article = self._get_article(pk)
        if not article:
            return Response({'error': 'Not found'}, status=404)
        caller_id, caller_role, _ = get_caller(request)
        if str(article.author_id) != caller_id and caller_role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        ser = ArticleDetailSerializer(article, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        updated = ser.save()
        if updated.status == 'published' and not updated.published_at:
            updated.published_at = timezone.now()
            updated.save(update_fields=['published_at'])
        return Response(ArticleDetailSerializer(updated).data)

    def delete(self, request, pk):
        article = self._get_article(pk)
        if not article:
            return Response({'error': 'Not found'}, status=404)
        caller_id, caller_role, _ = get_caller(request)
        if str(article.author_id) != caller_id and caller_role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        article.delete()
        return Response(status=204)


class MyArticlesView(APIView):
    def get(self, request):
        caller_id, _, _ = get_caller(request)
        if not caller_id:
            return Response({'error': 'Authentication required'}, status=401)
        qs = Article.objects.filter(author_id=caller_id)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(ArticleListSerializer(qs, many=True).data)


class BookIncrementViewView(APIView):
    """Atomically increment a book's view counter. Public; skips if caller is the author."""
    permission_classes = []

    def post(self, request, pk):
        try:
            book = Book.objects.get(pk=pk, status=Book.STATUS_PUBLISHED)
        except Book.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        caller_id, _, _ = get_caller(request)
        if caller_id and str(book.author_id) == caller_id:
            return Response(status=204)
        Book.objects.filter(pk=pk).update(views=F('views') + 1)
        return Response(status=204)


class FirmBooksView(APIView):
    """All published books authored by lawyers in a given firm (both tiers)."""
    permission_classes = []

    def get(self, request, firm_id):
        qs = Book.objects.filter(status=Book.STATUS_PUBLISHED, firm_id=firm_id)
        return Response(BookListSerializer(qs, many=True).data)


class FeaturedBooksView(APIView):
    """Published books marked as featured for editorial homepage sections."""
    permission_classes = []

    def get(self, request):
        qs = Book.objects.filter(status=Book.STATUS_PUBLISHED, is_featured=True).order_by('-published_at')[:8]
        return Response(BookListSerializer(qs, many=True).data)
