import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class NoteConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        token_str = self._parse_token()

        if not token_str:
            await self.close(code=4001)
            return

        try:
            access_token = AccessToken(token_str)
            user_id = access_token['user_id']
            self.user = await self._get_user(user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            await self.close(code=4001)
            return

        self.group_name = f'notes_user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # This is a server-push–only socket; client messages are ignored.
        pass

    # Called by channel layer when services.py calls group_send with type "note.event"
    async def note_event(self, event):
        await self.send(text_data=json.dumps(event['data']))

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _parse_token(self):
        query_string = self.scope.get('query_string', b'').decode()
        for part in query_string.split('&'):
            if part.startswith('token='):
                return part[6:]
        return None

    @database_sync_to_async
    def _get_user(self, user_id):
        return User.objects.get(id=user_id)
