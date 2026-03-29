from .models import Note, Tag
from rest_framework.exceptions import NotFound


def _resolve_tags(user, tag_names):
    """
    Given a list of tag name strings, get-or-create Tag objects owned by `user`.
    Names are normalised to lowercase and stripped.
    """
    tags = []
    for raw in tag_names:
        name = raw.strip().lower()
        if name:
            tag, _ = Tag.objects.get_or_create(name=name, author=user)
            tags.append(tag)
    return tags



def _broadcast(user_id, action, note_id=None):
    """
    Push a lightweight event to all WebSocket clients subscribed to this user's
    notes group.  Silently no-ops if Channels / the channel layer isn't configured.
    """
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        async_to_sync(channel_layer.group_send)(
            f'notes_user_{user_id}',
            {
                'type': 'note.event',          # → NoteConsumer.note_event()
                'data': {'action': action, 'note_id': note_id},
            },
        )
    except Exception:
        pass



def list_notes_for_user(user):
    return Note.objects.filter(author=user)


def create_note_for_user(user, title, content, tag_names=None):
    note = Note.objects.create(author=user, title=title, content=content)
    if tag_names:
        note.tags.set(_resolve_tags(user, tag_names))
    _broadcast(user.id, 'created', note.id)
    return note


def update_note_for_user(user, note_id, title=None, content=None, tag_names=None):
    note = Note.objects.filter(author=user, id=note_id).first()
    if not note:
        raise NotFound({'detail': 'Note not found or not authorized.'})

    if title is not None:
        note.title = title
    if content is not None:
        note.content = content
    note.save()

    if tag_names is not None:
        note.tags.set(_resolve_tags(user, tag_names))

    _broadcast(user.id, 'updated', note.id)
    return note


def delete_note_for_user(user, note_id):
    note = Note.objects.filter(author=user, id=note_id).first()
    if not note:
        raise NotFound({'detail': 'Note not found or not authorized.'})
    note.delete()
    _broadcast(user.id, 'deleted', note_id)
    return True
