<?php
namespace App\Services;

/**
 * Declining Pages Engine & Priority Scoring
 */
class DecliningPagesEngine {
    public function calculateDecliningPages(array $currentPeriodMetrics, array $previousPeriodMetrics, array $gscQueries = [], float $declineThreshold = 20.0): array {
        $declining = [];
        
        foreach ($currentPeriodMetrics as $path => $cur) {
            $prev = $previousPeriodMetrics[$path] ?? null;
            if (!$prev || ($prev['sessions'] ?? 0) < 30) continue;

            $diff = ($cur['sessions'] ?? 0) - ($prev['sessions'] ?? 0);
            if ($diff >= 0) continue; // Not declining

            $absLoss = abs($diff);
            $dropPct = ($absLoss / $prev['sessions']) * 100.0;

            if ($dropPct < $declineThreshold) continue;

            // Compute priority score (0-100)
            $lossPart = min(100, ($absLoss / 50)) * 0.40;
            $dropPctPart = min(100, $dropPct) * 0.35;
            $baseVolPart = min(100, ($prev['sessions'] / 100)) * 0.15;
            $convLoss = max(0, ($prev['conversions'] ?? 0) - ($cur['conversions'] ?? 0));
            $convPart = min(100, $convLoss * 15) * 0.10;

            $priorityScore = round($lossPart + $dropPctPart + $baseVolPart + $convPart);

            $declining[] = [
                'page_path' => $path,
                'current_sessions' => $cur['sessions'] ?? 0,
                'previous_sessions' => $prev['sessions'] ?? 0,
                'absolute_loss' => $absLoss,
                'drop_percentage' => round($dropPct, 1),
                'priority_score' => $priorityScore,
                'priority_level' => $priorityScore >= 70 ? 'critical' : ($priorityScore >= 50 ? 'high' : 'medium'),
                'top_losing_queries' => $gscQueries[$path] ?? []
            ];
        }

        usort($declining, fn($a, $b) => $b['priority_score'] <=> $a['priority_score']);
        return $declining;
    }
}
