import uuid
from django.db import models


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children'
    )

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Book(models.Model):
    TIER_FIRM = 'firm'
    TIER_GENERAL = 'general'
    TIER_CHOICES = [
        (TIER_FIRM, 'Firm Library'),
        (TIER_GENERAL, 'General Library'),
    ]

    STATUS_DRAFT = 'draft'
    STATUS_UNDER_REVIEW = 'under_review'
    STATUS_PUBLISHED = 'published'
    STATUS_REJECTED = 'rejected'
    STATUS_ARCHIVED = 'archived'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_UNDER_REVIEW, 'Under Review'),
        (STATUS_PUBLISHED, 'Published'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    subtitle = models.CharField(max_length=500, blank=True)

    # Author info — denormalized so browse works without cross-service calls
    author_id = models.UUIDField(db_index=True)
    author_name = models.CharField(max_length=200)

    # Firm scoping — null means general tier
    firm_id = models.UUIDField(null=True, blank=True, db_index=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)

    # Content stored as markdown
    abstract = models.TextField(blank=True)
    content = models.TextField()

    # Bibliographic metadata
    year = models.PositiveIntegerField(null=True, blank=True)
    edition = models.PositiveIntegerField(default=1)
    publisher = models.CharField(max_length=300, blank=True, default='')
    pages = models.PositiveIntegerField(null=True, blank=True)
    language = models.CharField(max_length=10, default='en')
    jurisdiction = models.CharField(max_length=100, default='Cameroon')
    legal_areas = models.JSONField(default=list)
    categories = models.ManyToManyField(Category, blank=True)

    # Version counter — incremented on each publish
    version_number = models.PositiveIntegerField(default=1)

    # Review workflow timestamps and attribution
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by_id = models.UUIDField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['tier', 'status']),
            models.Index(fields=['author_id']),
            models.Index(fields=['firm_id', 'status']),
        ]
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title


class BookVersion(models.Model):
    """Immutable content snapshot — never updated, only appended. Enables stable citations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    content = models.TextField()
    change_summary = models.TextField(blank=True)
    created_by_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('book', 'version_number')]
        ordering = ['-version_number']

    def __str__(self):
        return f'{self.book.title} v{self.version_number}'
