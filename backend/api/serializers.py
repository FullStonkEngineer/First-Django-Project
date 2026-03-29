from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note, Tag


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content',
            'created_at', 'updated_at',
            'author', 'tags', 'tag_names',
        ]
        extra_kwargs = {'author': {'read_only': True}}
