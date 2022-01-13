from django.contrib import admin

from .models import User, Email

# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'date_joined', 'is_active', 'is_staff', 'is_superuser')
    ordering = ('username',)
    search_fields = ('username', 'email')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'date_joined',)

class EmailAdmin(admin.ModelAdmin):
    list_display = ('sender', 'subject', 'body', 'timestamp', 'read', 'archived')
    ordering = ('-timestamp',)
    search_fields = ('body', 'subject')
    list_filter = ('read', 'archived',)

admin.site.register(User, UserAdmin)
admin.site.register(Email, EmailAdmin)