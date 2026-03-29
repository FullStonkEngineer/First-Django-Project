from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User

from .serializers import UserSerializer, NoteSerializer, TagSerializer
from .selectors import search_notes_for_user, get_tags_for_user
from .services import create_note_for_user, update_note_for_user, delete_note_for_user


class NotePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# ── Note views ────────────────────────────────────────────────────────────────

class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotePagination

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        raw_tags = self.request.query_params.get('tags', '').strip()
        tag_list = [t.strip() for t in raw_tags.split(',') if t.strip()] if raw_tags else []
        return search_notes_for_user(self.request.user, search=search, tags=tag_list)

    def perform_create(self, serializer):
        tag_names = serializer.validated_data.pop('tag_names', [])
        note = create_note_for_user(
            user=self.request.user,
            tag_names=tag_names,
            **serializer.validated_data,
        )
        serializer.instance = note


class NoteUpdate(generics.UpdateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return search_notes_for_user(self.request.user)

    def update(self, request, *args, **kwargs):
        note_id = kwargs.get('pk')
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        tag_names = serializer.validated_data.pop('tag_names', None)
        note = update_note_for_user(
            user=request.user,
            note_id=note_id,
            tag_names=tag_names,
            title=serializer.validated_data.get('title'),
            content=serializer.validated_data.get('content'),
        )
        return Response(NoteSerializer(note).data)


class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        note_id = kwargs.get('pk')
        delete_note_for_user(request.user, note_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Tag views ─────────────────────────────────────────────────────────────────

class TagListView(generics.ListAPIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_tags_for_user(self.request.user)


# ── Auth views ────────────────────────────────────────────────────────────────

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
