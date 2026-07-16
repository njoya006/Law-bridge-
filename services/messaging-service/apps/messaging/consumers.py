import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Thread, ThreadParticipant, Message, MessageReaction


class ThreadConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.group_name = f'thread_{self.thread_id}'
        self.user_id = self.scope.get('user_id', '')
        self.user_role = self.scope.get('user_role', '')
        self.display_name = self.scope.get('display_name', '')

        if not self.user_id:
            await self.close(code=4001)
            return

        is_participant = await self.check_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send last 50 messages as history
        messages = await self.get_message_history()
        await self.send(text_data=json.dumps({'type': 'history', 'messages': messages}))

        # Broadcast join presence
        await self.channel_layer.group_send(self.group_name, {
            'type': 'presence',
            'event': 'joined',
            'user_id': self.user_id,
            'display_name': self.display_name,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_send(self.group_name, {
                'type': 'presence',
                'event': 'left',
                'user_id': self.user_id,
                'display_name': self.display_name,
            })
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'message':
            content = (data.get('content') or '').strip()
            if not content:
                return
            msg, needs_ai, case_id = await self.save_message(content)
            await self.channel_layer.group_send(self.group_name, {
                'type': 'chat_message',
                'id': msg['id'],
                'content': msg['content'],
                'sender_id': msg['sender_id'],
                'sender_name': msg['sender_name'],
                'sender_role': msg['sender_role'],
                'is_ai': False,
                'is_system': False,
                'created_at': msg['created_at'],
                'reactions': [],
            })
            await self.update_thread_timestamp()

            # Dispatch AI reply in background — does not block the WebSocket
            if needs_ai:
                asyncio.ensure_future(self._dispatch_ai_reply(content, case_id))

        elif msg_type == 'typing':
            await self.channel_layer.group_send(self.group_name, {
                'type': 'typing_event',
                'user_id': self.user_id,
                'display_name': self.display_name,
                'is_typing': data.get('is_typing', True),
            })

        elif msg_type == 'reaction':
            message_id = data.get('message_id')
            emoji = data.get('emoji', '')
            if message_id and emoji:
                result = await self.toggle_reaction(int(message_id), emoji)
                await self.channel_layer.group_send(self.group_name, {
                    'type': 'reaction_event',
                    'message_id': message_id,
                    'emoji': emoji,
                    'user_id': self.user_id,
                    'display_name': self.display_name,
                    'added': result,
                })

        elif msg_type == 'read':
            await self.mark_read()
            await self.channel_layer.group_send(self.group_name, {
                'type': 'read_event',
                'user_id': self.user_id,
                'display_name': self.display_name,
                'read_at': timezone.now().isoformat(),
            })

    # ── AI reply dispatch ─────────────────────────────────────────────────────

    async def _dispatch_ai_reply(self, user_content, case_id):
        """Fetch AI reply in a thread pool, save it, then broadcast to the group."""
        try:
            loop = asyncio.get_event_loop()
            from .views import _generate_ai_content
            ai_content = await loop.run_in_executor(None, _generate_ai_content, user_content, case_id)
            ai_msg = await self.save_ai_message(ai_content)
            await self.channel_layer.group_send(self.group_name, {
                'type': 'chat_message',
                'id': ai_msg['id'],
                'content': ai_msg['content'],
                'sender_id': 'ai',
                'sender_name': 'LawBridge AI',
                'sender_role': 'support',
                'is_ai': True,
                'is_system': False,
                'created_at': ai_msg['created_at'],
                'reactions': [],
            })
        except Exception:
            pass

    # ── Group event handlers ──────────────────────────────────────────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'message', **{k: v for k, v in event.items() if k != 'type'}}))

    async def typing_event(self, event):
        if event['user_id'] != self.user_id:
            await self.send(text_data=json.dumps({'type': 'typing', **{k: v for k, v in event.items() if k != 'type'}}))

    async def reaction_event(self, event):
        await self.send(text_data=json.dumps({'type': 'reaction', **{k: v for k, v in event.items() if k != 'type'}}))

    async def read_event(self, event):
        if event['user_id'] != self.user_id:
            await self.send(text_data=json.dumps({'type': 'read', **{k: v for k, v in event.items() if k != 'type'}}))

    async def presence(self, event):
        await self.send(text_data=json.dumps({'type': 'presence', **{k: v for k, v in event.items() if k != 'type'}}))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def check_participant(self):
        if self.user_role in ('support', 'admin'):
            return Thread.objects.filter(
                id=self.thread_id, thread_type='client_support'
            ).exists()
        return ThreadParticipant.objects.filter(
            thread_id=self.thread_id,
            user_id=self.user_id,
            is_active=True,
        ).exists()

    @database_sync_to_async
    def get_message_history(self):
        msgs = Message.objects.filter(
            thread_id=self.thread_id,
            is_deleted=False,
        ).prefetch_related('reactions').order_by('-created_at')[:50]
        result = []
        for m in reversed(list(msgs)):
            result.append({
                'id': m.id,
                'content': m.content,
                'sender_id': m.sender_id,
                'sender_name': m.sender_name,
                'sender_role': m.sender_role,
                'is_ai': m.is_ai,
                'is_system': m.is_system,
                'created_at': m.created_at.isoformat(),
                'reactions': [
                    {'emoji': r.emoji, 'user_id': r.user_id, 'display_name': r.display_name}
                    for r in m.reactions.all()
                ],
            })
        return result

    @database_sync_to_async
    def save_message(self, content):
        stored_role = 'support' if self.user_role == 'admin' else self.user_role
        thread = Thread.objects.get(id=self.thread_id)
        msg = Message.objects.create(
            thread=thread,
            sender_id=self.user_id,
            sender_name=self.display_name,
            sender_role=stored_role,
            content=content,
        )
        thread.updated_at = timezone.now()
        thread.save(update_fields=['updated_at'])

        needs_ai = (stored_role == 'client' and thread.is_ai_support and not thread.escalated_to_human)

        return {
            'id': msg.id,
            'content': msg.content,
            'sender_id': msg.sender_id,
            'sender_name': msg.sender_name,
            'sender_role': msg.sender_role,
            'created_at': msg.created_at.isoformat(),
        }, needs_ai, thread.case_id

    @database_sync_to_async
    def save_ai_message(self, content):
        thread = Thread.objects.get(id=self.thread_id)
        msg = Message.objects.create(
            thread=thread,
            sender_id='ai',
            sender_name='LawBridge AI',
            sender_role='support',
            content=content,
            is_ai=True,
        )
        return {
            'id': msg.id,
            'content': msg.content,
            'created_at': msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def toggle_reaction(self, message_id, emoji):
        obj, created = MessageReaction.objects.get_or_create(
            message_id=message_id,
            user_id=self.user_id,
            emoji=emoji,
            defaults={'display_name': self.display_name},
        )
        if not created:
            obj.delete()
            return False
        return True

    @database_sync_to_async
    def mark_read(self):
        ThreadParticipant.objects.filter(
            thread_id=self.thread_id,
            user_id=self.user_id,
        ).update(last_read_at=timezone.now())

    @database_sync_to_async
    def update_thread_timestamp(self):
        Thread.objects.filter(id=self.thread_id).update(updated_at=timezone.now())
