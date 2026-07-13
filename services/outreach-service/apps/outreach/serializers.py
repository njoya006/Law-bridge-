from rest_framework import serializers
from .models import OutreachFirm, Interview, Contact, Task, FeatureRequest


class FirmSerializer(serializers.ModelSerializer):
    firmName = serializers.CharField(source='firm_name')
    practiceAreas = serializers.JSONField(source='practice_areas')
    firmSize = serializers.CharField(source='firm_size', allow_blank=True, required=False)
    assignedTo = serializers.CharField(source='assigned_to', allow_blank=True, required=False)
    lastContact = serializers.DateField(source='last_contact', allow_null=True, required=False)
    nextFollowup = serializers.DateField(source='next_followup', allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = OutreachFirm
        fields = [
            'id', 'firmName', 'city', 'country', 'address', 'website', 'phone', 'email',
            'practiceAreas', 'firmSize', 'status', 'source', 'tags', 'assignedTo',
            'lastContact', 'nextFollowup', 'notes', 'createdAt', 'updatedAt',
        ]

    def create(self, validated_data):
        return OutreachFirm.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class InterviewSerializer(serializers.ModelSerializer):
    firmId = serializers.UUIDField(source='firm_id')
    firmName = serializers.CharField(source='firm_name')
    contactName = serializers.CharField(source='contact_name', allow_blank=True, required=False)
    interviewerName = serializers.CharField(source='interviewer_name', allow_blank=True, required=False)
    nextSteps = serializers.JSONField(source='next_steps', required=False)
    overallInterestLevel = serializers.IntegerField(source='overall_interest_level', allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'firmId', 'firmName', 'contactName', 'date', 'time', 'duration',
            'type', 'location', 'status', 'interviewerName', 'summary', 'takeaways',
            'nextSteps', 'overallInterestLevel', 'notes', 'createdAt',
        ]

    def create(self, validated_data):
        return Interview.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ContactSerializer(serializers.ModelSerializer):
    firmId = serializers.UUIDField(source='firm_id')
    firmName = serializers.CharField(source='firm_name')
    isPrimary = serializers.BooleanField(source='is_primary', required=False)

    class Meta:
        model = Contact
        fields = ['id', 'firmId', 'firmName', 'name', 'position', 'email', 'phone', 'whatsapp', 'linkedin', 'isPrimary']

    def create(self, validated_data):
        return Contact.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class TaskSerializer(serializers.ModelSerializer):
    firmId = serializers.UUIDField(source='firm_id', allow_null=True, required=False)
    firmName = serializers.CharField(source='firm_name', allow_blank=True, required=False)
    assignedTo = serializers.CharField(source='assigned_to', allow_blank=True, required=False)
    dueDate = serializers.DateField(source='due_date', allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'assignedTo', 'firmId', 'firmName', 'dueDate', 'status', 'priority', 'notes', 'createdAt']

    def create(self, validated_data):
        return Task.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class FeatureRequestSerializer(serializers.ModelSerializer):
    requestedBy = serializers.CharField(source='requested_by', allow_blank=True, required=False)
    firmId = serializers.UUIDField(source='firm_id', allow_null=True, required=False)
    firmName = serializers.CharField(source='firm_name', allow_blank=True, required=False)
    requestedOn = serializers.DateField(source='requested_on')
    interviewId = serializers.UUIDField(source='interview_id', allow_null=True, required=False)

    class Meta:
        model = FeatureRequest
        fields = ['id', 'title', 'requestedBy', 'firmId', 'firmName', 'priority', 'status', 'source', 'description', 'requestedOn', 'interviewId']

    def create(self, validated_data):
        return FeatureRequest.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
