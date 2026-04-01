#!/usr/bin/env bash

pip install -r requirements.txt

cd backend
python manage.py collectstatic --no-input