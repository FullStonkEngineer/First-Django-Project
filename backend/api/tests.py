from django.test import TestCase
from django.contrib.auth.models import User
from .models import Note
from .services import create_note_for_user, list_notes_for_user, delete_note_for_user
from rest_framework import serializers

class NoteServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password123")

    def test_create_note_for_user(self):
        note = create_note_for_user(self.user, "Test Title", "Test Content")
        self.assertIsInstance(note, Note)
        self.assertEqual(note.title, "Test Title")
        self.assertEqual(note.content, "Test Content")
        self.assertEqual(note.author, self.user)

    def test_list_notes_for_user(self):

        notes = list_notes_for_user(self.user)
        self.assertEqual(len(notes), 0)
        create_note_for_user(self.user, "Title 1", "Content 1")
        notes = list_notes_for_user(self.user)
        self.assertEqual(len(notes), 1)

    def test_delete_note_for_user_success(self):
        note = create_note_for_user(self.user, "Title 2", "Content 2")
        result = delete_note_for_user(self.user, note.id)
        self.assertTrue(result)
        self.assertEqual(list_notes_for_user(self.user).count(), 0)

    def test_delete_note_for_user_not_found(self):
        with self.assertRaises(serializers.ValidationError):
            delete_note_for_user(self.user, 999)