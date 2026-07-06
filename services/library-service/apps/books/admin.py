from django.contrib import admin
from .models import Book, BookVersion, Category

admin.site.register(Category)
admin.site.register(BookVersion)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author_name', 'tier', 'status', 'published_at', 'created_at']
    list_filter = ['tier', 'status', 'language', 'jurisdiction']
    search_fields = ['title', 'author_name', 'abstract']
    readonly_fields = ['id', 'created_at', 'updated_at']
