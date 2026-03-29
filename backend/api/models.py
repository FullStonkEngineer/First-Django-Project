from django.db import models
from django.contrib.auth.models import User


class Tag(models.Model):
    name = models.CharField(max_length=50)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')

    class Meta:
        unique_together = ('name', 'author')
        ordering = ['name']

    def __str__(self):
        return self.name


class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    tags = models.ManyToManyField(Tag, blank=True, related_name='notes')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
