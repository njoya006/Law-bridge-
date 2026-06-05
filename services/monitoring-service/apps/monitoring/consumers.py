import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import CaseProgressSnapshot

class CaseTimelineConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.case_id = self.scope['url_route']['kwargs']['case_id']
        self.room_group_name = f'case_{self.case_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        snapshot = await self.get_snapshot()
        if snapshot:
            await self.send(text_data=json.dumps({
                'type': 'case_snapshot',
                'data': {
                    'case_id': str(snapshot.case_id),
                    'status': snapshot.status,
                    'updated_at': snapshot.updated_at.isoformat(),
                }
            }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def case_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'case_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_snapshot(self):
        try:
            return CaseProgressSnapshot.objects.get(case_id=self.case_id)
        except CaseProgressSnapshot.DoesNotExist:
            return None
