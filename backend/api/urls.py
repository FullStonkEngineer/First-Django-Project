from django.urls import path
from . import views

urlpatterns = [
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    path('notes/<int:pk>/', views.NoteDelete.as_view(), name='note-delete'),
    path('notes/<int:pk>/update/', views.NoteUpdate.as_view(), name='note-update'),
    path('tags/', views.TagListView.as_view(), name='tag-list'),
]
