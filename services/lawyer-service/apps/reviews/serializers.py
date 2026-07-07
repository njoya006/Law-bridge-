from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('id', 'client_id', 'client_name', 'case_id', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'client_id', 'client_name', 'created_at')


class ReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('case_id', 'rating', 'comment')
