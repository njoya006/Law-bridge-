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

    # Engagement — view counter, mirrors Article.views
    views = models.PositiveIntegerField(default=0)

    # Editorial curation — admin marks books as featured for homepage showcase
    is_featured = models.BooleanField(default=False, db_index=True)

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


class Article(models.Model):
    """Short-form legal content: case summaries, legal alerts, analysis, commentary.
    Unlike Book, lawyers publish directly — no review workflow required."""

    TYPE_CHOICES = [
        ('case_summary', 'Case Summary'),
        ('legal_alert', 'Legal Alert'),
        ('analysis', 'Analysis'),
        ('commentary', 'Commentary'),
        ('explainer', 'Explainer'),
        ('news', 'Legal News'),
    ]
    TIER_CHOICES = [
        ('general', 'General'),
        ('firm', 'Firm'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True)
    content = models.TextField()
    article_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='analysis')
    author_id = models.UUIDField(db_index=True)
    author_name = models.CharField(max_length=200)
    firm_id = models.UUIDField(null=True, blank=True, db_index=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    legal_areas = models.JSONField(default=list)
    jurisdiction = models.CharField(max_length=100, default='Cameroon')
    language = models.CharField(max_length=10, default='en')
    reading_time = models.PositiveSmallIntegerField(default=1, help_text='Minutes')
    views = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'tier']),
            models.Index(fields=['author_id']),
            models.Index(fields=['article_type', 'status']),
        ]

    def save(self, *args, **kwargs):
        # Auto-compute reading time (~200 words/minute)
        if self.content:
            words = len(self.content.split())
            self.reading_time = max(1, round(words / 200))
        super().save(*args, **kwargs)

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


class CLECredit(models.Model):
    """Continuing Legal Education credit earned by a lawyer. Turns library
    consumption + authorship into a tracked professional-development record —
    the sector has no real CLE infrastructure, so this fills a genuine gap."""

    CATEGORY = [
        ('reading',     'Library Reading'),
        ('authorship',  'Published Authorship'),
        ('article',     'Published Article'),
        ('contribution','Peer Contribution'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lawyer_id = models.UUIDField(db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY)
    credits = models.PositiveSmallIntegerField(default=1)
    title = models.CharField(max_length=500)
    reference_id = models.CharField(max_length=64, blank=True, default='')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-earned_at']
        indexes = [models.Index(fields=['lawyer_id', 'earned_at'])]


class BookCompletion(models.Model):
    """Records that a lawyer marked a book as read (once), granting reading CLE."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lawyer_id = models.UUIDField(db_index=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='completions')
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('lawyer_id', 'book')]
