from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .serializers import UserSerializer, NoteSerializer
from .services import list_notes_for_user, create_note_for_user, delete_note_for_user
from django.contrib.auth.models import User

class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_notes_for_user(self.request.user)

    def perform_create(self, serializer):
        data = serializer.validated_data
        note = create_note_for_user(
            user=self.request.user,
            title=data.get("title"),
            content=data.get("content")
        )
        serializer.instance = note

class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_notes_for_user(self.request.user)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]