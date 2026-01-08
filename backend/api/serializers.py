from rest_framework import serializers
from .models import Team, Player, Match, Innings, Delivery

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'team', 'is_captain']

class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'players']

class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = '__all__'

class InningsSerializer(serializers.ModelSerializer):
    batting_team_name = serializers.CharField(source='batting_team.name', read_only=True)
    bowling_team_name = serializers.CharField(source='bowling_team.name', read_only=True)
    deliveries = DeliverySerializer(many=True, read_only=True)

    class Meta:
        model = Innings
        fields = ['id', 'match', 'innings_number', 'batting_team', 'bowling_team', 
                  'batting_team_name', 'bowling_team_name', 'is_declared', 'is_completed',
                  'total_runs', 'total_wickets', 'overs_bowled', 'deliveries']

class MatchSerializer(serializers.ModelSerializer):
    team_a_details = TeamSerializer(source='team_a', read_only=True)
    team_b_details = TeamSerializer(source='team_b', read_only=True)
    innings = InningsSerializer(many=True, read_only=True)
    
    winner_details = TeamSerializer(source='winner', read_only=True)
    man_of_match_details = PlayerSerializer(source='man_of_match', read_only=True)
    best_batsman_details = PlayerSerializer(source='best_batsman', read_only=True)
    best_bowler_details = PlayerSerializer(source='best_bowler', read_only=True)
    
    class Meta:
        model = Match
        fields = ['id', 'format', 'custom_overs', 'last_man_standing', 'team_a', 'team_b', 
                  'team_a_details', 'team_b_details', 'toss_winner', 'toss_decision', 
                  'status', 'winner', 'winner_details', 
                  'man_of_match', 'man_of_match_details',
                  'best_batsman', 'best_batsman_details',
                  'best_bowler', 'best_bowler_details',
                  'innings']
