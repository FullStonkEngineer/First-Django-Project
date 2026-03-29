from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import User
from rest_framework.exceptions import NotFound
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import AccessToken

from .models import Note, Tag
from .services import create_note_for_user, list_notes_for_user, update_note_for_user, delete_note_for_user
from .selectors import search_notes_for_user, get_tags_for_user


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Service layer tests
# ═══════════════════════════════════════════════════════════════════════════════

class NoteServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.other_user = User.objects.create_user(username='otheruser', password='password123')

    # ── Create ────────────────────────────────────────────────────────────────

    def test_create_note_basic(self):
        note = create_note_for_user(self.user, 'Test Title', 'Test Content')
        self.assertIsInstance(note, Note)
        self.assertEqual(note.title, 'Test Title')
        self.assertEqual(note.content, 'Test Content')
        self.assertEqual(note.author, self.user)

    def test_create_note_with_tags(self):
        note = create_note_for_user(self.user, 'Tagged', 'Content', tag_names=['python', 'django'])
        tag_names = list(note.tags.values_list('name', flat=True))
        self.assertIn('python', tag_names)
        self.assertIn('django', tag_names)

    def test_create_note_tags_are_lowercased(self):
        note = create_note_for_user(self.user, 'T', 'C', tag_names=['Python', '  DJANGO  '])
        tag_names = list(note.tags.values_list('name', flat=True))
        self.assertIn('python', tag_names)
        self.assertIn('django', tag_names)

    def test_create_note_tags_are_user_scoped(self):
        """Tags created for one user are not shared with another."""
        create_note_for_user(self.user, 'T', 'C', tag_names=['shared-name'])
        other_note = create_note_for_user(self.other_user, 'T2', 'C2', tag_names=['shared-name'])
        user_tag = Tag.objects.get(name='shared-name', author=self.user)
        other_tag = Tag.objects.get(name='shared-name', author=self.other_user)
        self.assertNotEqual(user_tag.id, other_tag.id)

    # ── List ──────────────────────────────────────────────────────────────────

    def test_list_notes_empty(self):
        self.assertEqual(len(list_notes_for_user(self.user)), 0)

    def test_list_notes_returns_only_own_notes(self):
        create_note_for_user(self.user, 'Mine', 'C')
        create_note_for_user(self.other_user, 'Theirs', 'C')
        notes = list_notes_for_user(self.user)
        self.assertEqual(notes.count(), 1)
        self.assertEqual(notes.first().title, 'Mine')

    def test_notes_ordered_newest_first(self):
        create_note_for_user(self.user, 'First', 'C')
        create_note_for_user(self.user, 'Second', 'C')
        create_note_for_user(self.user, 'Third', 'C')
        titles = list(list_notes_for_user(self.user).values_list('title', flat=True))
        self.assertEqual(titles, ['Third', 'Second', 'First'])

    # ── Update ────────────────────────────────────────────────────────────────

    def test_update_note_title(self):
        note = create_note_for_user(self.user, 'Old', 'Content')
        updated = update_note_for_user(self.user, note.id, title='New')
        self.assertEqual(updated.title, 'New')
        self.assertEqual(updated.content, 'Content')

    def test_update_note_content(self):
        note = create_note_for_user(self.user, 'Title', 'Old')
        updated = update_note_for_user(self.user, note.id, content='New')
        self.assertEqual(updated.content, 'New')
        self.assertEqual(updated.title, 'Title')

    def test_update_note_replaces_tags(self):
        note = create_note_for_user(self.user, 'T', 'C', tag_names=['old-tag'])
        update_note_for_user(self.user, note.id, tag_names=['new-tag'])
        tag_names = list(note.tags.values_list('name', flat=True))
        self.assertNotIn('old-tag', tag_names)
        self.assertIn('new-tag', tag_names)

    def test_update_note_not_found_raises_404(self):
        with self.assertRaises(NotFound):
            update_note_for_user(self.user, 999, title='X')

    def test_update_note_wrong_user_raises_404(self):
        note = create_note_for_user(self.other_user, 'Theirs', 'C')
        with self.assertRaises(NotFound):
            update_note_for_user(self.user, note.id, title='Hijacked')

    # ── Delete ────────────────────────────────────────────────────────────────

    def test_delete_note_success(self):
        note = create_note_for_user(self.user, 'T', 'C')
        self.assertTrue(delete_note_for_user(self.user, note.id))
        self.assertEqual(list_notes_for_user(self.user).count(), 0)

    def test_delete_note_not_found_raises_404(self):
        with self.assertRaises(NotFound):
            delete_note_for_user(self.user, 999)

    def test_delete_note_wrong_user_raises_404(self):
        note = create_note_for_user(self.other_user, 'Theirs', 'C')
        with self.assertRaises(NotFound):
            delete_note_for_user(self.user, note.id)


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Selector / search tests
# ═══════════════════════════════════════════════════════════════════════════════

class NoteSearchTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='searcher', password='password123')
        self.note_a = create_note_for_user(self.user, 'Django tips', 'ORM is great', tag_names=['django', 'backend'])
        self.note_b = create_note_for_user(self.user, 'React hooks', 'useState is fun', tag_names=['react', 'frontend'])
        self.note_c = create_note_for_user(self.user, 'Python basics', 'Learn the ORM', tag_names=['python', 'backend'])

    def test_search_by_title(self):
        results = search_notes_for_user(self.user, search='react')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().title, 'React hooks')

    def test_search_by_content(self):
        results = search_notes_for_user(self.user, search='ORM')
        self.assertEqual(results.count(), 2)

    def test_search_is_case_insensitive(self):
        results = search_notes_for_user(self.user, search='DJANGO')
        self.assertEqual(results.count(), 1)

    def test_filter_by_single_tag(self):
        results = search_notes_for_user(self.user, tags=['backend'])
        self.assertEqual(results.count(), 2)

    def test_filter_by_multiple_tags_uses_or_semantics(self):
        results = search_notes_for_user(self.user, tags=['django', 'react'])
        self.assertEqual(results.count(), 2)

    def test_search_and_tag_combined(self):
        results = search_notes_for_user(self.user, search='ORM', tags=['django'])
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().title, 'Django tips')

    def test_no_filters_returns_all(self):
        results = search_notes_for_user(self.user)
        self.assertEqual(results.count(), 3)

    def test_get_tags_for_user(self):
        tags = get_tags_for_user(self.user)
        names = set(tags.values_list('name', flat=True))
        self.assertEqual(names, {'django', 'backend', 'react', 'frontend', 'python'})


# ═══════════════════════════════════════════════════════════════════════════════
# 3. API view tests
# ═══════════════════════════════════════════════════════════════════════════════

class NoteAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='apiuser', password='password123')
        self.other_user = User.objects.create_user(username='other', password='password123')
        self.client = APIClient()
        token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def _create(self, title='T', content='C', tag_names=None):
        data = {'title': title, 'content': content}
        if tag_names:
            data['tag_names'] = tag_names
        return self.client.post('/api/notes/', data, format='json')

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_unauthenticated_request_returns_401(self):
        anon = APIClient()
        res = anon.get('/api/notes/')
        self.assertEqual(res.status_code, 401)

    # ── Create ────────────────────────────────────────────────────────────────

    def test_create_note_returns_201(self):
        res = self._create('Hello', 'World')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['title'], 'Hello')

    def test_create_note_with_tags(self):
        res = self._create('Tagged', 'Body', tag_names=['python', 'django'])
        self.assertEqual(res.status_code, 201)
        returned_names = [t['name'] for t in res.data['tags']]
        self.assertIn('python', returned_names)
        self.assertIn('django', returned_names)

    def test_create_note_sets_author_automatically(self):
        res = self._create()
        self.assertEqual(res.data['author'], self.user.id)

    # ── List ──────────────────────────────────────────────────────────────────

    def test_list_is_paginated(self):
        for i in range(12):
            self._create(f'Note {i}', 'C')
        res = self.client.get('/api/notes/')
        self.assertIn('results', res.data)
        self.assertIn('count', res.data)
        self.assertEqual(len(res.data['results']), 10)

    def test_list_excludes_other_users_notes(self):
        create_note_for_user(self.other_user, 'Theirs', 'C')
        self._create('Mine', 'C')
        res = self.client.get('/api/notes/')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'Mine')

    def test_search_by_title(self):
        self._create('Django ORM', 'C')
        self._create('React hooks', 'C')
        res = self.client.get('/api/notes/?search=django')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'Django ORM')

    def test_filter_by_tag(self):
        self._create('N1', 'C', tag_names=['python'])
        self._create('N2', 'C', tag_names=['javascript'])
        res = self.client.get('/api/notes/?tags=python')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'N1')

    # ── Update ────────────────────────────────────────────────────────────────

    def test_update_note(self):
        note = create_note_for_user(self.user, 'Old', 'C')
        res = self.client.patch(f'/api/notes/{note.id}/update/', {'title': 'New'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['title'], 'New')

    def test_update_other_users_note_returns_404(self):
        note = create_note_for_user(self.other_user, 'Theirs', 'C')
        res = self.client.patch(f'/api/notes/{note.id}/update/', {'title': 'Hijacked'}, format='json')
        self.assertEqual(res.status_code, 404)

    # ── Delete ────────────────────────────────────────────────────────────────

    def test_delete_note_returns_204(self):
        note = create_note_for_user(self.user, 'T', 'C')
        res = self.client.delete(f'/api/notes/{note.id}/')
        self.assertEqual(res.status_code, 204)

    def test_delete_other_users_note_returns_404(self):
        note = create_note_for_user(self.other_user, 'T', 'C')
        res = self.client.delete(f'/api/notes/{note.id}/')
        self.assertEqual(res.status_code, 404)

    # ── Tags endpoint ─────────────────────────────────────────────────────────

    def test_tags_endpoint_returns_user_tags(self):
        self._create('T', 'C', tag_names=['alpha', 'beta'])
        res = self.client.get('/api/tags/')
        self.assertEqual(res.status_code, 200)
        names = [t['name'] for t in res.data]
        self.assertIn('alpha', names)
        self.assertIn('beta', names)

    def test_tags_endpoint_excludes_other_users_tags(self):
        create_note_for_user(self.other_user, 'T', 'C', tag_names=['secret'])
        res = self.client.get('/api/tags/')
        names = [t['name'] for t in res.data]
        self.assertNotIn('secret', names)


# ═══════════════════════════════════════════════════════════════════════════════
# 4. WebSocket consumer tests
# ═══════════════════════════════════════════════════════════════════════════════

class NoteWebSocketTests(TransactionTestCase):
    """
    TransactionTestCase is required for Channels tests because the async
    consumer runs in a separate thread and needs real DB transactions.
    """

    def setUp(self):
        self.user = User.objects.create_user(username='wsuser', password='password123')

    def _make_communicator(self, token_str):
        from channels.testing import WebsocketCommunicator
        from backend.asgi import application
        return WebsocketCommunicator(application, f'/ws/notes/?token={token_str}')

    def test_valid_token_accepted(self):
        from asgiref.sync import async_to_sync

        async def run():
            token = str(AccessToken.for_user(self.user))
            comm = self._make_communicator(token)
            connected, _ = await comm.connect()
            self.assertTrue(connected)
            await comm.disconnect()

        async_to_sync(run)()

    def test_invalid_token_rejected(self):
        from asgiref.sync import async_to_sync

        async def run():
            comm = self._make_communicator('not-a-valid-token')
            connected, code = await comm.connect()
            self.assertFalse(connected)
            self.assertEqual(code, 4001)

        async_to_sync(run)()

    def test_missing_token_rejected(self):
        from asgiref.sync import async_to_sync
        from channels.testing import WebsocketCommunicator
        from backend.asgi import application

        async def run():
            comm = WebsocketCommunicator(application, '/ws/notes/')
            connected, code = await comm.connect()
            self.assertFalse(connected)
            self.assertEqual(code, 4001)

        async_to_sync(run)()

    def test_note_event_broadcast_received(self):
        """Creating a note via the service layer should push an event to WS clients."""
        from asgiref.sync import async_to_sync
        from asgiref.sync import sync_to_async

        async def run():
            token = str(AccessToken.for_user(self.user))
            comm = self._make_communicator(token)
            connected, _ = await comm.connect()
            self.assertTrue(connected)

            # Trigger a broadcast by creating a note (services._broadcast)
            await sync_to_async(create_note_for_user)(self.user, 'WS Test', 'Body')

            message = await comm.receive_json_from(timeout=3)
            self.assertEqual(message['action'], 'created')
            await comm.disconnect()

        async_to_sync(run)()
