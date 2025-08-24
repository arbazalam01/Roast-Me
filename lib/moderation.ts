// Content moderation utilities

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  filteredContent?: string;
}

// Basic profanity and spam detection
const BANNED_WORDS = [
  // Explicit profanity
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
  // Hate speech indicators
  'hate', 'kill', 'die', 'stupid', 'idiot', 'retard',
  // Spam indicators
  'click here', 'buy now', 'free money', 'earn money', 'make money',
  'viagra', 'crypto', 'bitcoin', 'investment', 'lottery',
  // Personal information attempts
  'phone', 'email', 'address', 'contact me', 'call me',
  // Inappropriate content
  'nude', 'naked', 'sex', 'porn', 'adult'
];

const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Repeated characters (aaaaa, 11111)
  /\b\w*\.com\b/gi, // Website URLs
  /\b\w*\.org\b/gi,
  /\b\w*\.net\b/gi,
  /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
  /\b\w+@\w+\.\w+\b/g, // Email addresses
  /[A-Z]{5,}/g, // Excessive caps
];

const POSITIVE_WORDS = [
  'amazing', 'awesome', 'brilliant', 'fantastic', 'great', 'excellent',
  'wonderful', 'outstanding', 'superb', 'magnificent', 'impressive',
  'creative', 'talented', 'inspiring', 'beautiful', 'kind', 'thoughtful'
];

export function moderateContent(content: string): ModerationResult {
  const normalizedContent = content.toLowerCase().trim();
  
  // Check for empty or too short content
  if (!normalizedContent || normalizedContent.length < 3) {
    return {
      isAllowed: false,
      reason: "Message is too short"
    };
  }
  
  // Check for excessive length (should be caught by word count, but double-check)
  if (content.length > 500) {
    return {
      isAllowed: false,
      reason: "Message is too long"
    };
  }
  
  // Check for banned words
//   for (const word of BANNED_WORDS) {
//     if (normalizedContent.includes(word.toLowerCase())) {
//       return {
//         isAllowed: false,
//         reason: "Message contains inappropriate content"
//       };
//     }
//   }
  
  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isAllowed: false,
        reason: "Message appears to be spam"
      };
    }
  }
  
  // Check for excessive repetition of words
  const words = normalizedContent.split(/\s+/);
  const wordCounts = new Map<string, number>();
  
  for (const word of words) {
    if (word.length > 2) { // Only count meaningful words
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }
  
  // If any word appears more than 3 times in a short message, flag as spam
  for (const word of Array.from(wordCounts.keys())) {
    const count = wordCounts.get(word)!;
    if (count > 3 && words.length < 20) {
      return {
        isAllowed: false,
        reason: "Message contains excessive repetition"
      };
    }
  }
  
  // All checks passed
  return {
    isAllowed: true,
    filteredContent: content.trim()
  };
}

export function suggestPositiveAlternatives(): string[] {
  // Return a few random positive suggestions
  const shuffled = POSITIVE_WORDS.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export function isLikelyConstructive(content: string): boolean {
  const normalizedContent = content.toLowerCase();
  
  // Check for positive words
  const positiveWordCount = POSITIVE_WORDS.filter(word => 
    normalizedContent.includes(word)
  ).length;
  
  // Check for question words (constructive engagement)
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'which'];
  const hasQuestions = questionWords.some(word => 
    normalizedContent.includes(word)
  );
  
  // Check for constructive phrases
  const constructivePhrases = [
    'i think', 'in my opinion', 'what if', 'have you considered',
    'maybe', 'perhaps', 'could', 'might', 'suggestion'
  ];
  const hasConstructiveLanguage = constructivePhrases.some(phrase => 
    normalizedContent.includes(phrase)
  );
  
  return positiveWordCount > 0 || hasQuestions || hasConstructiveLanguage;
}

export function calculateContentScore(content: string): number {
  let score = 50; // Start with neutral score
  
  const normalizedContent = content.toLowerCase();
  
  // Positive factors
  if (isLikelyConstructive(content)) score += 20;
  
  // Check length (sweet spot is 10-25 words)
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount >= 10 && wordCount <= 25) score += 10;
  
  // Proper punctuation and capitalization
  if (/[.!?]$/.test(content.trim())) score += 5;
  if (/^[A-Z]/.test(content.trim())) score += 5;
  
  // Negative factors
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 2) score -= 10;
  
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  if (capsCount > content.length * 0.3) score -= 15; // Too many caps
  
  return Math.max(0, Math.min(100, score));
}