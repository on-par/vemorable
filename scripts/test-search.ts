#!/usr/bin/env node

/**
 * Test script for vector search functionality
 * Run with: npx tsx scripts/test-search.ts
 */

import { generateNoteEmbedding, generateQueryEmbedding, formatEmbeddingForPgVector } from '../src/lib/embeddings'

// Sample test data
const sampleNotes = [
  {
    title: "Meeting with Product Team",
    content: "Discussed the new feature roadmap for Q4. We need to prioritize mobile app development and improve user onboarding experience. The team agreed on a two-week sprint cycle.",
    tags: ["meeting", "product", "roadmap", "mobile"]
  },
  {
    title: "JavaScript Performance Tips",
    content: "Key performance optimizations: Use requestAnimationFrame for animations, implement virtual scrolling for long lists, lazy load images, and minimize DOM manipulations. Consider using Web Workers for heavy computations.",
    tags: ["javascript", "performance", "optimization", "web development"]
  },
  {
    title: "Machine Learning Project Ideas",
    content: "Potential ML projects to explore: sentiment analysis for customer reviews, recommendation system for e-commerce, image classification for medical diagnosis, and natural language processing for chatbots.",
    tags: ["machine learning", "ai", "projects", "nlp"]
  },
  {
    title: "Healthy Recipe: Quinoa Salad",
    content: "Ingredients: quinoa, cherry tomatoes, cucumber, feta cheese, olive oil, lemon juice. Cook quinoa for 15 minutes, let it cool, mix with chopped vegetables and feta, dress with olive oil and lemon.",
    tags: ["recipe", "healthy", "cooking", "vegetarian"]
  },
  {
    title: "React Best Practices",
    content: "Important React patterns: Use custom hooks for logic reuse, implement error boundaries, optimize with React.memo and useMemo, follow the single responsibility principle for components, and maintain proper state management.",
    tags: ["react", "javascript", "frontend", "best practices"]
  }
]

const testQueries = [
  "Tell me about the product roadmap",
  "JavaScript optimization techniques",
  "Machine learning and AI",
  "Healthy cooking recipes",
  "React development patterns",
  "Mobile app development priorities",
  "Performance improvements for web applications"
]

async function testEmbeddingGeneration() {
  console.log('🧪 Testing Embedding Generation...\n')
  
  try {
    // Test generating embeddings for sample notes
    for (const note of sampleNotes.slice(0, 2)) {
      console.log(`📝 Generating embedding for: "${note.title}"`)
      const embedding = await generateNoteEmbedding(note.title, note.content, note.tags)
      console.log(`✅ Generated embedding with ${embedding.embedding.length} dimensions`)
      console.log(`   Model: ${embedding.model}`)
      console.log(`   Tokens used: ${embedding.usage.total_tokens}\n`)
    }
    
    console.log('✅ Embedding generation test passed!\n')
    return true
  } catch (error) {
    console.error('❌ Embedding generation test failed:', error)
    return false
  }
}

async function testQueryEmbedding() {
  console.log('🔍 Testing Query Embedding...\n')
  
  try {
    for (const query of testQueries.slice(0, 3)) {
      console.log(`🔎 Generating embedding for query: "${query}"`)
      const embedding = await generateQueryEmbedding(query)
      console.log(`✅ Generated query embedding with ${embedding.embedding.length} dimensions\n`)
    }
    
    console.log('✅ Query embedding test passed!\n')
    return true
  } catch (error) {
    console.error('❌ Query embedding test failed:', error)
    return false
  }
}

async function testVectorFormatting() {
  console.log('📊 Testing Vector Formatting...\n')
  
  try {
    const testVector = [0.1, 0.2, 0.3, 0.4, 0.5]
    const formatted = formatEmbeddingForPgVector(testVector)
    console.log(`Original vector: [${testVector.join(', ')}]`)
    console.log(`Formatted for pgvector: ${formatted}`)
    
    if (formatted === '[0.1,0.2,0.3,0.4,0.5]') {
      console.log('✅ Vector formatting test passed!\n')
      return true
    } else {
      console.error('❌ Vector formatting test failed: incorrect format\n')
      return false
    }
  } catch (error) {
    console.error('❌ Vector formatting test failed:', error)
    return false
  }
}

async function testSimilarityCalculation() {
  console.log('📐 Testing Similarity Calculation...\n')
  
  try {
    // Generate embeddings for two similar notes
    const note1 = sampleNotes[1] // JavaScript Performance
    const note2 = sampleNotes[4] // React Best Practices (both are about JavaScript)
    
    console.log(`Comparing: "${note1.title}" vs "${note2.title}"`)
    
    const embedding1 = await generateNoteEmbedding(note1.title, note1.content, note1.tags)
    const embedding2 = await generateNoteEmbedding(note2.title, note2.content, note2.tags)
    
    // Calculate cosine similarity manually
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < embedding1.embedding.length; i++) {
      dotProduct += embedding1.embedding[i] * embedding2.embedding[i]
      norm1 += embedding1.embedding[i] * embedding1.embedding[i]
      norm2 += embedding2.embedding[i] * embedding2.embedding[i]
    }
    
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
    console.log(`Cosine similarity: ${similarity.toFixed(4)}`)
    
    // Now test with an unrelated note
    const note3 = sampleNotes[3] // Healthy Recipe
    console.log(`\nComparing: "${note1.title}" vs "${note3.title}"`)
    
    const embedding3 = await generateNoteEmbedding(note3.title, note3.content, note3.tags)
    
    dotProduct = 0
    let norm3 = 0
    
    for (let i = 0; i < embedding1.embedding.length; i++) {
      dotProduct += embedding1.embedding[i] * embedding3.embedding[i]
      norm3 += embedding3.embedding[i] * embedding3.embedding[i]
    }
    
    const similarity2 = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm3))
    console.log(`Cosine similarity: ${similarity2.toFixed(4)}`)
    
    if (similarity > similarity2) {
      console.log('\n✅ Similarity calculation test passed! Related notes have higher similarity.\n')
      return true
    } else {
      console.log('\n⚠️  Warning: Unrelated notes showed higher similarity.\n')
      return false
    }
  } catch (error) {
    console.error('❌ Similarity calculation test failed:', error)
    return false
  }
}

async function runAllTests() {
  console.log('='.repeat(60))
  console.log('🚀 Starting Vector Search Functionality Tests')
  console.log('='.repeat(60) + '\n')
  
  const results = []
  
  // Run all tests
  results.push(await testVectorFormatting())
  results.push(await testEmbeddingGeneration())
  results.push(await testQueryEmbedding())
  results.push(await testSimilarityCalculation())
  
  // Summary
  console.log('='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r).length
  const failed = results.filter(r => !r).length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed successfully!')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.')
  }
  
  console.log('\n📌 Note: To fully test the search functionality:')
  console.log('1. Run the migration in Supabase SQL Editor (002_search_functions.sql)')
  console.log('2. Create some notes through the API')
  console.log('3. Test the /api/search endpoint with various queries')
  console.log('4. Verify results are sorted by relevance')
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

export { testEmbeddingGeneration, testQueryEmbedding, testVectorFormatting, testSimilarityCalculation }