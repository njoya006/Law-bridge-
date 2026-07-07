from django.urls import path
from . import views

urlpatterns = [
    path('books/', views.BookListCreateView.as_view()),
    path('books/<uuid:pk>/', views.BookDetailView.as_view()),
    path('books/<uuid:pk>/submit/', views.BookSubmitView.as_view()),
    path('books/<uuid:pk>/publish/', views.BookPublishView.as_view()),
    path('books/<uuid:pk>/reject/', views.BookRejectView.as_view()),
    path('books/<uuid:pk>/versions/', views.BookVersionListView.as_view()),
    path('my-books/', views.MyBooksView.as_view()),
    path('review-queue/', views.ReviewQueueView.as_view()),
    path('categories/', views.CategoryListView.as_view()),
    # Articles
    path('articles/', views.ArticleListCreateView.as_view()),
    path('articles/<uuid:pk>/', views.ArticleDetailView.as_view()),
    path('my-articles/', views.MyArticlesView.as_view()),
]
