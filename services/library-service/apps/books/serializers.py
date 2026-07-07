from rest_framework import serializers
from .models import Book, BookVersion, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent']


class BookVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookVersion
        fields = ['id', 'version_number', 'change_summary', 'created_by_id', 'created_at']
        read_only_fields = fields


class BookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for browse/list views."""
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'subtitle', 'author_id', 'author_name',
            'firm_id', 'tier', 'status',
            'abstract', 'year', 'edition', 'publisher', 'pages',
            'language', 'jurisdiction',
            'legal_areas', 'categories', 'version_number',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'version_number', 'published_at', 'created_at', 'updated_at',
        ]


class BookDetailSerializer(serializers.ModelSerializer):
    """Full serializer including content."""
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'subtitle', 'author_id', 'author_name',
            'firm_id', 'tier', 'status',
            'abstract', 'content',
            'year', 'edition', 'publisher', 'pages', 'language', 'jurisdiction',
            'legal_areas', 'categories', 'category_ids', 'version_number',
            'submitted_at', 'reviewed_by_id', 'reviewed_at', 'rejection_reason',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'version_number',
            'submitted_at', 'reviewed_by_id', 'reviewed_at',
            'published_at', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        book = Book.objects.create(**validated_data)
        if category_ids:
            book.categories.set(Category.objects.filter(id__in=category_ids))
        return book

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if category_ids is not None:
            instance.categories.set(Category.objects.filter(id__in=category_ids))
        return instance
