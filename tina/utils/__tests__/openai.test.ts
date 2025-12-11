// Quick manual test - run in browser console
import { generateExcerpt, generateTags } from '../openai';

// Test excerpt generation
await generateExcerpt('M42 Dobsonian Telescope', 'telescope');

// Test tags
await generateTags('M42 Telescope', 'A telescope for viewing the Orion Nebula');