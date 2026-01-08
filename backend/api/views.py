from rest_framework import viewsets, status, decorators
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Match, Team, Player, Innings, Delivery
from .serializers import MatchSerializer, TeamSerializer, PlayerSerializer, InningsSerializer, DeliverySerializer

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        
        # Create Team A
        team_a_data = data.get('team_a')
        team_a = Team.objects.create(name=team_a_data['name'])
        for p in team_a_data['players']:
            Player.objects.create(name=p['name'], team=team_a, is_captain=p.get('is_captain', False))
            
        # Create Team B
        team_b_data = data.get('team_b')
        team_b = Team.objects.create(name=team_b_data['name'])
        for p in team_b_data['players']:
            Player.objects.create(name=p['name'], team=team_b, is_captain=p.get('is_captain', False))
            
        # Create Match
        match = Match.objects.create(
            format=data['format'],
            custom_overs=data.get('custom_overs'),
            last_man_standing=data.get('last_man_standing', False),
            team_a=team_a,
            team_b=team_b,
            status='SETUP'
        )
        
        serializer = self.get_serializer(match)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=['post'])
    def toss(self, request, pk=None):
        match = self.get_object()
        winner_id = request.data.get('winner_id')
        decision = request.data.get('decision') # BAT or BOWL
        
        match.toss_winner_id = winner_id
        match.toss_decision = decision
        match.status = 'LIVE'
        match.save()
        
        # Initialize First Innings
        batting_team_id = winner_id if decision == 'BAT' else (match.team_a_id if match.team_b_id == winner_id else match.team_b_id)
        bowling_team_id = match.team_b_id if batting_team_id == match.team_a_id else match.team_a_id
        
        Innings.objects.create(
            match=match,
            innings_number=1,
            batting_team_id=batting_team_id,
            bowling_team_id=bowling_team_id
        )
        
        return Response(self.get_serializer(match).data)

    @decorators.action(detail=True, methods=['post'])
    def bowl(self, request, pk=None):
        match = self.get_object()
        innings = match.innings.order_by('-innings_number').first()
        if not innings or innings.is_completed:
            return Response({"error": "No active innings"}, status=400)

        data = request.data
        
        # Enforce: a bowler cannot bowl consecutive overs
        # Determine start of over and previous over's bowler from last legal ball
        prev_legal_qs = Delivery.objects.filter(innings=innings).exclude(extra_type__in=['WD', 'NB']).order_by('-over_number', '-ball_number')
        legal_balls_before = prev_legal_qs.count()
        start_of_over = (legal_balls_before % 6) == 0
        last_legal = prev_legal_qs.first()
        if start_of_over and last_legal and data.get('bowler_id') == last_legal.bowler_id:
            return Response({"error": "Bowler cannot bowl consecutive overs"}, status=400)
        
        # Create Delivery
        delivery = Delivery.objects.create(
            innings=innings,
            over_number=data['over_number'],
            ball_number=data['ball_number'],
            batsman_id=data['batsman_id'],
            # Allow this to be None for Last Man Standing
            non_striker_id=data.get('non_striker_id'), 
            bowler_id=data['bowler_id'],
            runs_batter=data.get('runs_batter', 0),
            extras=data.get('extras', 0),
            extra_type=data.get('extra_type', 'NONE'),
            is_wicket=data.get('is_wicket', False),
            wicket_type=data.get('wicket_type', 'NONE'),
            player_out_id=data.get('player_out_id'),
            catcher_id=data.get('catcher_id')
        )
        
        # Update Innings Stats
        total_runs = innings.total_runs + delivery.runs_batter + delivery.extras
        innings.total_runs = total_runs
        
        if delivery.is_wicket:
            innings.total_wickets += 1
            
        # Update Overs
        # Logic: If legal delivery (not WD or NB), increment ball count
        is_legal = delivery.extra_type not in ['WD', 'NB']
        if is_legal:
            # Simple float representation for overs (e.g. 0.1, 0.2 ... 0.5, 1.0)
            # This is tricky with float math, better to store balls and convert.
            # But for now, let's just use the current over_number and ball_number from FE or calculate
            # We will rely on FE to send correct over/ball number or calculate it here.
            # Let's calculate from DB count of legal deliveries
            legal_balls = Delivery.objects.filter(innings=innings, extra_type__in=['NONE', 'B', 'LB']).count()
            overs = legal_balls // 6
            balls = legal_balls % 6
            innings.overs_bowled = float(f"{overs}.{balls}")
            
        innings.save()
        
        # Check logic for Innings End (All out or Overs limit)
        team_size = innings.batting_team.players.count()
        is_all_out = innings.total_wickets >= (team_size if match.last_man_standing else max(0, team_size - 1))
        
        is_overs_limit = False
        # Calculate max overs (handle custom_overs or default T20)
        max_overs = match.custom_overs if match.custom_overs else 20
        
        if match.format == 'T20' and innings.overs_bowled >= max_overs:
            is_overs_limit = True

        # Check if Target reached (for 2nd innings)
        is_target_reached = False
        if innings.innings_number == 2:
            first_inn = match.innings.get(innings_number=1)
            if innings.total_runs > first_inn.total_runs:
                is_target_reached = True
                
        if is_all_out or is_overs_limit or is_target_reached or data.get('declare', False):
            innings.is_completed = True
            innings.save()
            
            # Start Next Innings if applicable
            if match.format == 'T20' and innings.innings_number == 1:
                Innings.objects.create(
                    match=match,
                    innings_number=2,
                    batting_team=innings.bowling_team,
                    bowling_team=innings.batting_team
                )
            elif match.format == 'T20' and innings.innings_number == 2:
                match.status = 'COMPLETED'
                # Determine winner
                inn1 = match.innings.get(innings_number=1)
                inn2 = innings
                if inn1.total_runs > inn2.total_runs:
                    match.winner = inn1.batting_team
                elif inn2.total_runs > inn1.total_runs:
                    match.winner = inn2.batting_team
                
                # Calculate Awards
                all_deliveries = Delivery.objects.filter(innings__match=match)
                
                # Best Batsman
                batsmen_stats = {} # id -> {runs: 0, balls: 0}
                for d in all_deliveries:
                    if d.batsman_id not in batsmen_stats:
                        batsmen_stats[d.batsman_id] = {'runs': 0, 'balls': 0}
                    batsmen_stats[d.batsman_id]['runs'] += d.runs_batter
                    if d.extra_type != 'WD':
                        batsmen_stats[d.batsman_id]['balls'] += 1
                
                if batsmen_stats:
                    # Sort by Runs (desc), then Balls (asc)
                    best_batsman_id = sorted(
                        batsmen_stats.keys(), 
                        key=lambda pid: (-batsmen_stats[pid]['runs'], batsmen_stats[pid]['balls'])
                    )[0]
                    match.best_batsman_id = best_batsman_id
                
                # Best Bowler
                bowler_stats = {} # id -> {wickets: 0, runs: 0}
                for d in all_deliveries:
                    if d.bowler_id not in bowler_stats:
                        bowler_stats[d.bowler_id] = {'wickets': 0, 'runs': 0}
                    
                    if d.is_wicket and d.wicket_type != 'RUN_OUT':
                        bowler_stats[d.bowler_id]['wickets'] += 1
                    
                    # Calculate runs conceded (batter runs + extras)
                    # Note: Byes/LegByes usually don't count to bowler, but for simplicity here we might include or exclude.
                    # Standard: Wides/NoBalls count to bowler.
                    run_cost = d.runs_batter
                    if d.extra_type in ['WD', 'NB']:
                        run_cost += d.extras
                    bowler_stats[d.bowler_id]['runs'] += run_cost

                if bowler_stats:
                    # Sort by Wickets (desc), then Runs Conceded (asc)
                    best_bowler_id = sorted(
                        bowler_stats.keys(),
                        key=lambda pid: (-bowler_stats[pid]['wickets'], bowler_stats[pid]['runs'])
                    )[0]
                    match.best_bowler_id = best_bowler_id
                
                # Man of Match (Simple: Max runs + 20 * wickets)
                mom_points = {}
                for pid, stats in batsmen_stats.items():
                    mom_points[pid] = mom_points.get(pid, 0) + stats['runs']
                for pid, stats in bowler_stats.items():
                    mom_points[pid] = mom_points.get(pid, 0) + (stats['wickets'] * 20)
                
                if mom_points:
                    mom_id = max(mom_points, key=mom_points.get)
                    match.man_of_match_id = mom_id

                match.save()
            # Add TEST logic similarly...

        return Response(self.get_serializer(match).data)

    @decorators.action(detail=True, methods=['get'])
    def scorecard(self, request, pk=None):
        match = self.get_object()
        # Return detailed scorecard data
        # This can be computed or retrieved.
        # For simplicity, returning the match serialization which includes innings/deliveries is often enough, 
        # but aggregated stats per player are better.
        return Response(self.get_serializer(match).data)

    @decorators.action(detail=True, methods=['post'])
    def undo(self, request, pk=None):
        match = self.get_object()
        innings = match.innings.order_by('-innings_number').first()
        if not innings:
            return Response({"error": "No innings found"}, status=400)
        last_delivery = Delivery.objects.filter(innings=innings).order_by('-over_number', '-ball_number', '-id').first()
        if not last_delivery:
            return Response({"error": "No deliveries to undo"}, status=400)
        
        innings.total_runs = max(0, innings.total_runs - (last_delivery.runs_batter + last_delivery.extras))
        if last_delivery.is_wicket:
            innings.total_wickets = max(0, innings.total_wickets - 1)
        last_delivery.delete()
        
        legal_balls = Delivery.objects.filter(innings=innings).exclude(extra_type__in=['WD', 'NB']).count()
        overs = legal_balls // 6
        balls = legal_balls % 6
        innings.overs_bowled = float(f"{overs}.{balls}")
        
        # If innings was completed due to last ball, re-evaluate completion
        team_size = innings.batting_team.players.count()
        is_all_out = innings.total_wickets >= (team_size if match.last_man_standing else max(0, team_size - 1))
        max_overs = match.custom_overs if match.custom_overs else 20
        is_overs_limit = (match.format == 'T20' and innings.overs_bowled >= max_overs)
        is_target_reached = False
        if innings.innings_number == 2:
            inn1 = match.innings.get(innings_number=1)
            if innings.total_runs > inn1.total_runs:
                is_target_reached = True
        
        if innings.is_completed and not (is_all_out or is_overs_limit or is_target_reached):
            innings.is_completed = False
            if match.status == 'COMPLETED':
                match.status = 'LIVE'
                match.winner = None
                match.best_batsman = None
                match.best_bowler = None
                match.man_of_match = None
                match.save()
        
        innings.save()
        return Response(self.get_serializer(match).data)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
