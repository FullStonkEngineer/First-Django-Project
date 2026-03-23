from .models import Note
from django.contrib.auth.models import User
from rest_framework import serializers

def list_notes_for_user(user):
    return Note.objects.filter(author=user)

def create_note_for_user(user, title, content):
    return Note.objects.create(author=user, title=title, content=content)

def delete_note_for_user(user, note_id):
    note = Note.objects.filter(author=user, id=note_id).first()
    if not note:
        raise serializers.ValidationError({"detail": "Note not found or not authorized"})
    note.delete()
    return True