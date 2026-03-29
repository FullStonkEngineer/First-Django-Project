from django.db.models import Q
from .models import Note, Tag


def get_user_note_by_id(user, note_id):
    return Note.objects.filter(author=user, id=note_id).first()


def search_notes_for_user(user, search='', tags=None):
    """
    Returns a queryset of notes for `user`, optionally filtered by:
      - search: case-insensitive substring match on title OR content
      - tags:   list of tag name strings; notes must have at least one matching tag
    """
    qs = Note.objects.filter(author=user)

    if search:
        qs = qs.filter(
            Q(title__icontains=search) | Q(content__icontains=search)
        )

    if tags:
        qs = qs.filter(tags__name__in=tags).distinct()

    return qs


def get_tags_for_user(user):
    return Tag.objects.filter(author=user)
