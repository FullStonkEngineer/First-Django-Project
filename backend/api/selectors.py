from .models import Note

def get_user_note_by_id(user, note_id):
    return Note.objects.filter(author=user, id=note_id).first()