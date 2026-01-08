from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, TeamViewSet, PlayerViewSet

router = DefaultRouter()
router.register(r'matches', MatchViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'players', PlayerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
