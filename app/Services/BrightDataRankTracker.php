<?php
namespace App\Services;

/**
 * Bright Data SERP API Rank Tracking Engine
 */
class BrightDataRankTracker {
    protected string $apiToken;
    protected string $zone;
    protected int $depthLimit;

    public function __construct(string $apiToken, string $zone = 'serp_google_desktop_zone', int $depthLimit = 100) {
        $this->apiToken = $apiToken;
        $this->zone = $zone;
        $this->depthLimit = $depthLimit;
    }

    public function checkKeywordRank(string $keyword, string $targetUrl, string $country = 'USA', string $device = 'desktop'): array {
        $endpoint = "https://api.brightdata.com/serp/req";
        
        $params = [
            'zone' => $this->zone,
            'url' => "https://www.google.com/search?q=" . urlencode($keyword) . "&gl=" . strtolower($country) . "&hl=en&num=" . $this->depthLimit,
            'format' => 'raw'
        ];

        $ch = curl_init($endpoint . '?' . http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$this->apiToken}",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            return [
                'success' => false,
                'rank' => null,
                'ranked_url' => null,
                'error' => "Bright Data API HTTP {$httpCode}"
            ];
        }

        $data = json_decode($response, true);
        $rank = null;
        $rankedUrl = null;

        if (isset($data['organic']) && is_array($data['organic'])) {
            foreach ($data['organic'] as $item) {
                if (isset($item['link']) && strpos($item['link'], $targetUrl) !== false) {
                    $rank = $item['rank'] ?? null;
                    $rankedUrl = $item['link'] ?? null;
                    break;
                }
            }
        }

        return [
            'success' => true,
            'rank' => $rank,
            'ranked_url' => $rankedUrl,
            'serp_features' => $data['serp_features'] ?? []
        ];
    }
}
