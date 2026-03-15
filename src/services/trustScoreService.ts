/**
 * Trust Score Service
 * Evaluates post credibility using ML scoring, spam detection, and content analysis
 */

import type { AIStatus } from "@/models/Post";

export interface TrustScoreResult {
  trustScore: number;
  status: AIStatus;
  flags: string[];
  reasons: string[];
}

class TrustScoreService {
  /**
   * Evaluate post credibility
   * Returns a score between 0 and 1
   * Uses local heuristics (no external API call for now)
   */
  async evaluatePostCredibility(title: string, content: string): Promise<TrustScoreResult> {
    try {
      const text = `${title} ${content}`.toLowerCase();
      const flags: string[] = [];
      const reasons: string[] = [];
      let trustScore = 0.75; // Start with neutral baseline

      // 1. Check for low-effort content
      const lowEffortScore = this.checkLowEffort(title, content, flags, reasons);
      trustScore *= lowEffortScore;

      // 2. Check for spam patterns
      const spamScore = this.checkSpamPatterns(text, flags, reasons);
      trustScore *= spamScore;

      // 3. Check for misinformation patterns
      const misinformationScore = this.checkMisinformation(text, flags, reasons);
      trustScore *= misinformationScore;

      // 4. Check for toxic/hateful content
      const toxicityScore = this.checkToxicity(text, flags, reasons);
      trustScore *= toxicityScore;

      // 5. Check for credential claims without evidence
      const credibilityScore = this.checkCredibilityMarkers(text, flags, reasons);
      trustScore *= credibilityScore;

      // Clamp score between 0 and 1
      trustScore = Math.max(0, Math.min(1, trustScore));

      // Determine status based on score and flags
      const status = this.determineStatus(trustScore, flags);

      return {
        trustScore,
        status,
        flags,
        reasons,
      };
    } catch (error) {
      console.error("[TrustScoreService] Error evaluating credibility:", error);
      // Default to pending status on error
      return {
        trustScore: 0.5,
        status: "pending",
        flags: ["evaluation_error"],
        reasons: ["Failed to evaluate post credibility"],
      };
    }
  }

  private checkLowEffort(title: string, content: string, flags: string[], reasons: string[]): number {
    let score = 1.0;

    // Very short content is low effort
    if (title.length < 10) {
      flags.push("suspiciously_short_title");
      reasons.push("Title is very short");
      score *= 0.6;
    }

    if (content && content.length < 20) {
      flags.push("minimal_content");
      reasons.push("Post content is minimal");
      score *= 0.5;
    }

    // Mostly links/emojis
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    const emojiCount = (content.match(/[\p{Emoji}]/gu) || []).length;
    const textLength = content.replace(/https?:\/\/\S+|\p{Emoji}/gu, "").trim().length;

    if (linkCount > 3 && textLength < 50) {
      flags.push("spam_links");
      reasons.push("Excessive links with minimal text");
      score *= 0.4;
    }

    if (emojiCount > textLength / 2) {
      flags.push("low_effort_emoji");
      reasons.push("Excessive emoji usage");
      score *= 0.7;
    }

    return score;
  }

  private checkSpamPatterns(text: string, flags: string[], reasons: string[]): number {
    let score = 1.0;

    // All caps (except short words)
    const wordTokens = text.split(/\s+/).filter((w) => w.length > 3);
    const capsWords = wordTokens.filter((w) => w === w.toUpperCase());
    if (wordTokens.length > 5 && capsWords.length / wordTokens.length > 0.5) {
      flags.push("excessive_caps");
      reasons.push("Excessive capitalization");
      score *= 0.6;
    }

    // Repeated characters (e.g., "heyyyy" or "!!!!!!!")
    if (/(.)\1{3,}/g.test(text)) {
      flags.push("repeated_chars");
      reasons.push("Excessive character repetition");
      score *= 0.5;
    }

    // Obvious promotional spam patterns
    const promoKeywords = [
      "click here",
      "buy now",
      "limited offer",
      "act now",
      "exclusive deal",
      "call today",
      "guaranteed",
    ];
    const hasPromo = promoKeywords.some((kw) => text.includes(kw));
    if (hasPromo) {
      flags.push("promotional_language");
      reasons.push("Excessive promotional language detected");
      score *= 0.4;
    }

    return score;
  }

  private checkMisinformation(text: string, flags: string[], reasons: string[]): number {
    let score = 1.0;

    // Misinformation keywords and patterns
    const misinfoKeywords = [
      "100% guaranteed",
      "secret",
      "they don't want you to know",
      "wake up",
      "do your own research",
      "big pharma",
      "government conspiracy",
    ];

    const hasMisinfo = misinfoKeywords.some((kw) => text.toLowerCase().includes(kw));
    if (hasMisinfo) {
      flags.push("misinformation_keywords");
      reasons.push("Contains common misinformation rhetoric");
      score *= 0.4;
    }

    // Making false medical/legal claims
    if (/cure[ds]?|treat[s]?|heal[s]?.*(?:cancer|covid|diabetes|heart)/i.test(text)) {
      flags.push("false_medical_claims");
      reasons.push("May contain false medical claims");
      score *= 0.2;
    }

    // All-or-nothing statements
    if (/(all|everyone|never) (will|can|should) (win|profit|succeed|gain)/i.test(text)) {
      flags.push("extreme_claims");
      reasons.push("Contains extreme or unrealistic claims");
      score *= 0.5;
    }

    return score;
  }

  private checkToxicity(text: string, flags: string[], reasons: string[]): number {
    let score = 1.0;

    // Hate speech indicators (basic)
    const hateSpeechPatterns = [
      /\b(hate|despise)\s+(all\s+)?[\w\s]+(people|group|race|gender)/i,
      /should\s+(all\s+)?[\w\s]+(die|burn|suffer)/i,
    ];

    const hasToxic = hateSpeechPatterns.some((pattern) => pattern.test(text));
    if (hasToxic) {
      flags.push("hateful_content");
      reasons.push("Contains hateful or discriminatory language");
      score *= 0.1;
    }

    return score;
  }

  private checkCredibilityMarkers(text: string, flags: string[], reasons: string[]): number {
    let score = 1.0;

    // Positive credibility markers
    const evidenceMarkers = [
      "study shows",
      "research indicates",
      "according to",
      "data suggests",
      "here's why",
      "let me explain",
    ];
    const hasEvidence = evidenceMarkers.some((marker) => text.includes(marker));

    if (hasEvidence) {
      score *= 1.1; // Slight boost for explanatory tone
    }

    // Bold/unfounded claims without reasoning
    if (/(obviously|clearly|definitely|absolutely) .{20,50}(because|since)/.test(text) == false) {
      if (/^(obviously|clearly|definitely|absolutely) .{50,}/i.test(text)) {
        flags.push("unsubstantiated_claims");
        reasons.push("Makes claims without clear reasoning");
        score *= 0.7;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private determineStatus(score: number, flags: string[]): AIStatus {
    // Reject if score is too low or has major red flags
    if (
      score < 0.3 ||
      flags.includes("hateful_content") ||
      flags.includes("false_medical_claims") ||
      flags.includes("spam_links")
    ) {
      return "rejected";
    }

    // Approve if score is good and no major concerns
    if (score >= 0.7 && !flags.includes("misinformation_keywords")) {
      return "approved";
    }

    // Everything else is pending for manual review
    return "pending";
  }
}

export const trustScoreService = new TrustScoreService();
