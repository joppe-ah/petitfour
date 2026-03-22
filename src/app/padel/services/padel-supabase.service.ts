import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { PadelMatch } from '../models/match.model';
import { PadelPlayer } from '../models/player.model';

// ── DB → TypeScript mappers ───────────────────────────────────

function rowToPlayer(row: any): PadelPlayer {
  return {
    id: row.id,
    name: row.name,
    avatarInitials: row.avatar_initials ?? row.name.slice(0, 2).toUpperCase(),
    color: row.color ?? '#1D9E75',
    type: row.type ?? 'external',
  };
}

function rowToMatch(row: any): PadelMatch {
  return {
    id: row.id,
    date: new Date(row.date),
    location: row.location ?? '',
    teamA: { player1Id: row.team_a_player1_id, player2Id: row.team_a_player2_id },
    teamB: { player1Id: row.team_b_player1_id, player2Id: row.team_b_player2_id },
    winner: row.winner,
    notes: row.notes ?? undefined,
    sets: (row.padel_sets ?? [])
      .slice()
      .sort((a: any, b: any) => a.set_number - b.set_number)
      .map((s: any) => ({ teamAScore: s.team_a_score, teamBScore: s.team_b_score })),
  };
}

@Injectable({ providedIn: 'root' })
export class PadelSupabaseService {
  private supabase = inject(SupabaseService);

  loadPlayers(familyId: string): Observable<PadelPlayer[]> {
    return from(
      this.supabase.client
        .from('padel_players')
        .select('*')
        .eq('family_id', familyId)
        .order('name'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToPlayer);
      }),
    );
  }

  loadMatches(familyId: string): Observable<PadelMatch[]> {
    return from(
      this.supabase.client
        .from('padel_matches')
        .select('*, padel_sets(*)')
        .eq('family_id', familyId)
        .order('date', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToMatch);
      }),
    );
  }

  saveMatch(match: Omit<PadelMatch, 'id'>, familyId: string, userId: string): Observable<PadelMatch> {
    const id = crypto.randomUUID();
    const client = this.supabase.client;

    return from(
      client.from('padel_matches').insert({
        id,
        family_id: familyId,
        created_by: userId,
        date: match.date instanceof Date ? match.date.toISOString() : match.date,
        location: match.location ?? null,
        team_a_player1_id: match.teamA.player1Id,
        team_a_player2_id: match.teamA.player2Id,
        team_b_player1_id: match.teamB.player1Id,
        team_b_player2_id: match.teamB.player2Id,
        winner: match.winner,
        notes: match.notes ?? null,
      }),
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        const setsRows = match.sets.map((s, i) => ({
          match_id: id,
          set_number: i + 1,
          team_a_score: s.teamAScore,
          team_b_score: s.teamBScore,
        }));
        return from(client.from('padel_sets').insert(setsRows));
      }),
      map(({ error }) => {
        if (error) throw error;
        return { ...match, id } as PadelMatch;
      }),
    );
  }

  deleteMatch(id: string): Observable<void> {
    return from(
      this.supabase.client.from('padel_matches').delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  savePlayer(player: Omit<PadelPlayer, 'id'>, familyId: string, userId: string): Observable<PadelPlayer> {
    return from(
      this.supabase.client
        .from('padel_players')
        .insert({
          family_id: familyId,
          created_by: userId,
          name: player.name,
          avatar_initials: player.avatarInitials,
          color: player.color,
          type: player.type,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToPlayer(data);
      }),
    );
  }
}
