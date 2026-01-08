from django.db import models

class Team(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Player(models.Model):
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players')
    is_captain = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} ({self.team.name})"

class Match(models.Model):
    FORMAT_CHOICES = (
        ('T20', 'T20'),
        ('TEST', 'Test Match'),
    )
    STATUS_CHOICES = (
        ('SETUP', 'Setup'),
        ('LIVE', 'Live'),
        ('COMPLETED', 'Completed'),
    )
    TOSS_DECISION_CHOICES = (
        ('BAT', 'Bat'),
        ('BOWL', 'Bowl'),
    )

    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    custom_overs = models.IntegerField(null=True, blank=True, help_text="Total overs per innings for limited overs")
    last_man_standing = models.BooleanField(default=False)
    
    team_a = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='matches_as_team_a')
    team_b = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='matches_as_team_b')
    
    toss_winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='toss_wins')
    toss_decision = models.CharField(max_length=4, choices=TOSS_DECISION_CHOICES, null=True, blank=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='SETUP')
    created_at = models.DateTimeField(auto_now_add=True)
    
    winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='matches_won')
    man_of_match = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='mom_awards')
    best_batsman = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='best_batsman_awards')
    best_bowler = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='best_bowler_awards')

    def __str__(self):
        return f"{self.team_a} vs {self.team_b} ({self.format})"

class Innings(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='innings')
    innings_number = models.IntegerField()
    batting_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='batting_innings')
    bowling_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='bowling_innings')
    
    is_declared = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    
    # Cached totals for easier querying
    total_runs = models.IntegerField(default=0)
    total_wickets = models.IntegerField(default=0)
    overs_bowled = models.FloatField(default=0.0)

    class Meta:
        ordering = ['innings_number']

    def __str__(self):
        return f"Innings {self.innings_number}: {self.batting_team.name}"

class Delivery(models.Model):
    EXTRA_TYPES = (
        ('WD', 'Wide'),
        ('NB', 'No Ball'),
        ('B', 'Bye'),
        ('LB', 'Leg Bye'),
        ('NONE', 'None'),
    )
    WICKET_TYPES = (
        ('BOWLED', 'Bowled'),
        ('CAUGHT', 'Caught'),
        ('LBW', 'LBW'),
        ('RUN_OUT', 'Run Out'),
        ('STUMPED', 'Stumped'),
        ('HIT_WICKET', 'Hit Wicket'),
        ('NONE', 'None'),
    )

    innings = models.ForeignKey(Innings, on_delete=models.CASCADE, related_name='deliveries')
    over_number = models.IntegerField()
    ball_number = models.IntegerField() # Ball number within the over (1-6+)
    
    batsman = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='balls_faced')
    non_striker = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='non_striker_balls')
    bowler = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='balls_bowled')
    
    runs_batter = models.IntegerField(default=0)
    extras = models.IntegerField(default=0)
    extra_type = models.CharField(max_length=5, choices=EXTRA_TYPES, default='NONE')
    
    is_wicket = models.BooleanField(default=False)
    wicket_type = models.CharField(max_length=10, choices=WICKET_TYPES, default='NONE')
    player_out = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='outs')
    catcher = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='catches')
    
    # Store snapshot state for Undo functionality
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['innings', 'over_number', 'ball_number']

    def __str__(self):
        return f"{self.over_number}.{self.ball_number} - {self.batsman} to {self.bowler}"
