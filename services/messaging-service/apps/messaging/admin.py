from django.contrib import admin
from .models import Thread, ThreadParticipant, Message, MessageReaction

admin.site.register(Thread)
admin.site.register(ThreadParticipant)
admin.site.register(Message)
admin.site.register(MessageReaction)
