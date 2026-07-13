from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import OutreachFirm, Interview, Contact, Task, FeatureRequest
from .serializers import FirmSerializer, InterviewSerializer, ContactSerializer, TaskSerializer, FeatureRequestSerializer
from .permissions import IsAdminOrSupport


class FirmViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSupport]
    serializer_class = FirmSerializer
    queryset = OutreachFirm.objects.all()

    def get_queryset(self):
        qs = OutreachFirm.objects.all()
        status = self.request.query_params.get('status')
        city = self.request.query_params.get('city')
        if status:
            qs = qs.filter(status=status)
        if city:
            qs = qs.filter(city=city)
        return qs

    @action(detail=True, methods=['get'])
    def interviews(self, request, pk=None):
        firm = self.get_object()
        serializer = InterviewSerializer(firm.interviews.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        firm = self.get_object()
        serializer = ContactSerializer(firm.contacts.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        firm = self.get_object()
        serializer = TaskSerializer(firm.tasks.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def feature_requests(self, request, pk=None):
        firm = self.get_object()
        serializer = FeatureRequestSerializer(firm.feature_requests.all(), many=True)
        return Response(serializer.data)


class InterviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSupport]
    serializer_class = InterviewSerializer
    queryset = Interview.objects.all()

    def get_queryset(self):
        qs = Interview.objects.all()
        firm_id = self.request.query_params.get('firmId')
        interview_status = self.request.query_params.get('status')
        if firm_id:
            qs = qs.filter(firm_id=firm_id)
        if interview_status:
            qs = qs.filter(status=interview_status)
        return qs


class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSupport]
    serializer_class = ContactSerializer
    queryset = Contact.objects.all()

    def get_queryset(self):
        qs = Contact.objects.all()
        firm_id = self.request.query_params.get('firmId')
        if firm_id:
            qs = qs.filter(firm_id=firm_id)
        return qs


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSupport]
    serializer_class = TaskSerializer
    queryset = Task.objects.all()

    def get_queryset(self):
        qs = Task.objects.all()
        firm_id = self.request.query_params.get('firmId')
        task_status = self.request.query_params.get('status')
        if firm_id:
            qs = qs.filter(firm_id=firm_id)
        if task_status:
            qs = qs.filter(status=task_status)
        return qs


class FeatureRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSupport]
    serializer_class = FeatureRequestSerializer
    queryset = FeatureRequest.objects.all()

    def get_queryset(self):
        qs = FeatureRequest.objects.all()
        firm_id = self.request.query_params.get('firmId')
        fr_status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        if firm_id:
            qs = qs.filter(firm_id=firm_id)
        if fr_status:
            qs = qs.filter(status=fr_status)
        if priority:
            qs = qs.filter(priority=priority)
        return qs
